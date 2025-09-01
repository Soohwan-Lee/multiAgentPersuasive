-- 007_atomic_condition_assignment.sql
-- 동시성 문제 해결을 위한 원자적 조건 배정 함수

-- 원자적 조건 배정 함수
CREATE OR REPLACE FUNCTION assign_next_condition(p_participant_id UUID)
RETURNS TABLE(
    condition_id INTEGER,
    condition_type TEXT,
    task_order TEXT,
    informative_task_index INTEGER,
    normative_task_index INTEGER
) AS $$
DECLARE
    assigned_condition RECORD;
BEGIN
    -- 사용 가능한 첫 번째 조건을 원자적으로 선택하고 할당
    UPDATE experiment_conditions 
    SET 
        is_assigned = true,
        assigned_participant_id = p_participant_id,
        assigned_at = NOW()
    WHERE id = (
        SELECT id 
        FROM experiment_conditions 
        WHERE is_assigned = false 
        ORDER BY id 
        LIMIT 1
        FOR UPDATE SKIP LOCKED  -- 동시성 처리: 이미 선택된 행은 건너뛰기
    )
    RETURNING 
        id as condition_id,
        experiment_conditions.condition_type,
        experiment_conditions.task_order,
        experiment_conditions.informative_task_index,
        experiment_conditions.normative_task_index
    INTO assigned_condition;
    
    -- 할당된 조건이 있으면 반환
    IF assigned_condition.condition_id IS NOT NULL THEN
        RETURN QUERY SELECT 
            assigned_condition.condition_id,
            assigned_condition.condition_type,
            assigned_condition.task_order,
            assigned_condition.informative_task_index,
            assigned_condition.normative_task_index;
    END IF;
    
    -- 할당 가능한 조건이 없으면 빈 결과 반환
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 중도 이탈자 정리 함수 (타임아웃 기반)
CREATE OR REPLACE FUNCTION cleanup_abandoned_assignments()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- 30분 이상 비활성 상태이고 완료하지 않은 참가자의 조건 해제
    WITH abandoned_participants AS (
        SELECT ec.id as condition_id, ec.assigned_participant_id
        FROM experiment_conditions ec
        JOIN participants p ON ec.assigned_participant_id = p.id
        WHERE ec.is_assigned = true 
          AND ec.assigned_at < NOW() - INTERVAL '30 minutes'
          AND p.finished_at IS NULL
    ),
    reset_conditions AS (
        UPDATE experiment_conditions 
        SET 
            is_assigned = false,
            assigned_participant_id = NULL,
            assigned_at = NULL
        WHERE id IN (SELECT condition_id FROM abandoned_participants)
        RETURNING id
    ),
    mark_participants AS (
        UPDATE participants 
        SET finished_at = NOW()  -- 중도 이탈로 표시
        WHERE id IN (SELECT assigned_participant_id FROM abandoned_participants)
        RETURNING id
    )
    SELECT COUNT(*) FROM reset_conditions INTO cleaned_count;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- 조건 배정 상태 확인 함수
CREATE OR REPLACE FUNCTION get_condition_stats()
RETURNS TABLE(
    total_conditions INTEGER,
    assigned_conditions INTEGER,
    available_conditions INTEGER,
    completed_participants INTEGER,
    active_participants INTEGER,
    abandoned_participants INTEGER
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM experiment_conditions) as total_conditions,
        (SELECT COUNT(*)::INTEGER FROM experiment_conditions WHERE is_assigned = true) as assigned_conditions,
        (SELECT COUNT(*)::INTEGER FROM experiment_conditions WHERE is_assigned = false) as available_conditions,
        (SELECT COUNT(*)::INTEGER FROM participants WHERE finished_at IS NOT NULL) as completed_participants,
        (SELECT COUNT(*)::INTEGER FROM participants WHERE finished_at IS NULL AND created_at > NOW() - INTERVAL '30 minutes') as active_participants,
        (SELECT COUNT(*)::INTEGER FROM participants WHERE finished_at IS NULL AND created_at <= NOW() - INTERVAL '30 minutes') as abandoned_participants;
END;
$$ LANGUAGE plpgsql;

-- 권한 설정 (public 스키마에서 실행 가능하도록)
GRANT EXECUTE ON FUNCTION assign_next_condition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_assignments() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_condition_stats() TO anon, authenticated;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_participants_finished_created ON participants(finished_at, created_at);
CREATE INDEX IF NOT EXISTS idx_experiment_conditions_assigned_at ON experiment_conditions(assigned_at) WHERE is_assigned = true;
