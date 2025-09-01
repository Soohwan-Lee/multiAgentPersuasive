-- Comprehensive HCI Experiment Schema
-- This schema captures all participant data, sessions, messages, responses, and surveys

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PARTICIPANTS TABLE
-- Stores basic participant information and experiment conditions
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prolific_pid TEXT UNIQUE NOT NULL,
    study_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    
    -- Experiment conditions
    condition_type TEXT NOT NULL CHECK (condition_type IN ('majority', 'minority', 'minorityDiffusion')),
    task_order TEXT NOT NULL CHECK (task_order IN ('informativeFirst', 'normativeFirst')),
    informative_task_index INTEGER NOT NULL CHECK (informative_task_index >= 0 AND informative_task_index <= 5),
    normative_task_index INTEGER NOT NULL CHECK (normative_task_index >= 0 AND normative_task_index <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Metadata
    browser_info JSONB,
    device_info JSONB
);

-- 2. BACKGROUND_SURVEYS TABLE
-- Stores demographic and background information
CREATE TABLE background_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    
    -- Demographics
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    education TEXT NOT NULL,
    occupation TEXT,
    
    -- Background questions
    political_views TEXT,
    social_media_usage TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SESSIONS TABLE
-- Stores session information for test, normative, and informative sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    
    -- Session details
    session_key TEXT NOT NULL CHECK (session_key IN ('test', 'normative', 'informative')),
    session_order INTEGER NOT NULL, -- 1 for first, 2 for second main session
    
    -- Task information
    task_content TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('test', 'normative', 'informative')),
    task_index INTEGER, -- 0-5 for normative/informative tasks, NULL for test
    
    -- Session state
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    current_turn INTEGER DEFAULT 0,
    current_response INTEGER DEFAULT 0,
    current_cycle INTEGER DEFAULT 0
);

-- 4. T0_RESPONSES TABLE
-- Stores initial responses (T0) for each session
CREATE TABLE t0_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Response data
    opinion INTEGER NOT NULL CHECK (opinion >= -50 AND opinion <= 50),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    response_time_ms INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MESSAGES TABLE
-- Stores all chat messages (user and agent messages)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Message details
    cycle INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'agent1', 'agent2', 'agent3')),
    content TEXT NOT NULL,
    
    -- Performance metrics
    latency_ms INTEGER NULL,
    token_in INTEGER NULL,
    token_out INTEGER NULL,
    fallback_used BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TURN_RESPONSES TABLE
