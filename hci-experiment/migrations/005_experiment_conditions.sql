-- Experiment Conditions Table for Counterbalanced Design
-- This table stores pre-generated conditions for 126 participants

-- 10. EXPERIMENT_CONDITIONS TABLE
-- Stores pre-generated counterbalanced conditions for participants
CREATE TABLE experiment_conditions (
    id SERIAL PRIMARY KEY,
    
    -- Experiment conditions
    condition_type TEXT NOT NULL CHECK (condition_type IN ('majority', 'minority', 'minorityDiffusion')),
    task_order TEXT NOT NULL CHECK (task_order IN ('informativeFirst', 'normativeFirst')),
    informative_task_index INTEGER NOT NULL CHECK (informative_task_index >= 0 AND informative_task_index <= 5),
    normative_task_index INTEGER NOT NULL CHECK (normative_task_index >= 0 AND normative_task_index <= 5),
    
    -- Assignment status
    is_assigned BOOLEAN DEFAULT FALSE,
    assigned_participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient condition assignment
CREATE INDEX idx_experiment_conditions_assigned ON experiment_conditions(is_assigned, id);
CREATE INDEX idx_experiment_conditions_participant ON experiment_conditions(assigned_participant_id);

-- Add comment for documentation
COMMENT ON TABLE experiment_conditions IS 'Stores pre-generated counterbalanced conditions for 126 participants';

-- Insert counterbalanced conditions for 126 participants
-- Pattern: 3 conditions × 2 orders × 21 participants per combination = 126 total
-- Each condition gets 42 participants (21 informativeFirst + 21 normativeFirst)
-- Task indices cycle through 0-5 for each combination

-- Majority condition (42 participants)
-- informativeFirst (21 participants)
INSERT INTO experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index) VALUES
-- Majority + informativeFirst + task cycling
('majority', 'informativeFirst', 0, 0),
('majority', 'informativeFirst', 1, 1),
('majority', 'informativeFirst', 2, 2),
('majority', 'informativeFirst', 3, 3),
('majority', 'informativeFirst', 4, 4),
('majority', 'informativeFirst', 5, 5),
('majority', 'informativeFirst', 0, 1),
('majority', 'informativeFirst', 1, 2),
('majority', 'informativeFirst', 2, 3),
('majority', 'informativeFirst', 3, 4),
('majority', 'informativeFirst', 4, 5),
('majority', 'informativeFirst', 5, 0),
('majority', 'informativeFirst', 0, 2),
('majority', 'informativeFirst', 1, 3),
('majority', 'informativeFirst', 2, 4),
('majority', 'informativeFirst', 3, 5),
('majority', 'informativeFirst', 4, 0),
('majority', 'informativeFirst', 5, 1),
('majority', 'informativeFirst', 0, 3),
('majority', 'informativeFirst', 1, 4),
('majority', 'informativeFirst', 2, 5);

-- Majority + normativeFirst (21 participants)
INSERT INTO experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index) VALUES
('majority', 'normativeFirst', 0, 0),
('majority', 'normativeFirst', 1, 1),
('majority', 'normativeFirst', 2, 2),
('majority', 'normativeFirst', 3, 3),
('majority', 'normativeFirst', 4, 4),
('majority', 'normativeFirst', 5, 5),
('majority', 'normativeFirst', 0, 1),
('majority', 'normativeFirst', 1, 2),
('majority', 'normativeFirst', 2, 3),
('majority', 'normativeFirst', 3, 4),
('majority', 'normativeFirst', 4, 5),
('majority', 'normativeFirst', 5, 0),
('majority', 'normativeFirst', 0, 2),
('majority', 'normativeFirst', 1, 3),
('majority', 'normativeFirst', 2, 4),
('majority', 'normativeFirst', 3, 5),
('majority', 'normativeFirst', 4, 0),
('majority', 'normativeFirst', 5, 1),
('majority', 'normativeFirst', 0, 3),
('majority', 'normativeFirst', 1, 4),
('majority', 'normativeFirst', 2, 5);

-- Minority condition (42 participants)
-- informativeFirst (21 participants)
INSERT INTO experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index) VALUES
('minority', 'informativeFirst', 0, 0),
('minority', 'informativeFirst', 1, 1),
('minority', 'informativeFirst', 2, 2),
('minority', 'informativeFirst', 3, 3),
('minority', 'informativeFirst', 4, 4),
('minority', 'informativeFirst', 5, 5),
('minority', 'informativeFirst', 0, 1),
('minority', 'informativeFirst', 1, 2),
('minority', 'informativeFirst', 2, 3),
('minority', 'informativeFirst', 3, 4),
('minority', 'informativeFirst', 4, 5),
('minority', 'informativeFirst', 5, 0),
('minority', 'informativeFirst', 0, 2),
('minority', 'informativeFirst', 1, 3),
('minority', 'informativeFirst', 2, 4),
('minority', 'informativeFirst', 3, 5),
('minority', 'informativeFirst', 4, 0),
('minority', 'informativeFirst', 5, 1),
('minority', 'informativeFirst', 0, 3),
('minority', 'informativeFirst', 1, 4),
('minority', 'informativeFirst', 2, 5);

