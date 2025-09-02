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

    console.log('Marking participant as finished:', participantId);

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

    console.log('Successfully updated participant finished_at');

    // 완료 이벤트 기록
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        participant_id: participantId,
        event_type: 'experiment_completed',
        payload: { 
          completed_at: new Date().toISOString(),
          participant_id: participantId
        },
      });

    if (eventError) {
      console.error('Event logging error:', eventError);
    } else {
      console.log('Successfully logged completion event');
    }

    // 참가자 완료 통계 업데이트
    try {
      const { data: stats } = await supabase.rpc('get_condition_stats');
      if (stats && stats.length > 0) {
        console.log('Current experiment stats:', stats[0]);
      }
    } catch (statsError) {
      console.warn('Could not fetch experiment stats:', statsError);
    }

    return NextResponse.json({ 
      success: true,
      completionCode: process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_CODE || 'COMPLETION_CODE'
    });

  } catch (error) {
    console.error('Prolific commit error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
