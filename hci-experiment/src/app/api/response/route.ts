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

    // Check if this is test mode by looking at the participant data
    let isTestMode = false;
    
    try {
      const { data: participant } = await supabase
        .from('participants')
        .select('prolific_pid')
        .eq('id', participantId)
        .single();
      
      isTestMode = participant?.prolific_pid === 'TEST_PID';
    } catch (error) {
      // If participant not found, assume test mode
      isTestMode = true;
    }

    if (isTestMode) {
      // For test mode, just return success without saving to database
      console.log('Test mode response:', { participantId, sessionKey, responseIndex, opinion, confidence, rtMs });
      
      return NextResponse.json({
        success: true,
        response: {
          id: `test-${Date.now()}`,
          participant_id: participantId,
          session_key: sessionKey,
          response_index: responseIndex,
          opinion: opinion,
          confidence: confidence,
          rt_ms: rtMs,
          created_at: new Date().toISOString(),
        }
      });
    }

    // Check environment variables for production mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    // Check if response already exists (idempotency)
    const { data: existingResponse } = await supabase
      .from('turn_responses')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_id', (await getSessionId(participantId, sessionKey)))
      .eq('response_index', responseIndex)
      .single();

    if (existingResponse) {
      return NextResponse.json({
        success: true,
        message: 'Response already exists',
        response: existingResponse
      });
    }

    // Get session ID for the session key
    const sessionId = await getSessionId(participantId, sessionKey);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session not found.' },
        { status: 404 }
      );
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
      response: newResponse
    });

  } catch (error) {
    console.error('Response API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