-- Stores responses after each turn (T1, T2, T3, T4)
CREATE TABLE turn_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Turn details
    cycle INTEGER NOT NULL,
    response_index INTEGER NOT NULL, -- T1=1, T2=2, T3=3, T4=4
    
    -- Response data
    opinion INTEGER NOT NULL CHECK (opinion >= -50 AND opinion <= 50),
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    response_time_ms INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. POST_SELF_SURVEYS TABLE
-- Stores self-reported measurements after main sessions
CREATE TABLE post_self_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Survey session info
    survey_number INTEGER NOT NULL CHECK (survey_number IN (1, 2)), -- 1 for first main session, 2 for second
    
    -- Perceived Compliance (all conditions)
    perceived_compliance_1 INTEGER NOT NULL CHECK (perceived_compliance_1 >= 1 AND perceived_compliance_1 <= 7),
    perceived_compliance_2 INTEGER NOT NULL CHECK (perceived_compliance_2 >= 1 AND perceived_compliance_2 <= 7),
    perceived_compliance_3 INTEGER NOT NULL CHECK (perceived_compliance_3 >= 1 AND perceived_compliance_3 <= 7),
    perceived_compliance_4 INTEGER NOT NULL CHECK (perceived_compliance_4 >= 1 AND perceived_compliance_4 <= 7),
    
    -- Perceived Conversion (all conditions)
    perceived_conversion_1 INTEGER NOT NULL CHECK (perceived_conversion_1 >= 1 AND perceived_conversion_1 <= 7),
    perceived_conversion_2 INTEGER NOT NULL CHECK (perceived_conversion_2 >= 1 AND perceived_conversion_2 <= 7),
    perceived_conversion_3 INTEGER NOT NULL CHECK (perceived_conversion_3 >= 1 AND perceived_conversion_3 <= 7),
    perceived_conversion_4 INTEGER NOT NULL CHECK (perceived_conversion_4 >= 1 AND perceived_conversion_4 <= 7),
    
    -- AI Agent Perception (condition-dependent)
    -- For majority condition: all agents together
    agent_competence INTEGER NULL CHECK (agent_competence >= 1 AND agent_competence <= 7),
    agent_predictability INTEGER NULL CHECK (agent_predictability >= 1 AND agent_predictability <= 7),
    agent_integrity INTEGER NULL CHECK (agent_integrity >= 1 AND agent_integrity <= 7),
    agent_understanding INTEGER NULL CHECK (agent_understanding >= 1 AND agent_understanding <= 7),
    agent_utility INTEGER NULL CHECK (agent_utility >= 1 AND agent_utility <= 7),
    agent_affect INTEGER NULL CHECK (agent_affect >= 1 AND agent_affect <= 7),
    agent_trust INTEGER NULL CHECK (agent_trust >= 1 AND agent_trust <= 7),
    
    -- For minority/minorityDiffusion: Agent 1&2 separate from Agent 3
    agent1_competence INTEGER NULL CHECK (agent1_competence >= 1 AND agent1_competence <= 7),
    agent1_predictability INTEGER NULL CHECK (agent1_predictability >= 1 AND agent1_predictability <= 7),
    agent1_integrity INTEGER NULL CHECK (agent1_integrity >= 1 AND agent1_integrity <= 7),
    agent1_understanding INTEGER NULL CHECK (agent1_understanding >= 1 AND agent1_understanding <= 7),
    agent1_utility INTEGER NULL CHECK (agent1_utility >= 1 AND agent1_utility <= 7),
    agent1_affect INTEGER NULL CHECK (agent1_affect >= 1 AND agent1_affect <= 7),
    agent1_trust INTEGER NULL CHECK (agent1_trust >= 1 AND agent1_trust <= 7),
    
    agent3_competence INTEGER NULL CHECK (agent3_competence >= 1 AND agent3_competence <= 7),
    agent3_predictability INTEGER NULL CHECK (agent3_predictability >= 1 AND agent3_predictability <= 7),
    agent3_integrity INTEGER NULL CHECK (agent3_integrity >= 1 AND agent3_integrity <= 7),
    agent3_understanding INTEGER NULL CHECK (agent3_understanding >= 1 AND agent3_understanding <= 7),
    agent3_utility INTEGER NULL CHECK (agent3_utility >= 1 AND agent3_utility <= 7),
    agent3_affect INTEGER NULL CHECK (agent3_affect >= 1 AND agent3_affect <= 7),
    agent3_trust INTEGER NULL CHECK (agent3_trust >= 1 AND agent3_trust <= 7),
    
    -- Concentration test (all conditions)
    concentration_test INTEGER NOT NULL CHECK (concentration_test >= 1 AND concentration_test <= 7),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. POST_OPEN_SURVEYS TABLE
-- Stores open-ended survey responses
CREATE TABLE post_open_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Survey session info
    survey_number INTEGER NOT NULL CHECK (survey_number IN (1, 2)), -- 1 for first main session, 2 for second
    
    -- Open-ended responses
    thoughts_on_experiment TEXT,
    agent_comparison TEXT,
    suggestions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. EVENTS TABLE
-- Stores all experimental events for debugging and analysis
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL,
    payload JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_participants_prolific_pid ON participants(prolific_pid);
CREATE INDEX idx_sessions_participant_id ON sessions(participant_id);
CREATE INDEX idx_sessions_session_key ON sessions(session_key);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_cycle ON messages(cycle);
CREATE INDEX idx_turn_responses_session_id ON turn_responses(session_id);
CREATE INDEX idx_turn_responses_cycle ON turn_responses(cycle);
CREATE INDEX idx_post_self_surveys_participant_id ON post_self_surveys(participant_id);
CREATE INDEX idx_post_open_surveys_participant_id ON post_open_surveys(participant_id);
CREATE INDEX idx_events_participant_id ON events(participant_id);
CREATE INDEX idx_events_type ON events(event_type);

-- Create unique constraints
CREATE UNIQUE INDEX idx_t0_responses_session ON t0_responses(session_id);
CREATE UNIQUE INDEX idx_turn_responses_session_cycle ON turn_responses(session_id, cycle);
CREATE UNIQUE INDEX idx_post_self_surveys_session ON post_self_surveys(session_id);
CREATE UNIQUE INDEX idx_post_open_surveys_session ON post_open_surveys(session_id);

-- Add comments for documentation
COMMENT ON TABLE participants IS 'Stores participant information and experiment conditions';
COMMENT ON TABLE background_surveys IS 'Stores demographic and background survey responses';
COMMENT ON TABLE sessions IS 'Stores session information for test, normative, and informative sessions';
COMMENT ON TABLE t0_responses IS 'Stores initial responses (T0) for each session';
COMMENT ON TABLE messages IS 'Stores all chat messages between participants and agents';
COMMENT ON TABLE turn_responses IS 'Stores responses after each turn (T1, T2, T3, T4)';
COMMENT ON TABLE post_self_surveys IS 'Stores self-reported measurements after main sessions';
COMMENT ON TABLE post_open_surveys IS 'Stores open-ended survey responses';
COMMENT ON TABLE events IS 'Stores all experimental events for debugging and analysis';
