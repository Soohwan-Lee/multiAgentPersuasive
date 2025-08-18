import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required.' },
        { status: 400 }
      );
    }

    // Get participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found.' },
        { status: 404 }
      );
    }

    // Get sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('participant_id', participantId)
      .order('key');

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions.' },
        { status: 500 }
      );
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('participant_id', participantId)
      .order('session_key, response_index');

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses.' },
        { status: 500 }
      );
    }

    // Get current session
    const currentSession = sessions?.find((s: any) => !s.completed_at);

    // Get last completed turn
    let lastCompletedTurn = null;
    if (currentSession) {
      const { data: lastTurn } = await supabase
        .from('turns')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_key', currentSession.key)
        .order('cycle', { ascending: false })
        .limit(1)
        .single();
      
      lastCompletedTurn = lastTurn;
    }

    // Get last messages
    let lastMessages: any[] = [];
    if (currentSession) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_key', currentSession.key)
        .order('cycle, ts', { ascending: true });
      
      lastMessages = messages || [];
    }

    return NextResponse.json({
      participant,
      sessions: sessions || [],
      current_session: currentSession,
      last_completed_turn: lastCompletedTurn,
      last_messages: lastMessages,
      responses: responses || [],
    });

  } catch (error) {
    console.error('State API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
