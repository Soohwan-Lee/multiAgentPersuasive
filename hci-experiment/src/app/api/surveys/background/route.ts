import { NextRequest, NextResponse } from 'next/server';
import { saveBackgroundSurvey } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { participant_id, age, gender, education, occupation, political_views, social_media_usage } = await request.json();

    if (!participant_id || !age || !gender || !education) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate age
    if (age < 18 || age > 100) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 100' },
        { status: 400 }
      );
    }

    // Save background survey
    const survey = await saveBackgroundSurvey({
      participant_id,
      age: Number(age),
      gender,
      education,
      occupation,
      political_views,
      social_media_usage,
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Failed to save background survey' },
        { status: 500 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error saving background survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
