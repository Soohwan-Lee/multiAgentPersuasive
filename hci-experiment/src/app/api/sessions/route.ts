import { NextRequest, NextResponse } from 'next/server';
import { createSession, getParticipantSessions } from '@/lib/supabase';
import { getSelectedTask } from '@/lib/prompts';
import { getCurrentSessionOrder } from '@/config/session-order';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, session_key } = await request.json();

    if (!participant_id || !session_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load participant to get assigned task indices & order
    const { data: p } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participant_id)
      .single();

    const session_order = session_key === 'test' ? 0 : 
                         session_key === getCurrentSessionOrder()[0] ? 1 : 2;

    const task_index = session_key === 'test' 
      ? undefined 
      : (session_key === 'informative' ? p?.informative_task_index : p?.normative_task_index);

    const task_content = session_key === 'test' 
      ? 'Should we turn on cameras during online video meetings as a courtesy?'
      : getSelectedTask(session_key);

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
