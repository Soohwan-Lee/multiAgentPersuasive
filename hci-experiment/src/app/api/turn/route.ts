import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { turnRequestSchema } from '@/lib/validations';
import { orchestrateAgents } from '@/lib/agents';

// 간단한 인메모리 레이트 리미터 (프로덕션에서는 Redis 사용 권장)
const rateLimitMap = new Map<string, number>();

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
        { error: '너무 빠른 요청입니다. 3초 후에 다시 시도해주세요.' },
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

    // 턴 생성
    const turnId = crypto.randomUUID();
    const { error: turnError } = await supabase
      .from('turns')
      .insert({
        id: turnId,
        participant_id: participantId,
        session_key: sessionKey,
        t_idx: turnIndex,
        user_msg: userMessage,
      });

    if (turnError) {
      console.error('Turn creation error:', turnError);
      return NextResponse.json(
        { error: '턴 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
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

    // 에이전트 오케스트레이션
    const agentResponses = await orchestrateAgents(userMessage);

    // 에이전트 응답들 저장
    const messageInserts = [
      {
        id: crypto.randomUUID(),
        participant_id: participantId,
        session_key: sessionKey,
        t_idx: turnIndex,
        role: 'agent1' as const,
        content: agentResponses.agent1.content,
        latency_ms: agentResponses.agent1.latency_ms,
        token_in: agentResponses.agent1.token_in,
        token_out: agentResponses.agent1.token_out,
        fallback_used: agentResponses.agent1.fallback_used,
      },
      {
        id: crypto.randomUUID(),
        participant_id: participantId,
        session_key: sessionKey,
        t_idx: turnIndex,
        role: 'agent2' as const,
        content: agentResponses.agent2.content,
        latency_ms: agentResponses.agent2.latency_ms,
        token_in: agentResponses.agent2.token_in,
        token_out: agentResponses.agent2.token_out,
        fallback_used: agentResponses.agent2.fallback_used,
      },
      {
        id: crypto.randomUUID(),
        participant_id: participantId,
        session_key: sessionKey,
        t_idx: turnIndex,
        role: 'agent3' as const,
        content: agentResponses.agent3.content,
        latency_ms: agentResponses.agent3.latency_ms,
        token_in: agentResponses.agent3.token_in,
        token_out: agentResponses.agent3.token_out,
        fallback_used: agentResponses.agent3.fallback_used,
      },
    ];

    const { error: messagesError } = await supabase
      .from('messages')
      .insert(messageInserts);

    if (messagesError) {
      console.error('Agent messages save error:', messagesError);
    }

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
    if (turnIndex === 3) {
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
      agent1: agentResponses.agent1,
      agent2: agentResponses.agent2,
      agent3: agentResponses.agent3,
      meta: {
        turn_index: turnIndex,
        session_key: sessionKey,
        participant_id: participantId,
      }
    });

  } catch (error) {
    console.error('Turn API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
