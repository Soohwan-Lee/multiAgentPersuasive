import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 환경변수 상태 확인
    const envStatus = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set',
    };

    // Supabase 연결 테스트
    const { data: testData, error: testError } = await supabase
      .from('experiment_conditions')
      .select('count')
      .limit(1);

    const connectionStatus = testError ? {
      status: 'Failed',
      error: testError.message,
      code: testError.code
    } : {
      status: 'Success',
      message: 'Connected to Supabase'
    };

    // 현재 조건 상태 확인
    const { data: conditions, error: conditionsError } = await supabase
      .from('experiment_conditions')
      .select('*')
      .order('id', { ascending: true })
      .limit(10);

    if (conditionsError) {
      console.error('Error fetching conditions:', conditionsError);
    }

    // 참가자 상태 확인
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
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

    // 메시지 테이블 상태 확인
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    return NextResponse.json({
      environment: envStatus,
      connection: connectionStatus,
      conditions: conditions || [],
      participants: participants || [],
      responses: responses || [],
      messages: messages || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
