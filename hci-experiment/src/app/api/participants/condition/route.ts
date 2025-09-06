import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const updateConditionSchema = z.object({
  participantId: z.string(),
  condition: z.enum(['majority', 'minority', 'minorityDiffusion'])
});

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

    // Check if this is test mode
    const isTestMode = participantId.startsWith('test-');

    if (isTestMode) {
      // For test mode, return mock condition
      return NextResponse.json({
        condition: 'majority'
      });
    }

    // Check environment variables for production mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    // Get participant condition_type
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('condition_type')
      .eq('id', participantId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      condition: participant.condition_type
    });

  } catch (error) {
    console.error('Error fetching participant condition:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, condition } = updateConditionSchema.parse(body);

    // Check if this is test mode
    const isTestMode = participantId.startsWith('test-');

    if (isTestMode) {
      // For test mode, just return success
      return NextResponse.json({
        success: true,
        condition: condition
      });
    }

    // Check environment variables for production mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    // Update participant condition
    const { data: participant, error: updateError } = await supabase
      .from('participants')
      .update({ condition: condition })
      .eq('id', participantId)
      .select('condition')
      .single();

    if (updateError || !participant) {
      return NextResponse.json(
        { error: 'Failed to update participant condition.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      condition: participant.condition
    });

  } catch (error) {
    console.error('Error updating participant condition:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
