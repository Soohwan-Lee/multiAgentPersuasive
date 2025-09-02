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
            .select('id')
            .limit(1);

          // 2. participants 테이블 확인
          const { data: participants, error: partError } = await supabase
            .from('participants')
            .select('id')
            .limit(1);

          // 3. RLS 정책 확인 (간접적으로)
          // events 테이블 테스트를 위해 임시 테스트 참가자 생성
          let eventsInsertable = false;
          let eventsError = null;
          let tempParticipantId = null;
          
          try {
            // 임시 테스트 참가자 생성
            const tempParticipant = {
              prolific_pid: 'temp-test-' + Date.now(),
              study_id: 'temp-test',
              session_id: 'temp-session-' + Date.now(),
              condition_type: 'majority',
              task_order: 'informativeFirst',
              informative_task_index: 0,
              normative_task_index: 0,
              browser_info: { test: true },
              device_info: { test: true }
            };

            const { data: tempParticipantData, error: tempInsertError } = await supabase
              .from('participants')
              .insert([tempParticipant])
              .select()
              .single();

            if (tempInsertError) {
              eventsInsertable = false;
              eventsError = `Failed to create temp participant: ${tempInsertError.message}`;
            } else {
              tempParticipantId = tempParticipantData.id;
              
              // events 테이블에 테스트 데이터 삽입
              const { data: testInsert, error: insertError } = await supabase
                .from('events')
                .insert({
                  participant_id: tempParticipantId,
                  event_type: 'test',
                  payload: { test: true }
                })
                .select();

              // 테스트 데이터 삭제
              if (testInsert && testInsert.length > 0) {
                await supabase.from('events').delete().eq('id', testInsert[0].id);
              }
              
              eventsInsertable = !insertError;
              eventsError = insertError?.message || null;
            }

            // 임시 참가자 정리
            if (tempParticipantId) {
              await supabase.from('participants').delete().eq('id', tempParticipantId);
            }

          } catch (testError) {
            eventsInsertable = false;
            eventsError = `Events test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`;
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
                insertable: eventsInsertable,
                error: eventsError
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

      case 'test-data-insertion':
        // 실제 데이터 삽입 테스트
        try {
          // 1. 테스트 참가자 생성
          const testParticipant = {
            prolific_pid: 'test-insert-' + Date.now(),
            study_id: 'test-study',
            session_id: 'test-session-' + Date.now(),
            condition_type: 'majority',
            task_order: 'informativeFirst',
            informative_task_index: 0,
            normative_task_index: 0,
            browser_info: { test: true },
            device_info: { test: true }
          };

          const { data: participant, error: participantError } = await supabase
            .from('participants')
            .insert([testParticipant])
            .select()
            .single();

          if (participantError) {
            return NextResponse.json({ 
              error: 'Failed to create test participant',
              details: participantError
            }, { status: 500 });
          }

          // 2. 테스트 세션 생성
          const testSession = {
            participant_id: participant.id,
            session_key: 'test',
            session_order: 1,
            task_content: 'Test task',
            task_type: 'test',
            task_index: 0
          };

          const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert([testSession])
            .select()
            .single();

          if (sessionError) {
            // 세션 생성 실패 시 참가자도 삭제
            await supabase.from('participants').delete().eq('id', participant.id);
            return NextResponse.json({ 
              error: 'Failed to create test session',
              details: sessionError
            }, { status: 500 });
          }

          // 3. 테스트 응답 생성
          const testResponse = {
            participant_id: participant.id,
            session_id: session.id,
            cycle: null,
            response_index: 0,
            opinion: 0,
            confidence: 50,
            response_time_ms: 1000
          };

          const { data: response, error: responseError } = await supabase
            .from('turn_responses')
            .insert([testResponse])
            .select()
            .single();

          if (responseError) {
            // 응답 생성 실패 시 세션과 참가자도 삭제
            await supabase.from('sessions').delete().eq('id', session.id);
            await supabase.from('participants').delete().eq('id', participant.id);
            return NextResponse.json({ 
              error: 'Failed to create test response',
              details: responseError
            }, { status: 500 });
          }

          // 4. 테스트 데이터 정리
          await supabase.from('turn_responses').delete().eq('id', response.id);
          await supabase.from('sessions').delete().eq('id', session.id);
          await supabase.from('participants').delete().eq('id', participant.id);

          return NextResponse.json({ 
            message: 'All data insertion tests passed',
            testResults: {
              participant: participant.id,
              session: session.id,
              response: response.id
            }
          });

        } catch (error) {
          return NextResponse.json({ 
            error: 'Data insertion test failed',
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
            'test-participant-creation',
            'test-data-insertion'
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
