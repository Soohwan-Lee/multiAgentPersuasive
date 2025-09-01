import { NextRequest, NextResponse } from 'next/server';
import { createSession, getParticipantSessions } from '@/lib/supabase';
import { getCurrentSessionTask } from '@/lib/task-example';
import { getCurrentSessionOrder } from '@/config/session-order';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, session_key } = await request.json();

    if (!participant_id || !session_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get task information
    const task_content = getCurrentSessionTask(session_key);
    const task_type = session_key;
    const session_order = session_key === 'test' ? 0 : 
                         session_key === getCurrentSessionOrder()[0] ? 1 : 2;
    
    // Get task index (0-5 for normative/informative, null for test)
    const task_index = session_key === 'test' ? null : 0; // TODO: Get from participant's task indices

    // Create session
    const session = await createSession({
      participant_id,
      session_key,
      session_order,
      task_content,
      task_type,
      task_index,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participant_id = searchParams.get('participant_id');

    if (!participant_id) {
      return NextResponse.json(
        { error: 'Missing participant_id parameter' },
        { status: 400 }
      );
    }

    const sessions = await getParticipantSessions(participant_id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
