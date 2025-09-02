import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Prolific commit API called');
    
    // 환경 변수 체크
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables:', {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      console.error('Missing participantId in request body');
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 }
      );
    }

    console.log('Processing completion for participant:', participantId);

    // 1. 참가자 존재 여부 확인
    const { data: existingParticipant, error: fetchError } = await supabase
      .from('participants')
      .select('id, prolific_pid, finished_at')
      .eq('id', participantId)
      .single();

    if (fetchError) {
      console.error('Error fetching participant:', fetchError);
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    if (existingParticipant.finished_at) {
      console.log('Participant already marked as finished');
      return NextResponse.json({ 
        success: true,
        message: 'Participant already completed',
        completionCode: process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_CODE || 'COMPLETION_CODE'
      });
    }

    // 2. 참가자의 finished_at 업데이트
    console.log('Updating participant finished_at...');
    const { error: updateError } = await supabase
      .from('participants')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', participantId);

    if (updateError) {
      console.error('Error updating participant finished_at:', updateError);
      return NextResponse.json(
        { error: 'Failed to update participant completion status' },
        { status: 500 }
      );
    }

    console.log('Successfully updated participant finished_at');

    // 3. 완료 이벤트 기록 (UUID 형식 오류 수정)
    try {
      console.log('Logging completion event...');
      
      // UUID 형식 검증
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(participantId)) {
        console.error('Invalid UUID format for participantId:', participantId);
        throw new Error('Invalid participant ID format');
      }

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
        console.error('Event logging error (non-critical):', eventError);
      } else {
        console.log('Successfully logged completion event');
      }
    } catch (eventInsertError) {
      console.warn('Event insertion failed (non-critical):', eventInsertError);
    }

    // 4. 참가자 완료 통계 업데이트 (에러가 발생해도 계속 진행)
    try {
      console.log('Fetching experiment stats...');
      const { data: stats } = await supabase.rpc('get_condition_stats');
      if (stats && stats.length > 0) {
        console.log('Current experiment stats:', stats[0]);
      }
    } catch (statsError) {
      console.warn('Could not fetch experiment stats (non-critical):', statsError);
    }

    console.log('Participant completion processed successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Participant marked as completed',
      completionCode: process.env.NEXT_PUBLIC_PROLIFIC_COMPLETION_CODE || 'COMPLETION_CODE'
    });

  } catch (error) {
    console.error('Unexpected error in prolific commit API:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
