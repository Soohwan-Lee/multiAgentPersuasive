import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 참가자의 finished_at 업데이트
    const { error: updateError } = await supabase
      .from('participants')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', participantId);

    if (updateError) {
      console.error('Participant finish update error:', updateError);
      return NextResponse.json(
        { error: '참가자 완료 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 완료 이벤트 기록
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        id: crypto.randomUUID(),
        participant_id: participantId,
        type: 'experiment_completed',
        payload: { completed_at: new Date().toISOString() },
      });

    if (eventError) {
      console.error('Event logging error:', eventError);
    }

    return NextResponse.json({ 
      success: true,
      completionCode: process.env.PROLIFIC_COMPLETION_CODE || 'CBUP19R5'
    });

  } catch (error) {
    console.error('Prolific commit error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
