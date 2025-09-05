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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, sessionKey, responseIndex, opinion, confidence, rtMs } = responseRequestSchema.parse(body);

    // Always persist even for test participants (keeps logic simple and unified)

    // Environment check removed to allow unified saving in all modes

    // Check if response already exists (idempotency)
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('*')
      .eq('participant_id', participantId)
      .eq('session_key', sessionKey)
      .eq('response_index', responseIndex)
      .single();

    if (existingResponse) {
      return NextResponse.json({
        success: true,
        message: 'Response already exists',
        response: existingResponse
      });
    }

    // Create new response
    const responseId = crypto.randomUUID();
    const { data: newResponse, error: responseError } = await supabase
      .from('responses')
      .insert({
        id: responseId,
        participant_id: participantId,
        session_key: sessionKey,
        response_index: responseIndex,
        opinion: opinion,
        confidence: confidence,
        rt_ms: rtMs,
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
      .eq('participant_id', participantId)
      .eq('key', sessionKey);

    if (sessionError) {
      console.error('Session update error:', sessionError);
    }

    // If this is T0, update session started_at
    if (responseIndex === 0) {
      await supabase
        .from('sessions')
        .update({ started_at: new Date().toISOString() })
        .eq('participant_id', participantId)
        .eq('key', sessionKey)
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
