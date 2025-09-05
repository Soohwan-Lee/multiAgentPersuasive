import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Participant Upsert API Called ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { prolific_pid, study_id, session_id, testMode, testParticipantId } = body;
    
    if (!prolific_pid || !study_id || !session_id) {
      console.error('Missing required fields:', { prolific_pid, study_id, session_id });
      return NextResponse.json(
        { error: 'Missing required fields: prolific_pid, study_id, session_id' },
        { status: 400 }
      );
    }

    console.log('Processing participant:', { prolific_pid, study_id, session_id, testMode, testParticipantId });

    // Check if this is test mode
    const isTestMode = testMode || prolific_pid.startsWith('test') || study_id === 'test';
    console.log('Test mode detected:', isTestMode);

    // 1. 기존 참가자 확인
    const { data: existingParticipant, error: fetchError } = await supabase
      .from('participants')
      .select('*')
      .eq('prolific_pid', prolific_pid)
      .eq('study_id', study_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing participant:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing participant' },
        { status: 500 }
      );
    }

    if (existingParticipant) {
      console.log('Existing participant found:', existingParticipant.id);
      return NextResponse.json({ 
        participant: existingParticipant,
        message: 'Participant already exists'
      });
    }

    console.log('No existing participant found, creating new one...');

    // 2. 중도 이탈자 정리 (테스트 모드가 아닌 경우에만)
    if (!isTestMode) {
      console.log('Cleaning up abandoned assignments...');
      try {
        const { data: cleanupResult, error: cleanupError } = await supabase.rpc('cleanup_abandoned_assignments');
        if (cleanupError) {
          console.warn('Cleanup warning (non-critical):', cleanupError);
        } else {
          console.log('Cleanup completed, result:', cleanupResult);
        }
      } catch (cleanupError) {
        console.warn('Cleanup failed (non-critical):', cleanupError);
      }
    }

    // 3. 조건 할당 (테스트 모드가 아닌 경우에만)
    let assignedCondition = null;
    
    if (!isTestMode) {
      console.log('Assigning condition...');
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && !assignedCondition) {
        try {
          console.log(`Attempt ${retryCount + 1} to assign condition...`);
          
          const { data: condition, error: assignError } = await supabase
            .from('experiment_conditions')
            .select('*')
            .eq('is_assigned', false)
            .order('id')
            .limit(1)
            .single();

          if (assignError) {
            console.error('Error fetching available condition:', assignError);
            throw assignError;
          }

          if (!condition) {
            console.error('No available conditions found');
            return NextResponse.json(
              { error: 'No available experiment conditions' },
              { status: 500 }
            );
          }

          console.log('Found available condition:', condition);

          // 원자적 업데이트로 조건 할당
          const { data: updatedCondition, error: updateError } = await supabase
            .from('experiment_conditions')
            .update({
              is_assigned: true,
              assigned_participant_id: prolific_pid,
              assigned_at: new Date().toISOString()
            })
            .eq('id', condition.id)
            .eq('is_assigned', false) // 동시 할당 방지
            .select()
            .single();

          if (updateError) {
            console.error('Error updating condition:', updateError);
            throw updateError;
          }

          if (!updatedCondition) {
            console.log('Condition was already assigned by another process, retrying...');
            retryCount++;
            continue;
          }

          assignedCondition = updatedCondition;
          console.log('Successfully assigned condition:', assignedCondition);

        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error('Max retries reached, giving up');
            return NextResponse.json(
              { error: 'Failed to assign condition after multiple attempts' },
              { status: 500 }
            );
          }
          
          // 잠시 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }
    } else {
      // 테스트 모드에서는 기본 조건 사용
      assignedCondition = {
        condition_type: 'majority',
        task_order: 'normative_first',
        informative_task_index: 1,
        normative_task_index: 0
      };
      console.log('Using default test condition:', assignedCondition);
    }

    if (!assignedCondition) {
      console.error('Failed to assign condition');
      return NextResponse.json(
        { error: 'Failed to assign experiment condition' },
        { status: 500 }
      );
    }

    // 4. 새 참가자 생성
    console.log('Creating new participant...');
    const newParticipant = {
      ...(testMode && testParticipantId && { id: testParticipantId }), // Use provided ID for test mode
      prolific_pid,
      study_id,
      session_id,
      condition_type: assignedCondition.condition_type,
      task_order: assignedCondition.task_order,
      informative_task_index: assignedCondition.informative_task_index,
      normative_task_index: assignedCondition.normative_task_index,
      browser_info: {
        language: request.headers.get('accept-language') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      device_info: {}
    };

    console.log('New participant data:', JSON.stringify(newParticipant, null, 2));

    const { data: participant, error: insertError } = await supabase
      .from('participants')
      .insert([newParticipant])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting participant:', insertError);
      
      // 조건 할당 취소 (테스트 모드가 아닌 경우에만)
      if (!isTestMode && assignedCondition.id) {
        await supabase
          .from('experiment_conditions')
          .update({
            is_assigned: false,
            assigned_participant_id: null,
            assigned_at: null
          })
          .eq('id', assignedCondition.id);
      }
      
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }

    console.log('=== Participant Created Successfully ===');
    console.log('Participant ID:', participant.id);
    console.log('Assigned condition:', {
      type: participant.condition_type,
      order: participant.task_order,
      informativeIndex: participant.informative_task_index,
      normativeIndex: participant.normative_task_index
    });

    return NextResponse.json({ 
      participant,
      message: isTestMode ? 'Test participant created successfully' : 'Participant created successfully'
    });

  } catch (error) {
    console.error('Unexpected error in participant upsert:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}