-- 세션 순서 관리를 위한 테이블 (향후 사용)
-- 이 마이그레이션은 현재는 실행하지 않고, Supabase 연동 시 사용할 예정

-- 조건별 세션 순서 테이블
CREATE TABLE IF NOT EXISTS experiment_conditions (
    id SERIAL PRIMARY KEY,
    participant_id TEXT UNIQUE NOT NULL,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('majority', 'minority', 'minorityDiffusion')),
    session_order TEXT[] NOT NULL CHECK (session_order @> ARRAY['normative', 'informative']),
    task_index_normative INTEGER DEFAULT 0 CHECK (task_index_normative >= 0 AND task_index_normative <= 5),
    task_index_informative INTEGER DEFAULT 0 CHECK (task_index_informative >= 0 AND task_index_informative <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_experiment_conditions_participant_id ON experiment_conditions(participant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_conditions_condition_type ON experiment_conditions(condition_type);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거
CREATE TRIGGER update_experiment_conditions_updated_at 
    BEFORE UPDATE ON experiment_conditions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 (테스트용)
-- INSERT INTO experiment_conditions (participant_id, condition_type, session_order, task_index_normative, task_index_informative) VALUES
-- ('test-participant-1', 'majority', ARRAY['normative', 'informative'], 0, 0),
-- ('test-participant-2', 'minority', ARRAY['informative', 'normative'], 1, 2),
-- ('test-participant-3', 'minorityDiffusion', ARRAY['normative', 'informative'], 3, 1);

-- RLS (Row Level Security) 설정 (보안)
ALTER TABLE experiment_conditions ENABLE ROW LEVEL SECURITY;

-- 참가자별 데이터 접근 정책
CREATE POLICY "Participants can view their own condition data" ON experiment_conditions
    FOR SELECT USING (participant_id = current_setting('app.participant_id', true)::TEXT);

-- 관리자 접근 정책 (필요시)
-- CREATE POLICY "Admins can view all condition data" ON experiment_conditions
--     FOR ALL USING (current_setting('app.role', true) = 'admin');
