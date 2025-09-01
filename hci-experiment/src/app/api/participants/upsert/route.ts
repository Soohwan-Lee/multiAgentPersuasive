import { NextRequest, NextResponse } from 'next/server';
import { createParticipant, getParticipant, getNextAvailableCondition, assignConditionToParticipant } from '@/lib/supabase';

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
      return NextResponse.json(existingParticipant);
    }

    // Get next available condition
    const condition = await getNextAvailableCondition();
    if (!condition) {
      return NextResponse.json(
        { error: 'No available conditions. Experiment is full.' },
        { status: 503 }
      );
    }

    // Create new participant with assigned condition
    const participant = await createParticipant({
      prolific_pid,
      study_id,
      session_id,
      condition_type: condition.condition_type,
      task_order: condition.task_order,
      informative_task_index: condition.informative_task_index,
      normative_task_index: condition.normative_task_index,
      browser_info: {
        userAgent: request.headers.get('user-agent'),
        language: request.headers.get('accept-language'),
      },
      device_info: {
        // Add device info if available
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }

    // Assign condition to participant
    const assignmentSuccess = await assignConditionToParticipant(condition.id, participant.id);
    if (!assignmentSuccess) {
      console.error('Failed to assign condition to participant');
      // Note: Participant was created but condition assignment failed
      // In a production environment, you might want to handle this differently
    }

    return NextResponse.json({
      ...participant,
      assigned_condition: {
        condition_type: condition.condition_type,
        task_order: condition.task_order,
        informative_task_index: condition.informative_task_index,
        normative_task_index: condition.normative_task_index,
      }
    });
  } catch (error) {
    console.error('Error in participant upsert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
