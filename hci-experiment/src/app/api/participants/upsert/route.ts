    import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { participantUpsertSchema } from '@/lib/validations';

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
    const { prolific_pid, study_id, session_id } = participantUpsertSchema.parse(body);

    // 기존 참가자 확인
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('*')
      .eq('prolific_pid', prolific_pid)
      .eq('study_id', study_id)
      .eq('session_id', session_id)
      .single();

    if (existingParticipant) {
      // 기존 참가자 반환
      return NextResponse.json({ participant: existingParticipant });
    }

    // 새 참가자 생성 (패턴 랜덤 할당)
    const participantId = crypto.randomUUID();
    const condition = Math.random() < 0.5 ? 'majority' : 'minority';
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        id: participantId,
        prolific_pid,
        study_id,
        session_id,
        condition,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Participant creation error:', insertError);
      return NextResponse.json(
        { error: '참가자 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 초기 세션들 생성
    const sessions = [
      { key: 'test', started_at: new Date().toISOString() },
      { key: 'main1', started_at: null },
      { key: 'main2', started_at: null },
    ];

    const sessionInserts = sessions.map(session => ({
      id: crypto.randomUUID(),
      participant_id: participantId,
      key: session.key,
      started_at: session.started_at,
      completed_at: null,
      current_turn: 0,
    }));

    const { error: sessionsError } = await supabase
      .from('sessions')
      .insert(sessionInserts);

    if (sessionsError) {
      console.error('Sessions creation error:', sessionsError);
      // 참가자는 생성되었지만 세션 생성 실패 시에도 참가자 정보는 반환
    }

    return NextResponse.json({ participant: newParticipant });

  } catch (error) {
    console.error('Participant upsert error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
