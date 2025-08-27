    import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { participantSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is incomplete.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prolificPid, studyId, sessionId } = participantSchema.parse(body);

    // Check existing participant
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('*')
      .eq('prolific_pid', prolificPid)
      .eq('study_id', studyId)
      .eq('session_id', sessionId)
      .single();

    if (existingParticipant) {
      // Return existing participant
      return NextResponse.json({ participant: existingParticipant });
    }

    // Create new participant (random pattern assignment)
    const participantId = crypto.randomUUID();
    const patterns = ['majority', 'minority', 'minorityDiffusion'];
    const condition = patterns[Math.floor(Math.random() * patterns.length)];
    
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        id: participantId,
        prolific_pid: prolificPid,
        study_id: studyId,
        session_id: sessionId,
        condition,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Participant creation error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create participant.' },
        { status: 500 }
      );
    }

    // Create sessions for this participant
    const sessions = [
      { key: 'test', started_at: null },
      { key: 'normative', started_at: null }, // main1을 normative으로 변경
      { key: 'informative', started_at: null }, // main2를 informative로 변경
    ];

    const sessionInserts = sessions.map(session => ({
      id: crypto.randomUUID(),
      participant_id: participantId,
      key: session.key,
      started_at: session.started_at,
      completed_at: null,
      current_turn: 0,
      current_response: 0,
      current_cycle: 0,
    }));

    const { error: sessionsError } = await supabase
      .from('sessions')
      .insert(sessionInserts);

    if (sessionsError) {
      console.error('Sessions creation error:', sessionsError);
      // Participant was created but session creation failed - still return participant info
    }

    return NextResponse.json({ participant: newParticipant });

  } catch (error) {
    console.error('Participant upsert error:', error);
    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
