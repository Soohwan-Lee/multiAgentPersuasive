import { NextRequest, NextResponse } from 'next/server';
import { savePostOpenSurvey } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, survey_number, thoughts_on_experiment, agent_comparison, suggestions, reason_for_change, internal_inconsistency, pattern_experience } = await request.json();

    if (!participant_id || !survey_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate survey_number
    if (survey_number !== 1 && survey_number !== 2) {
      return NextResponse.json(
        { error: 'Survey number must be 1 or 2' },
        { status: 400 }
      );
    }

    // Save post-open survey
    const survey = await savePostOpenSurvey({
      participant_id,
      session_id: '00000000-0000-0000-0000-000000000000',
      survey_number,
      thoughts_on_experiment,
      agent_comparison,
      suggestions,
      reason_for_change,
      internal_inconsistency,
      pattern_experience,
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Failed to save post-open survey' },
        { status: 500 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error saving post-open survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
