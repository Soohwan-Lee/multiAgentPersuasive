import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { runTurn } from '@/lib/orchestrator';

// 간단한 인메모리 레이트 리미터 (프로덕션에서는 Redis 사용 권장)
const rateLimitMap = new Map<string, number>();

const turnRequestSchema = z.object({
  participantId: z.string(),
  sessionKey: z.enum(['test', 'normative', 'informative']), // main1, main2를 normative, informative로 변경
  turnIndex: z.number().min(0).max(3),
  userMessage: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 체크
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { participantId, sessionKey, turnIndex, userMessage } = turnRequestSchema.parse(body);

    // 레이트 리미팅 체크 (3초당 1회)
    const rateLimitKey = `${participantId}:${sessionKey}`;
    const now = Date.now();
    const lastRequest = rateLimitMap.get(rateLimitKey);
    
    if (lastRequest && now - lastRequest < 3000) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 3 seconds.' },
        { status: 429 }
      );
    }
    rateLimitMap.set(rateLimitKey, now);

    // 멱등성 체크: 이미 존재하는 턴인지 확인
    const { data: existingTurn } = await supabase
      .from('turns')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .eq('t_idx', turnIndex)
      .single();

    if (existingTurn) {
      // 기존 턴의 메시지들 가져오기
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_key', sessionKey)
        .eq('t_idx', turnIndex)
        .order('ts', { ascending: true });

      return NextResponse.json({
        agent1: messages?.find((m: any) => m.role === 'agent1'),
        agent2: messages?.find((m: any) => m.role === 'agent2'),
        agent3: messages?.find((m: any) => m.role === 'agent3'),
        meta: {
          turn_index: turnIndex,
          session_key: sessionKey,
          participant_id: participantId,
        }
      });
    }

    // 사용자 메시지 저장
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        id: crypto.randomUUID(),
        participant_id: participantId,
        session_key: sessionKey,
        t_idx: turnIndex,
        role: 'user',
        content: userMessage,
      });

    if (userMsgError) {
      console.error('User message save error:', userMsgError);
    }

    // 새로운 오케스트레이터로 에이전트 응답 생성
    const result = await runTurn({
      participantId,
      sessionKey,
      turnIndex,
      userMessage,
    });

    // 세션의 현재 턴 업데이트
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ current_turn: turnIndex + 1 })
      .eq('participant_id', participantId)
      .eq('key', sessionKey);

    if (sessionError) {
      console.error('Session update error:', sessionError);
    }

    // 4턴 완료 시 세션 완료 처리
    if (turnIndex === 4) {
      const { error: completeError } = await supabase
        .from('sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('participant_id', participantId)
        .eq('key', sessionKey);

      if (completeError) {
        console.error('Session completion error:', completeError);
      }
    }

    return NextResponse.json({
      agent1: result.agent1,
      agent2: result.agent2,
      agent3: result.agent3,
      meta: {
        turn_index: turnIndex,
        session_key: sessionKey,
        participant_id: participantId,
        stances: result.meta.stances,
        latencies: result.meta.latencies,
      }
    });

  } catch (error) {
    console.error('Turn API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
