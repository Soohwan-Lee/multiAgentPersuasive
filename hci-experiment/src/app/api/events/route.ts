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

    console.log('Events API called:', { participantId, type, payload });

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
    
    // Save event to database
    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        id: crypto.randomUUID(),
        participant_id: participantId,
        event_type: type, // Use event_type instead of type
        payload: payload || {},
        ts: new Date().toISOString(),
      })
      .select()
      .single();

    if (eventError) {
      console.error('Event save error:', eventError);
      return NextResponse.json(
        { error: 'Failed to save event.' },
        { status: 500 }
      );
    }

    console.log('Event saved successfully:', newEvent);

    return NextResponse.json({
      success: true,
      message: isTestMode ? 'Test event saved successfully' : 'Event saved successfully',
      event: newEvent
    });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
