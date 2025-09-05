import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const eventRequestSchema = z.object({
  participantId: z.string(),
  type: z.string(),
  payload: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, type, payload } = eventRequestSchema.parse(body);

    // Check if this is test mode
    const isTestMode = participantId.startsWith('test-');

    if (isTestMode) {
      // For test mode, just log the event
      console.log('Test mode event:', { participantId, type, payload });
      
      return NextResponse.json({
        success: true,
        message: 'Event logged (test mode)'
      });
    }

    // Check environment variables for production mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    // Save event to database
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        id: crypto.randomUUID(),
        participant_id: participantId,
        type: type,
        payload: payload || {},
        ts: new Date().toISOString(),
      });

    if (eventError) {
      console.error('Event save error:', eventError);
      return NextResponse.json(
        { error: 'Failed to save event.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event saved successfully'
    });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
