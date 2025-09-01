// 향후 Supabase 연동을 위한 조건 조회 API
// 현재는 주석 처리되어 있으며, Supabase 연동 시 활성화할 예정

import { NextRequest, NextResponse } from 'next/server';
import { getConditionStatistics, getParticipantCondition } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participant_id = searchParams.get('participant_id');

    if (participant_id) {
      // Get specific participant's condition
      const condition = await getParticipantCondition(participant_id);
      if (!condition) {
        return NextResponse.json(
          { error: 'Participant condition not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(condition);
    }

    // Get overall condition statistics
    const stats = await getConditionStatistics();
    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch condition statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching condition data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId } = conditionRequestSchema.parse(body);

    // TODO: Supabase 연동 시 이 부분을 활성화
    /*
    const { data, error } = await supabase
      .from('experiment_conditions')
      .insert({
        participant_id: participantId,
        condition_type: 'majority', // 기본값 또는 랜덤 선택
        session_order: ['normative', 'informative'], // 기본값 또는 랜덤 선택
        task_index_normative: 0,
        task_index_informative: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating condition:', error);
      return NextResponse.json(
        { error: 'Failed to create condition' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
    */

    // 현재는 성공 응답만 반환
    return NextResponse.json({ 
      message: 'Condition created successfully (mock)',
      participantId 
    });

  } catch (error) {
    console.error('Condition API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