-- Minority + normativeFirst (21 participants)
INSERT INTO experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index) VALUES
('minority', 'normativeFirst', 0, 0),
('minority', 'normativeFirst', 1, 1),
('minority', 'normativeFirst', 2, 2),
('minority', 'normativeFirst', 3, 3),
('minority', 'normativeFirst', 4, 4),
('minority', 'normativeFirst', 5, 5),
('minority', 'normativeFirst', 0, 1),
('minority', 'normativeFirst', 1, 2),
('minority', 'normativeFirst', 2, 3),
('minority', 'normativeFirst', 3, 4),
('minority', 'normativeFirst', 4, 5),
('minority', 'normativeFirst', 5, 0),
('minority', 'normativeFirst', 0, 2),
('minority', 'normativeFirst', 1, 3),
('minority', 'normativeFirst', 2, 4),
('minority', 'normativeFirst', 3, 5),
('minority', 'normativeFirst', 4, 0),
('minority', 'normativeFirst', 5, 1),
('minority', 'normativeFirst', 0, 3),
('minority', 'normativeFirst', 1, 4),
('minority', 'normativeFirst', 2, 5);

-- MinorityDiffusion condition (42 participants)
-- informativeFirst (21 participants)
INSERT INTO experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index) VALUES
('minorityDiffusion', 'informativeFirst', 0, 0),
('minorityDiffusion', 'informativeFirst', 1, 1),
('minorityDiffusion', 'informativeFirst', 2, 2),
('minorityDiffusion', 'informativeFirst', 3, 3),
('minorityDiffusion', 'informativeFirst', 4, 4),
('minorityDiffusion', 'informativeFirst', 5, 5),
('minorityDiffusion', 'informativeFirst', 0, 1),
('minorityDiffusion', 'informativeFirst', 1, 2),
('minorityDiffusion', 'informativeFirst', 2, 3),
('minorityDiffusion', 'informativeFirst', 3, 4),
('minorityDiffusion', 'informativeFirst', 4, 5),
('minorityDiffusion', 'informativeFirst', 5, 0),
('minorityDiffusion', 'informativeFirst', 0, 2),
('minorityDiffusion', 'informativeFirst', 1, 3),
('minorityDiffusion', 'informativeFirst', 2, 4),
('minorityDiffusion', 'informativeFirst', 3, 5),
('minorityDiffusion', 'informativeFirst', 4, 0),
('minorityDiffusion', 'informativeFirst', 5, 1),
('minorityDiffusion', 'informativeFirst', 0, 3),
('minorityDiffusion', 'informativeFirst', 1, 4),
('minorityDiffusion', 'informativeFirst', 2, 5);

-- MinorityDiffusion + normativeFirst (21 participants)
INSERT INTO experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index) VALUES
('minorityDiffusion', 'normativeFirst', 0, 0),
('minorityDiffusion', 'normativeFirst', 1, 1),
('minorityDiffusion', 'normativeFirst', 2, 2),
('minorityDiffusion', 'normativeFirst', 3, 3),
('minorityDiffusion', 'normativeFirst', 4, 4),
('minorityDiffusion', 'normativeFirst', 5, 5),
('minorityDiffusion', 'normativeFirst', 0, 1),
('minorityDiffusion', 'normativeFirst', 1, 2),
('minorityDiffusion', 'normativeFirst', 2, 3),
('minorityDiffusion', 'normativeFirst', 3, 4),
('minorityDiffusion', 'normativeFirst', 4, 5),
('minorityDiffusion', 'normativeFirst', 5, 0),
('minorityDiffusion', 'normativeFirst', 0, 2),
('minorityDiffusion', 'normativeFirst', 1, 3),
('minorityDiffusion', 'normativeFirst', 2, 4),
('minorityDiffusion', 'normativeFirst', 3, 5),
('minorityDiffusion', 'normativeFirst', 4, 0),
('minorityDiffusion', 'normativeFirst', 5, 1),
('minorityDiffusion', 'normativeFirst', 0, 3),
('minorityDiffusion', 'normativeFirst', 1, 4),
('minorityDiffusion', 'normativeFirst', 2, 5);

-- Verify the counterbalanced design
-- This query should return 126 rows with balanced conditions
-- SELECT 
--     condition_type,
--     task_order,
--     COUNT(*) as count
-- FROM experiment_conditions 
-- GROUP BY condition_type, task_order 
-- ORDER BY condition_type, task_order;
