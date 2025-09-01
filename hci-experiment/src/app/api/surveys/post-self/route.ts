import { NextRequest, NextResponse } from 'next/server';
import { savePostSelfSurvey } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      participant_id,
      session_id,
      survey_number,
      perceived_compliance_1,
      perceived_compliance_2,
      perceived_compliance_3,
      perceived_compliance_4,
      perceived_conversion_1,
      perceived_conversion_2,
      perceived_conversion_3,
      perceived_conversion_4,
      concentration_test,
      // Majority condition fields
      agent_competence,
      agent_predictability,
      agent_integrity,
      agent_understanding,
      agent_utility,
      agent_affect,
      agent_trust,
      // Minority condition fields
      agent1_competence,
      agent1_predictability,
      agent1_integrity,
      agent1_understanding,
      agent1_utility,
      agent1_affect,
      agent1_trust,
      agent3_competence,
      agent3_predictability,
      agent3_integrity,
      agent3_understanding,
      agent3_utility,
      agent3_affect,
      agent3_trust,
    } = await request.json();

    if (!participant_id || !session_id || !survey_number) {
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

    // Validate all required fields are present
    const requiredFields = [
      'perceived_compliance_1', 'perceived_compliance_2', 'perceived_compliance_3', 'perceived_compliance_4',
      'perceived_conversion_1', 'perceived_conversion_2', 'perceived_conversion_3', 'perceived_conversion_4',
      'concentration_test'
    ];

    for (const field of requiredFields) {
      if (request.body[field] === undefined || request.body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate Likert scale values (1-7)
    const likertFields = [
      perceived_compliance_1, perceived_compliance_2, perceived_compliance_3, perceived_compliance_4,
      perceived_conversion_1, perceived_conversion_2, perceived_conversion_3, perceived_conversion_4,
      concentration_test,
      agent_competence, agent_predictability, agent_integrity, agent_understanding, agent_utility, agent_affect, agent_trust,
      agent1_competence, agent1_predictability, agent1_integrity, agent1_understanding, agent1_utility, agent1_affect, agent1_trust,
      agent3_competence, agent3_predictability, agent3_integrity, agent3_understanding, agent3_utility, agent3_affect, agent3_trust,
    ].filter(val => val !== undefined && val !== null);

    for (const value of likertFields) {
      if (value < 1 || value > 7) {
        return NextResponse.json(
          { error: 'All Likert scale values must be between 1 and 7' },
          { status: 400 }
        );
      }
    }

    // Save post-self survey
    const survey = await savePostSelfSurvey({
      participant_id,
      session_id,
      survey_number,
      perceived_compliance_1,
      perceived_compliance_2,
      perceived_compliance_3,
      perceived_compliance_4,
      perceived_conversion_1,
      perceived_conversion_2,
      perceived_conversion_3,
      perceived_conversion_4,
      concentration_test,
      // Majority condition fields
      agent_competence,
      agent_predictability,
      agent_integrity,
      agent_understanding,
      agent_utility,
      agent_affect,
      agent_trust,
      // Minority condition fields
      agent1_competence,
      agent1_predictability,
      agent1_integrity,
      agent1_understanding,
      agent1_utility,
      agent1_affect,
      agent1_trust,
      agent3_competence,
      agent3_predictability,
      agent3_integrity,
      agent3_understanding,
      agent3_utility,
      agent3_affect,
      agent3_trust,
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Failed to save post-self survey' },
        { status: 500 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error saving post-self survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
