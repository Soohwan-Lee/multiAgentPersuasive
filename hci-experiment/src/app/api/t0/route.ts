import { NextRequest, NextResponse } from 'next/server';
import { saveT0Response } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, session_id, opinion, confidence, response_time_ms } = await request.json();

    if (!participant_id || !session_id || opinion === undefined || confidence === undefined || !response_time_ms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate opinion range (-50 to 50)
    if (opinion < -50 || opinion > 50) {
      return NextResponse.json(
        { error: 'Opinion must be between -50 and 50' },
        { status: 400 }
      );
    }

    // Validate confidence range (0 to 100)
    if (confidence < 0 || confidence > 100) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Save T0 response into turn_responses with response_index = 0
    const response = await saveT0Response({
      participant_id,
      session_id,
      opinion,
      confidence,
      response_time_ms,
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Failed to save T0 response' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving T0 response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
