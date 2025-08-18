import { supabase } from '../src/lib/supabase';

async function seedDatabase() {
  console.log('🌱 데이터베이스 시드 시작...');

  try {
    // 더미 참가자 생성
    const participantId = crypto.randomUUID();
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        id: participantId,
        prolific_pid: 'test_participant_001',
        study_id: 'test_study_001',
        session_id: 'test_session_001',
      })
      .select()
      .single();

    if (participantError) {
      console.error('참가자 생성 오류:', participantError);
      return;
    }

    console.log('✅ 참가자 생성 완료:', participant.id);

    // 세션들 생성
    const sessions = [
      { key: 'test', started_at: new Date().toISOString() },
      { key: 'main1', started_at: null },
      { key: 'main2', started_at: null },
    ];

    const sessionInserts = sessions.map(session => ({
      id: crypto.randomUUID(),
      participant_id: participantId,
      key: session.key,
      started_at: session.started_at,
      completed_at: null,
      current_turn: 0,
    }));

    const { error: sessionsError } = await supabase
      .from('sessions')
      .insert(sessionInserts);

    if (sessionsError) {
      console.error('세션 생성 오류:', sessionsError);
      return;
    }

    console.log('✅ 세션들 생성 완료');

    // 테스트 세션을 /session/test로 진행
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ current_turn: 0 })
      .eq('participant_id', participantId)
      .eq('key', 'test');

    if (updateError) {
      console.error('세션 업데이트 오류:', updateError);
      return;
    }

    console.log('✅ 시드 완료!');
    console.log('📝 참가자 ID:', participantId);
    console.log('🔗 테스트 URL: http://localhost:3000/session/test?participantId=' + participantId);

  } catch (error) {
    console.error('시드 오류:', error);
  }
}

seedDatabase();
