// 향후 Supabase 연동을 위한 조건 조회 API
// 현재는 주석 처리되어 있으며, Supabase 연동 시 활성화할 예정

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 요청 스키마
const conditionRequestSchema = z.object({
  participantId: z.string().min(1),
});

// 응답 타입
interface ConditionResponse {
  participantId: string;
  conditionType: 'majority' | 'minority' | 'minorityDiffusion';
  sessionOrder: ['normative', 'informative'] | ['informative', 'normative'];
  taskIndexNormative: number;
  taskIndexInformative: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 }
      );
    }

    // TODO: Supabase 연동 시 이 부분을 활성화
    /*
    const { data, error } = await supabase
      .from('experiment_conditions')
      .select('*')
      .eq('participant_id', participantId)
      .single();

    if (error) {
      console.error('Error fetching condition:', error);
      return NextResponse.json(
        { error: 'Failed to fetch condition data' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Condition not found' },
        { status: 404 }
      );
    }

    const response: ConditionResponse = {
      participantId: data.participant_id,
      conditionType: data.condition_type,
      sessionOrder: data.session_order,
      taskIndexNormative: data.task_index_normative,
      taskIndexInformative: data.task_index_informative,
    };

    return NextResponse.json(response);
    */

    // 현재는 기본값 반환 (Supabase 연동 전까지)
    const defaultResponse: ConditionResponse = {
      participantId,
      conditionType: 'majority', // 기본값
      sessionOrder: ['normative', 'informative'], // 환경 변수 기반
      taskIndexNormative: 0,
      taskIndexInformative: 0,
    };

    return NextResponse.json(defaultResponse);

  } catch (error) {
    console.error('Condition API error:', error);
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
