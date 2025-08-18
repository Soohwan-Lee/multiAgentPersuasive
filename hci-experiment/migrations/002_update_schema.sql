-- Update sessions table to include current_response and current_cycle
ALTER TABLE sessions 
ADD COLUMN current_response INT DEFAULT 0,
ADD COLUMN current_cycle INT DEFAULT 0;

-- Create new responses table for T0-T4 responses
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    response_index INT NOT NULL CHECK (response_index >= 0 AND response_index <= 4),
    opinion INT NOT NULL CHECK (opinion >= -50 AND opinion <= 50),
    confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    rt_ms INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (participant_id, session_key, response_index)
);

-- Update turns table to represent chat cycles
ALTER TABLE turns 
RENAME COLUMN t_idx TO cycle;

ALTER TABLE turns 
ADD CONSTRAINT turns_cycle_check CHECK (cycle >= 1 AND cycle <= 4);

-- Update messages table to use cycle instead of t_idx
ALTER TABLE messages 
RENAME COLUMN t_idx TO cycle;

ALTER TABLE messages 
ADD CONSTRAINT messages_cycle_check CHECK (cycle >= 1 AND cycle <= 4);

-- Create indexes for performance
CREATE INDEX idx_responses_participant_session ON responses(participant_id, session_key);
CREATE INDEX idx_turns_participant_session_cycle ON turns(participant_id, session_key, cycle);
CREATE INDEX idx_messages_participant_session_cycle ON messages(participant_id, session_key, cycle);

-- Update participants table to support new pattern types
ALTER TABLE participants 
ALTER COLUMN condition TYPE TEXT CHECK (condition IN ('majority', 'minority', 'minorityDiffusion'));

-- Disable RLS for new table
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
