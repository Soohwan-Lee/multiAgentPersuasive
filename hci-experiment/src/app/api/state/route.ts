import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required.' },
        { status: 400 }
      );
    }

    console.log('State API called for participant:', participantId);

    // Check if this is test mode by looking at the participant data
    // Test mode participants will have TEST_PID as prolific_pid
    let isTestMode = false;
    
    try {
      const { data: participant } = await supabase
        .from('participants')
        .select('prolific_pid, study_id')
        .eq('id', participantId)
        .single();
      
      // Test mode detection: check if prolific_pid starts with 'test' or study_id is 'test'
      isTestMode = participant?.prolific_pid?.startsWith('test') || 
                   participant?.study_id === 'test' ||
                   participant?.prolific_pid === 'TEST_PID';
      
      console.log('Participant found:', participant, 'isTestMode:', isTestMode);
    } catch (error) {
      console.error('Error checking participant:', error);
      // If participant not found, assume test mode
      isTestMode = true;
    }

    if (isTestMode) {
      // For test mode, return mock state
      return NextResponse.json({
        participant: {
          id: participantId,
          prolific_pid: 'TEST_PID',
          study_id: 'TEST_STUDY',
          session_id: 'TEST_SESSION',
          condition: 'majority',
          created_at: new Date().toISOString(),
          finished_at: null,
        },
        sessions: [
          {
            id: 'test-session-1',
            participant_id: participantId,
            key: 'test',
            started_at: new Date().toISOString(),
            completed_at: null,
            current_turn: 0,
            current_response: 0,
            current_cycle: 0,
          },
          {
            id: 'test-session-2',
            participant_id: participantId,
            key: 'normative', // main1을 normative으로 변경
            started_at: null,
            completed_at: null,
            current_turn: 0,
            current_response: 0,
            current_cycle: 0,
          },
          {
            id: 'test-session-3',
            participant_id: participantId,
            key: 'informative', // main2를 informative로 변경
            started_at: null,
            completed_at: null,
            current_turn: 0,
            current_response: 0,
            current_cycle: 0,
          },
        ],
        current_session: {
          id: 'test-session-1',
          participant_id: participantId,
          key: 'test',
          started_at: new Date().toISOString(),
          completed_at: null,
          current_turn: 0,
          current_response: 0,
          current_cycle: 0,
        },
        last_completed_turn: null,
        last_messages: [],
        responses: [],
      });
    }

    // Production mode - get data from database
    
    // Get participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      console.error('Participant not found:', participantError);
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

    // Get responses from turn_responses table (not responses table)
    const { data: responses, error: responsesError } = await supabase
      .from('turn_responses')
      .select('*')
      .eq('participant_id', participantId)
      .order('response_index');

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

    console.log('State retrieved successfully for participant:', participantId);

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
