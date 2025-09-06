-- Extend post_open_surveys to capture all open-ended answers
alter table if exists post_open_surveys
  add column if not exists reason_for_change text,
  add column if not exists internal_inconsistency text,
  add column if not exists pattern_experience text;


