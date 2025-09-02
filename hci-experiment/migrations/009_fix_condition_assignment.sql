-- 009_fix_condition_assignment.sql
-- 조건 배정 함수 수정 및 개선

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS assign_next_condition(UUID);
DROP FUNCTION IF EXISTS cleanup_abandoned_assignments();
DROP FUNCTION IF EXISTS get_condition_stats();

-- 개선된 조건 배정 함수
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
    available_condition RECORD;
BEGIN
    -- 사용 가능한 첫 번째 조건을 찾기
    SELECT id, condition_type, task_order, informative_task_index, normative_task_index
    INTO available_condition
    FROM experiment_conditions 
    WHERE is_assigned = false 
    ORDER BY id 
    LIMIT 1;
    
    -- 사용 가능한 조건이 없으면 빈 결과 반환
    IF available_condition.id IS NULL THEN
        RETURN;
    END IF;
    
    -- 조건을 원자적으로 할당
    UPDATE experiment_conditions 
    SET 
        is_assigned = true,
        assigned_participant_id = p_participant_id,
        assigned_at = NOW()
    WHERE id = available_condition.id
      AND is_assigned = false; -- 동시성 보호
    
    -- 할당이 성공했는지 확인
    IF FOUND THEN
        RETURN QUERY SELECT 
            available_condition.id,
            available_condition.condition_type,
            available_condition.task_order,
            available_condition.informative_task_index,
            available_condition.normative_task_index;
    END IF;
    
    -- 할당 실패시 빈 결과 반환
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 중도 이탈자 정리 함수
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
    )
    UPDATE experiment_conditions 
    SET 
        is_assigned = false,
        assigned_participant_id = NULL,
        assigned_at = NULL
    WHERE id IN (SELECT condition_id FROM abandoned_participants);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
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

-- 권한 설정
GRANT EXECUTE ON FUNCTION assign_next_condition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_assignments() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_condition_stats() TO anon, authenticated;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_participants_finished_created ON participants(finished_at, created_at);
CREATE INDEX IF NOT EXISTS idx_experiment_conditions_assigned_at ON experiment_conditions(assigned_at) WHERE is_assigned = true;

-- 디버깅을 위한 뷰 생성
CREATE OR REPLACE VIEW condition_assignment_debug AS
SELECT 
    ec.id as condition_id,
    ec.condition_type,
    ec.task_order,
    ec.informative_task_index,
    ec.normative_task_index,
    ec.is_assigned,
    ec.assigned_participant_id,
    ec.assigned_at,
    p.prolific_pid,
    p.finished_at,
    CASE 
        WHEN p.finished_at IS NULL AND p.created_at > NOW() - INTERVAL '30 minutes' THEN 'active'
        WHEN p.finished_at IS NULL AND p.created_at <= NOW() - INTERVAL '30 minutes' THEN 'abandoned'
        WHEN p.finished_at IS NOT NULL THEN 'completed'
        ELSE 'unknown'
    END as participant_status
FROM experiment_conditions ec
LEFT JOIN participants p ON ec.assigned_participant_id = p.id
ORDER BY ec.id;

-- 권한 설정
GRANT SELECT ON condition_assignment_debug TO anon, authenticated;
