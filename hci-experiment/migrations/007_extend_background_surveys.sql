-- Extend background_surveys to match UI fields
alter table if exists background_surveys
  add column if not exists country text,
  add column if not exists languages text[],
  add column if not exists english_proficiency int,
  add column if not exists race_ethnicity text,
  add column if not exists race_other text,
  add column if not exists llm_usage int,
  add column if not exists tools_used text[],
  add column if not exists tools_other text,
  add column if not exists multi_agent_experience text,
  add column if not exists multi_agent_types text[],
  add column if not exists multi_agent_other text,
  add column if not exists multi_agent_open_ended text,
  add column if not exists sii int[],
  add column if not exists nfc int[],
  add column if not exists ai_acceptance int[];

-- Drop old columns that are not used by UI (if present)
-- Note: keep gender/education/occupation/age which UI still uses
-- Optional legacy columns kept for compatibility

