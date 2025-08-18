import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { stateRequestSchema } from '@/lib/validations';
import { ParticipantState } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 참가자 정보 가져오기
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: '참가자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 정보 가져오기
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('participant_id', participantId)
      .order('key', { ascending: true });

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError);
      return NextResponse.json(
        { error: '세션 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 현재 진행 중인 세션 찾기
    const currentSession = sessions?.find(s => !s.completed_at) || null;

    // 마지막 완료된 턴 찾기
    let lastCompletedTurn = null;
    if (currentSession) {
      const { data: lastTurn } = await supabase
        .from('turns')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_key', currentSession.key)
        .order('t_idx', { ascending: false })
        .limit(1)
        .single();
      
      lastCompletedTurn = lastTurn;
    }

    // 마지막 메시지들 가져오기 (현재 세션의 경우)
    let lastMessages = [];
    if (currentSession && lastCompletedTurn) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_key', currentSession.key)
        .eq('t_idx', lastCompletedTurn.t_idx)
        .order('ts', { ascending: true });
      
      lastMessages = messages || [];
    }

    const state: ParticipantState = {
      participant,
      sessions: sessions || [],
      current_session: currentSession,
      last_completed_turn: lastCompletedTurn,
      last_messages: lastMessages,
    };

    return NextResponse.json(state);

  } catch (error) {
    console.error('State API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
