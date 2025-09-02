import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const responseRequestSchema = z.object({
  participantId: z.string(),
  sessionKey: z.enum(['test', 'normative', 'informative']), // main1, main2를 normative, informative로 변경
  responseIndex: z.number().int().min(0).max(4),
  opinion: z.number().int().min(-50).max(50),
  confidence: z.number().int().min(0).max(100),
  rtMs: z.number().int().min(0),
});

// Helper function to get session ID from session key
async function getSessionId(participantId: string, sessionKey: string): Promise<string | null> {
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .single();
    
    return session?.id || null;
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, sessionKey, responseIndex, opinion, confidence, rtMs } = responseRequestSchema.parse(body);

    console.log('Response API called:', { participantId, sessionKey, responseIndex, opinion, confidence, rtMs });

    // Check if this is test mode by looking at the participant data
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

    // For both test and production modes, save to database
    // This ensures test data is also properly stored for verification
    
    // Check if response already exists (idempotency)
    const sessionId = await getSessionId(participantId, sessionKey);
    if (!sessionId) {
      console.error('Session not found for:', { participantId, sessionKey });
      return NextResponse.json(
        { error: 'Session not found.' },
        { status: 404 }
      );
    }

    const { data: existingResponse } = await supabase
      .from('turn_responses')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_id', sessionId)
      .eq('response_index', responseIndex)
      .single();

    if (existingResponse) {
      console.log('Response already exists:', existingResponse);
      return NextResponse.json({
        success: true,
        message: 'Response already exists',
        response: existingResponse
      });
    }

    // Create new response
    const responseId = crypto.randomUUID();
    const { data: newResponse, error: responseError } = await supabase
      .from('turn_responses')
      .insert({
        id: responseId,
        participant_id: participantId,
        session_id: sessionId,
        cycle: null, // T0 responses don't have cycles
        response_index: responseIndex,
        opinion: opinion,
        confidence: confidence,
        response_time_ms: rtMs,
      })
      .select()
      .single();

    if (responseError) {
      console.error('Response creation error:', responseError);
      return NextResponse.json(
        { error: 'Failed to save response.' },
        { status: 500 }
      );
    }

    console.log('Response saved successfully:', newResponse);

    // Update session current_response
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ current_response: responseIndex + 1 })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Session update error:', sessionError);
    }

    // If this is T0, update session started_at
    if (responseIndex === 0) {
      await supabase
        .from('sessions')
        .update({ started_at: new Date().toISOString() })
        .eq('id', sessionId)
        .is('started_at', null);
    }

    return NextResponse.json({
      success: true,
      response: newResponse,
      message: isTestMode ? 'Test response saved successfully' : 'Response saved successfully'
    });

  } catch (error) {
    console.error('Response API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
