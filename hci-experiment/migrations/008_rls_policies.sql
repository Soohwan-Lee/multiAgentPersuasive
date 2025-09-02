-- 008_rls_policies.sql
-- Supabase RLS 정책 설정

-- 1. experiment_conditions 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read experiment_conditions"
ON experiment_conditions
FOR SELECT
USING (true);

-- 인증된 사용자만 업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to update experiment_conditions"
ON experiment_conditions
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 2. participants 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read participants"
ON participants
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert participants"
ON participants
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update participants"
ON participants
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 3. sessions 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read sessions"
ON sessions
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert sessions"
ON sessions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update sessions"
ON sessions
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 4. turn_responses 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read turn_responses"
ON turn_responses
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert turn_responses"
ON turn_responses
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update turn_responses"
ON turn_responses
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 5. messages 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read messages"
ON messages
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert messages"
ON messages
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update messages"
ON messages
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 6. background_surveys 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read background_surveys"
ON background_surveys
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert background_surveys"
ON background_surveys
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update background_surveys"
ON background_surveys
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 7. post_self_surveys 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read post_self_surveys"
ON post_self_surveys
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert post_self_surveys"
ON post_self_surveys
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update post_self_surveys"
ON post_self_surveys
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 8. post_open_surveys 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read post_open_surveys"
ON post_open_surveys
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert post_open_surveys"
ON post_open_surveys
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update post_open_surveys"
ON post_open_surveys
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 9. events 테이블에 대한 RLS 정책
-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Allow all users to read events"
ON events
FOR SELECT
USING (true);

-- 인증된 사용자만 삽입/업데이트 가능하도록 설정
CREATE POLICY "Allow authenticated users to insert events"
ON events
FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to update events"
ON events
FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 10. RLS 활성화
ALTER TABLE experiment_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_self_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_open_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 11. 함수 실행 권한 확인
-- assign_next_condition 함수가 제대로 작동하는지 확인
GRANT EXECUTE ON FUNCTION assign_next_condition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_assignments() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_condition_stats() TO anon, authenticated;

-- 12. 테이블 접근 권한 확인
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
