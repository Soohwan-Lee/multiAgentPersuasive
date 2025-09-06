-- Split SII, NFC, AI Acceptance arrays into individual columns
alter table if exists background_surveys
  add column if not exists sii_1 int,
  add column if not exists sii_2 int,
  add column if not exists sii_3 int,
  add column if not exists sii_4 int,
  add column if not exists nfc_1 int,
  add column if not exists nfc_2 int,
  add column if not exists nfc_3 int,
  add column if not exists nfc_4 int,
  add column if not exists nfc_5 int,
  add column if not exists nfc_6 int,
  add column if not exists ai_acceptance_1 int,
  add column if not exists ai_acceptance_2 int,
  add column if not exists ai_acceptance_3 int,
  add column if not exists ai_acceptance_4 int,
  add column if not exists ai_acceptance_5 int;


