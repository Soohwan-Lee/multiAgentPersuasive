import { NextRequest, NextResponse } from 'next/server';
import { saveTurnResponse } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, session_id, cycle, response_index, opinion, confidence, response_time_ms } = await request.json();

    if (!participant_id || !session_id || !cycle || !response_index || opinion === undefined || confidence === undefined || !response_time_ms) {
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

    // Validate response_index (1-4 for T1-T4)
    if (response_index < 1 || response_index > 4) {
      return NextResponse.json(
        { error: 'Response index must be between 1 and 4' },
        { status: 400 }
      );
    }

    // Save turn response
    const response = await saveTurnResponse({
      participant_id,
      session_id,
      cycle,
      response_index,
      opinion,
      confidence,
      response_time_ms,
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Failed to save turn response' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving turn response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
