import { NextRequest, NextResponse } from 'next/server';
import { createParticipant, getParticipant, assignNextConditionAtomic, cleanupAbandonedAssignments, supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { prolific_pid, study_id, session_id } = await request.json();

    if (!prolific_pid || !study_id || !session_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if participant already exists
    const existingParticipant = await getParticipant(prolific_pid);
    if (existingParticipant) {
      return NextResponse.json({ participant: existingParticipant });
    }

    // 중도 이탈자 정리 (새로운 참가자 등록 전에 실행)
    try {
      await cleanupAbandonedAssignments();
    } catch (cleanupError) {
      console.warn('Cleanup failed, continuing with assignment:', cleanupError);
    }

    // 재시도 로직을 포함한 조건 배정 및 참가자 생성
    let participant = null;
    let condition = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 임시 참가자 생성 (조건 없이)
        const tempParticipant = await createParticipant({
          prolific_pid,
          study_id,
          session_id,
          condition_type: 'majority', // 임시값
          task_order: 'informativeFirst', // 임시값
          informative_task_index: 0, // 임시값
          normative_task_index: 0, // 임시값
          browser_info: {
            userAgent: request.headers.get('user-agent'),
            language: request.headers.get('accept-language'),
          },
          device_info: {},
        });

        if (!tempParticipant) {
          throw new Error('Failed to create participant');
        }

        // 원자적 조건 배정
        condition = await assignNextConditionAtomic(tempParticipant.id);
        
        if (!condition) {
          // 조건 배정 실패 시 참가자 삭제
          await supabase.from('participants').delete().eq('id', tempParticipant.id);
          
          if (attempt === maxRetries) {
            return NextResponse.json(
              { error: 'No available conditions. Experiment is full.' },
              { status: 503 }
            );
          }
          
          // 잠시 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }

        // 참가자 정보를 실제 조건으로 업데이트
        const { error: updateError } = await supabase
          .from('participants')
          .update({
            condition_type: condition.condition_type,
            task_order: condition.task_order,
            informative_task_index: condition.informative_task_index,
            normative_task_index: condition.normative_task_index,
          })
          .eq('id', tempParticipant.id);

        if (updateError) {
          console.error('Failed to update participant with condition:', updateError);
          // 롤백: 조건 배정 해제
          await supabase
            .from('experiment_conditions')
            .update({ 
              is_assigned: false, 
              assigned_participant_id: null, 
              assigned_at: null 
            })
            .eq('id', condition.id);
          
          await supabase.from('participants').delete().eq('id', tempParticipant.id);
          
          if (attempt === maxRetries) {
            return NextResponse.json(
              { error: 'Failed to assign condition to participant' },
              { status: 500 }
            );
          }
          continue;
        }

        // 성공적으로 배정된 참가자 정보 반환
        participant = {
          ...tempParticipant,
          condition_type: condition.condition_type,
          task_order: condition.task_order,
          informative_task_index: condition.informative_task_index,
          normative_task_index: condition.normative_task_index,
        };
        
        break; // 성공시 루프 종료

      } catch (attemptError) {
        console.error(`Assignment attempt ${attempt} failed:`, attemptError);
        
        if (attempt === maxRetries) {
          return NextResponse.json(
            { error: 'Failed to create participant after multiple attempts' },
            { status: 500 }
          );
        }
        
        // 잠시 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      }
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant });

  } catch (error) {
    console.error('Participant upsert error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}