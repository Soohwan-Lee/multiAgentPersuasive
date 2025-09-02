import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 현재 조건 상태 확인
    const { data: conditions, error: conditionsError } = await supabase
      .from('experiment_conditions')
      .select('*')
      .order('id', { ascending: true })
      .limit(10);

    if (conditionsError) {
      console.error('Error fetching conditions:', conditionsError);
      return NextResponse.json({ error: 'Failed to fetch conditions' }, { status: 500 });
    }

    // 참가자 상태 확인
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    // 응답 테이블 상태 확인
    const { data: responses, error: responsesError } = await supabase
      .from('turn_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    return NextResponse.json({
      conditions: conditions || [],
      participants: participants || [],
      responses: responses || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
