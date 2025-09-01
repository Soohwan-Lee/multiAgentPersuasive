-- Fix Unique Constraint Issue and unify T0 into turn_responses
-- 1) Replace incorrect unique constraint on turn_responses
DROP INDEX IF EXISTS idx_turn_responses_session_cycle;

CREATE UNIQUE INDEX IF NOT EXISTS idx_turn_responses_session_cycle_response 
ON turn_responses(session_id, cycle, response_index);

COMMENT ON INDEX idx_turn_responses_session_cycle_response 
IS 'Ensures unique responses per session, cycle, and response_index (T0-T4)';

-- 2) Ensure response_index can represent T0..T4 (0..4)
ALTER TABLE turn_responses
  DROP CONSTRAINT IF EXISTS turn_responses_response_index_check;

ALTER TABLE turn_responses
  ADD CONSTRAINT turn_responses_response_index_check
  CHECK (response_index >= 0 AND response_index <= 4);

-- 3) Allow cycle to be NULL for T0 rows (no chat yet)
ALTER TABLE turn_responses
  ALTER COLUMN cycle DROP NOT NULL;

-- 4) Migrate existing T0 data from t0_responses into turn_responses
--    Assumes same columns exist; set response_index = 0 and cycle = NULL
INSERT INTO turn_responses (id, participant_id, session_id, cycle, response_index, opinion, confidence, response_time_ms, created_at)
SELECT uuid_generate_v4(), t.participant_id, t.session_id, NULL, 0, t.opinion, t.confidence, t.response_time_ms, t.created_at
FROM t0_responses t
ON CONFLICT DO NOTHING;

-- 5) Drop unique index on t0_responses and optionally drop the table
DROP INDEX IF EXISTS idx_t0_responses_session;

-- If you are confident all code has been migrated, you can drop the table.
-- Otherwise, keep it for rollback.
DROP TABLE IF EXISTS t0_responses;
