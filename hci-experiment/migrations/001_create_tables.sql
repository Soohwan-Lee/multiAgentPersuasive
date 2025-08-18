-- participants 테이블 생성
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prolific_pid TEXT NOT NULL,
    study_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    condition TEXT NULL, -- e.g., majority/minority/diffusion (we may set later)
    created_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ NULL
);

-- sessions 테이블 생성
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    key TEXT NOT NULL CHECK (key IN ('test', 'main1', 'main2')),
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    current_turn INT DEFAULT 0,
    UNIQUE (participant_id, key)
);

-- turns 테이블 생성
CREATE TABLE turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    t_idx INT NOT NULL CHECK (t_idx >= 0 AND t_idx <= 3),
    user_msg TEXT NOT NULL,
    public_choice TEXT NULL,
    public_conf INT NULL CHECK (public_conf >= 0 AND public_conf <= 100),
    private_belief TEXT NULL,
    private_conf INT NULL CHECK (private_conf >= 0 AND private_conf <= 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (participant_id, session_key, t_idx)
);

-- messages 테이블 생성
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    t_idx INT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'agent1', 'agent2', 'agent3')),
    content TEXT NOT NULL,
    latency_ms INT NULL,
    token_in INT NULL,
    token_out INT NULL,
    fallback_used BOOLEAN DEFAULT false,
    ts TIMESTAMPTZ DEFAULT now()
);

-- events 테이블 생성
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB NULL,
    ts TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_participants_prolific ON participants(prolific_pid, study_id, session_id);
CREATE INDEX idx_sessions_participant ON sessions(participant_id);
CREATE INDEX idx_turns_participant_session ON turns(participant_id, session_key);
CREATE INDEX idx_messages_participant_session ON messages(participant_id, session_key, t_idx);
CREATE INDEX idx_events_participant ON events(participant_id);

-- RLS (Row Level Security) 비활성화 (서비스 롤 사용)
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE turns DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
