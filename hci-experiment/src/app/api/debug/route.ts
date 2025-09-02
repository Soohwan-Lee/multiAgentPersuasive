import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'conditions':
        // experiment_conditions 테이블 상태 확인
        const { data: conditions, error: conditionsError } = await supabase
          .from('experiment_conditions')
          .select('*')
          .order('id');

        if (conditionsError) {
          return NextResponse.json({ error: 'Failed to fetch conditions' }, { status: 500 });
        }

        const conditionStats = {
          total: conditions.length,
          assigned: conditions.filter(c => c.is_assigned).length,
          unassigned: conditions.filter(c => !c.is_assigned).length,
          byType: conditions.reduce((acc, c) => {
            acc[c.condition_type] = (acc[c.condition_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byOrder: conditions.reduce((acc, c) => {
            acc[c.task_order] = (acc[c.task_order] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };

        return NextResponse.json({ conditions, stats: conditionStats });

      case 'participants':
        // participants 테이블 상태 확인
        const { data: participants, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (participantsError) {
          return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
        }

        return NextResponse.json({ participants });

      case 'stats':
        // 전체 통계 확인
        try {
          const { data: stats } = await supabase.rpc('get_condition_stats');
          return NextResponse.json({ stats: stats?.[0] || null });
        } catch (error) {
          return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

      case 'test-assignment':
        // 조건 배정 테스트
        try {
          const testParticipantId = 'test-' + Date.now();
          const { data: availableConditions } = await supabase
            .from('experiment_conditions')
            .select('*')
            .eq('is_assigned', false)
            .order('id')
            .limit(1);

          if (!availableConditions || availableConditions.length === 0) {
            return NextResponse.json({ error: 'No available conditions' });
          }

          const testCondition = availableConditions[0];
          return NextResponse.json({ 
            message: 'Test assignment available',
            availableCondition: testCondition,
            testParticipantId 
          });
        } catch (error) {
          return NextResponse.json({ error: 'Test assignment failed' }, { status: 500 });
        }

      default:
        return NextResponse.json({ 
          message: 'Debug API available',
          actions: ['conditions', 'participants', 'stats', 'test-assignment']
        });
    }

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'reset-conditions':
        // 모든 조건을 미할당 상태로 리셋 (테스트용)
        const { error: resetError } = await supabase
          .from('experiment_conditions')
          .update({
            is_assigned: false,
            assigned_participant_id: null,
            assigned_at: null
          });

        if (resetError) {
          return NextResponse.json({ error: 'Failed to reset conditions' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Conditions reset successfully' });

      case 'cleanup-abandoned':
        // 중도 이탈자 정리
        try {
          const { data: cleanupResult } = await supabase.rpc('cleanup_abandoned_assignments');
          return NextResponse.json({ 
            message: 'Cleanup completed',
            cleanedCount: cleanupResult || 0
          });
        } catch (error) {
          return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Debug API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
