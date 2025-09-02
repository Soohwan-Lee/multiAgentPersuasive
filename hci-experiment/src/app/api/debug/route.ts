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
          return NextResponse.json({ error: 'Failed to fetch conditions', details: conditionsError }, { status: 500 });
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
          return NextResponse.json({ error: 'Failed to fetch participants', details: participantsError }, { status: 500 });
        }

        return NextResponse.json({ participants });

      case 'stats':
        // 전체 통계 확인
        try {
          const { data: stats } = await supabase.rpc('get_condition_stats');
          return NextResponse.json({ stats: stats?.[0] || null });
        } catch (error) {
          return NextResponse.json({ error: 'Failed to fetch stats', details: error }, { status: 500 });
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
          return NextResponse.json({ error: 'Test assignment failed', details: error }, { status: 500 });
        }

      case 'database-status':
        // 데이터베이스 연결 및 테이블 상태 확인
        try {
          // 1. experiment_conditions 테이블 확인
          const { data: conditions, error: condError } = await supabase
            .from('experiment_conditions')
            .select('count')
            .limit(1);

          // 2. participants 테이블 확인
          const { data: participants, error: partError } = await supabase
            .from('participants')
            .select('count')
            .limit(1);

          // 3. RLS 정책 확인 (간접적으로)
          const { data: testInsert, error: insertError } = await supabase
            .from('events')
            .insert({
              participant_id: 'test-' + Date.now(),
              event_type: 'test',
              payload: { test: true }
            })
            .select();

          // 테스트 데이터 삭제
          if (testInsert && testInsert.length > 0) {
            await supabase.from('events').delete().eq('id', testInsert[0].id);
          }

          return NextResponse.json({
            databaseStatus: 'connected',
            tables: {
              experiment_conditions: {
                accessible: !condError,
                error: condError?.message || null
              },
              participants: {
                accessible: !partError,
                error: partError?.message || null
              },
              events: {
                insertable: !insertError,
                error: insertError?.message || null
              }
            },
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          return NextResponse.json({ 
            databaseStatus: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }, { status: 500 });
        }

      case 'test-participant-creation':
        // 참가자 생성 테스트
        try {
          const testData = {
            prolific_pid: 'test-' + Date.now(),
            study_id: 'test-study',
            session_id: 'test-session-' + Date.now()
          };

          const response = await fetch(`${request.nextUrl.origin}/api/participants/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
          });

          const result = await response.json();

          if (response.ok) {
            // 테스트 참가자 정리
            if (result.participant?.id) {
              await supabase.from('participants').delete().eq('id', result.participant.id);
            }
            return NextResponse.json({ 
              message: 'Test participant creation successful',
              participant: result.participant,
              testData
            });
          } else {
            return NextResponse.json({ 
              error: 'Test participant creation failed',
              details: result,
              testData
            }, { status: 500 });
          }

        } catch (error) {
          return NextResponse.json({ 
            error: 'Test participant creation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }

      default:
        return NextResponse.json({ 
          message: 'Debug API available',
          actions: [
            'conditions', 
            'participants', 
            'stats', 
            'test-assignment',
            'database-status',
            'test-participant-creation'
          ],
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
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
          return NextResponse.json({ error: 'Failed to reset conditions', details: resetError }, { status: 500 });
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
          return NextResponse.json({ error: 'Cleanup failed', details: error }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Debug API POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
