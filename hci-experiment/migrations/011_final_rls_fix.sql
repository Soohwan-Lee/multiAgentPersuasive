-- 011_final_rls_fix.sql
-- Final RLS fix that safely handles existing policies

-- First, let's check what policies currently exist and clean them up safely
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop ALL existing policies for our tables
    FOR policy_record IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN (
            'events', 'participants', 'experiment_conditions', 
            'sessions', 'turn_responses', 'messages', 
            'background_surveys', 'post_self_surveys', 'post_open_surveys'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON %I', policy_record.policyname, policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- Now create simplified policies for all tables
-- 1. Events table
CREATE POLICY "Allow all operations on events"
ON events
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Participants table  
CREATE POLICY "Allow all operations on participants"
ON participants
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Experiment_conditions table
CREATE POLICY "Allow all operations on experiment_conditions"
ON experiment_conditions
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Sessions table
CREATE POLICY "Allow all operations on sessions"
ON sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Turn_responses table
CREATE POLICY "Allow all operations on turn_responses"
ON turn_responses
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Messages table
CREATE POLICY "Allow all operations on messages"
ON messages
FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Background_surveys table
CREATE POLICY "Allow all operations on background_surveys"
ON background_surveys
FOR ALL
USING (true)
WITH CHECK (true);

-- 8. Post_self_surveys table
CREATE POLICY "Allow all operations on post_self_surveys"
ON post_self_surveys
FOR ALL
USING (true)
WITH CHECK (true);

-- 9. Post_open_surveys table
CREATE POLICY "Allow all operations on post_open_surveys"
ON post_open_surveys
FOR ALL
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_self_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_open_surveys ENABLE ROW LEVEL SECURITY;

-- Grant all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create or replace functions with correct syntax
CREATE OR REPLACE FUNCTION assign_next_condition(p_participant_id UUID)
RETURNS TABLE(
    condition_id INTEGER,
    condition_type TEXT,
    task_order TEXT,
    informative_task_index INTEGER,
    normative_task_index INTEGER
) AS $$
DECLARE
    available_condition RECORD;
BEGIN
    SELECT id, condition_type, task_order, informative_task_index, normative_task_index
    INTO available_condition
    FROM experiment_conditions 
    WHERE is_assigned = false 
    ORDER BY id 
    LIMIT 1;
    
    IF available_condition.id IS NULL THEN
        RETURN;
    END IF;
    
    UPDATE experiment_conditions 
    SET 
        is_assigned = true,
        assigned_participant_id = p_participant_id,
        assigned_at = NOW()
    WHERE id = available_condition.id
      AND is_assigned = false;
    
    IF FOUND THEN
        RETURN QUERY SELECT 
            available_condition.id,
            available_condition.condition_type,
            available_condition.task_order,
            available_condition.informative_task_index,
            available_condition.normative_task_index;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_abandoned_assignments()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION assign_next_condition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_assignments() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_condition_stats() TO anon, authenticated;

-- Create debug view for monitoring
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

GRANT SELECT ON condition_assignment_debug TO anon, authenticated;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'RLS setup completed successfully!';
    RAISE NOTICE 'All tables now have permissive policies for data insertion.';
    RAISE NOTICE 'Functions and permissions have been configured.';
END $$;
