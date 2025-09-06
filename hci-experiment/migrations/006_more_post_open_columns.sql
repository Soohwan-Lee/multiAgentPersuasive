-- Make post_open_surveys robust for all open-ended questions and condition-specific Q4
alter table if exists post_open_surveys
  add column if not exists reason_for_change text,
  add column if not exists internal_inconsistency text,
  add column if not exists pattern_experience text,
  add column if not exists pattern_experience_majority text,
  add column if not exists pattern_experience_minority text,
  add column if not exists pattern_experience_diffusion text;


