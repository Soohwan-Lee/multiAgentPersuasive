-- 010_simplify_rls.sql
-- Simplify RLS policies to fix data insertion issues

-- Use DO blocks to safely create policies without duplicates

-- 1. Events table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read events' AND tablename = 'events') THEN
    DROP POLICY "Allow all users to read events" ON events;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert events' AND tablename = 'events') THEN
    DROP POLICY "Allow authenticated users to insert events" ON events;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update events' AND tablename = 'events') THEN
    DROP POLICY "Allow authenticated users to update events" ON events;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on events"
  ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 2. Participants table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read participants' AND tablename = 'participants') THEN
    DROP POLICY "Allow all users to read participants" ON participants;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert participants' AND tablename = 'participants') THEN
    DROP POLICY "Allow authenticated users to insert participants" ON participants;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update participants' AND tablename = 'participants') THEN
    DROP POLICY "Allow authenticated users to update participants" ON participants;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on participants"
  ON participants
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 3. Experiment_conditions table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read experiment_conditions' AND tablename = 'experiment_conditions') THEN
    DROP POLICY "Allow all users to read experiment_conditions" ON experiment_conditions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update experiment_conditions' AND tablename = 'experiment_conditions') THEN
    DROP POLICY "Allow authenticated users to update experiment_conditions" ON experiment_conditions;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on experiment_conditions"
  ON experiment_conditions
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 4. Sessions table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read sessions' AND tablename = 'sessions') THEN
    DROP POLICY "Allow all users to read sessions" ON sessions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert sessions' AND tablename = 'sessions') THEN
    DROP POLICY "Allow authenticated users to insert sessions" ON sessions;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update sessions' AND tablename = 'sessions') THEN
    DROP POLICY "Allow authenticated users to update sessions" ON sessions;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on sessions"
  ON sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 5. Turn_responses table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read turn_responses' AND tablename = 'turn_responses') THEN
    DROP POLICY "Allow all users to read turn_responses" ON turn_responses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert turn_responses' AND tablename = 'turn_responses') THEN
    DROP POLICY "Allow authenticated users to insert turn_responses" ON turn_responses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update turn_responses' AND tablename = 'turn_responses') THEN
    DROP POLICY "Allow authenticated users to update turn_responses" ON turn_responses;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on turn_responses"
  ON turn_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 6. Messages table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read messages' AND tablename = 'messages') THEN
    DROP POLICY "Allow all users to read messages" ON messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert messages' AND tablename = 'messages') THEN
    DROP POLICY "Allow authenticated users to insert messages" ON messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update messages' AND tablename = 'messages') THEN
    DROP POLICY "Allow authenticated users to update messages" ON messages;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on messages"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 7. Background_surveys table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read background_surveys' AND tablename = 'background_surveys') THEN
    DROP POLICY "Allow all users to read background_surveys" ON background_surveys;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert background_surveys' AND tablename = 'background_surveys') THEN
    DROP POLICY "Allow authenticated users to insert background_surveys" ON background_surveys;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update background_surveys' AND tablename = 'background_surveys') THEN
    DROP POLICY "Allow authenticated users to update background_surveys" ON background_surveys;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on background_surveys"
  ON background_surveys
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 8. Post_self_surveys table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read post_self_surveys' AND tablename = 'post_self_surveys') THEN
    DROP POLICY "Allow all users to read post_self_surveys" ON post_self_surveys;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert post_self_surveys' AND tablename = 'post_self_surveys') THEN
    DROP POLICY "Allow authenticated users to insert post_self_surveys" ON post_self_surveys;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update post_self_surveys' AND tablename = 'post_self_surveys') THEN
    DROP POLICY "Allow authenticated users to update post_self_surveys" ON post_self_surveys;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on post_self_surveys"
  ON post_self_surveys
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- 9. Post_open_surveys table policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all users to read post_open_surveys' AND tablename = 'post_open_surveys') THEN
    DROP POLICY "Allow all users to read post_open_surveys" ON post_open_surveys;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert post_open_surveys' AND tablename = 'post_open_surveys') THEN
    DROP POLICY "Allow authenticated users to insert post_open_surveys" ON post_open_surveys;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to update post_open_surveys' AND tablename = 'post_open_surveys') THEN
    DROP POLICY "Allow authenticated users to update post_open_surveys" ON post_open_surveys;
  END IF;
  
  -- Create simplified policy
  CREATE POLICY "Allow all operations on post_open_surveys"
  ON post_open_surveys
  FOR ALL
  USING (true)
  WITH CHECK (true);
END $$;

-- Ensure all tables have RLS enabled but with permissive policies
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

-- Verify function permissions
GRANT EXECUTE ON FUNCTION assign_next_condition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_assignments() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_condition_stats() TO anon, authenticated;
