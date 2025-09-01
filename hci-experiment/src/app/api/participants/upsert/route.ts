import { NextRequest, NextResponse } from 'next/server';
import { createParticipant, getParticipant } from '@/lib/supabase';
import { CURRENT_PATTERN } from '@/config/patterns';
import { getCurrentSessionOrder } from '@/config/session-order';
import { getSelectedTask } from '@/lib/prompts';

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

    // Determine experiment conditions
    const condition_type = CURRENT_PATTERN;
    const task_order = getCurrentSessionOrder()[0] === 'informative' ? 'informativeFirst' : 'normativeFirst';
    
    // Get task indices (currently hardcoded to 0, but can be randomized later)
    const informative_task_index = 0; // TODO: Randomize between 0-5
    const normative_task_index = 0;   // TODO: Randomize between 0-5

    // Create new participant
    const participant = await createParticipant({
      prolific_pid,
      study_id,
      session_id,
      condition_type,
      task_order,
      informative_task_index,
      normative_task_index,
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

    return NextResponse.json(participant);
  } catch (error) {
    console.error('Error in participant upsert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
