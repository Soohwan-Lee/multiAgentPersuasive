-- 010_simplify_rls.sql
-- Simplify RLS policies to fix data insertion issues

-- Drop existing policies for events table
DROP POLICY IF EXISTS "Allow all users to read events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to insert events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to update events" ON events;

-- Create simplified policies for events table
CREATE POLICY "Allow all operations on events"
ON events
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for participants table
DROP POLICY IF EXISTS "Allow all users to read participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to update participants" ON participants;

-- Create simplified policies for participants table
CREATE POLICY "Allow all operations on participants"
ON participants
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for experiment_conditions table
DROP POLICY IF EXISTS "Allow all users to read experiment_conditions" ON experiment_conditions;
DROP POLICY IF EXISTS "Allow authenticated users to update experiment_conditions" ON experiment_conditions;

-- Create simplified policies for experiment_conditions table
CREATE POLICY "Allow all operations on experiment_conditions"
ON experiment_conditions
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for sessions table
DROP POLICY IF EXISTS "Allow all users to read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update sessions" ON sessions;

-- Create simplified policies for sessions table
CREATE POLICY "Allow all operations on sessions"
ON sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for turn_responses table
DROP POLICY IF EXISTS "Allow all users to read turn_responses" ON turn_responses;
DROP POLICY IF EXISTS "Allow authenticated users to insert turn_responses" ON turn_responses;
DROP POLICY IF EXISTS "Allow authenticated users to update turn_responses" ON turn_responses;

-- Create simplified policies for turn_responses table
CREATE POLICY "Allow all operations on turn_responses"
ON turn_responses
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for messages table
DROP POLICY IF EXISTS "Allow all users to read messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated users to update messages" ON messages;

-- Create simplified policies for messages table
CREATE POLICY "Allow all operations on messages"
ON messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for background_surveys table
DROP POLICY IF EXISTS "Allow all users to read background_surveys" ON background_surveys;
DROP POLICY IF EXISTS "Allow authenticated users to insert background_surveys" ON background_surveys;
DROP POLICY IF EXISTS "Allow authenticated users to update background_surveys" ON background_surveys;

-- Create simplified policies for background_surveys table
CREATE POLICY "Allow all operations on background_surveys"
ON background_surveys
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for post_self_surveys table
DROP POLICY IF EXISTS "Allow all users to read post_self_surveys" ON post_self_surveys;
DROP POLICY IF EXISTS "Allow authenticated users to insert post_self_surveys" ON post_self_surveys;
DROP POLICY IF EXISTS "Allow authenticated users to update post_self_surveys" ON post_self_surveys;

-- Create simplified policies for post_self_surveys table
CREATE POLICY "Allow all operations on post_self_surveys"
ON post_self_surveys
FOR ALL
USING (true)
WITH CHECK (true);

-- Drop existing policies for post_open_surveys table
DROP POLICY IF EXISTS "Allow all users to read post_open_surveys" ON post_open_surveys;
DROP POLICY IF EXISTS "Allow authenticated users to insert post_open_surveys" ON post_open_surveys;
DROP POLICY IF EXISTS "Allow authenticated users to update post_open_surveys" ON post_open_surveys;

-- Create simplified policies for post_open_surveys table
CREATE POLICY "Allow all operations on post_open_surveys"
ON post_open_surveys
FOR ALL
USING (true)
WITH CHECK (true);

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
