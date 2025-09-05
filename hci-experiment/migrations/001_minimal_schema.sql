-- Minimal schema for participants, conditions, responses, messages, surveys
-- plus compatibility tables used in code (sessions, turns, turn_responses, events)

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'social_influence') then
    create type social_influence as enum ('majority','minority','minorityDiffusion');
  end if;

  if not exists (select 1 from pg_type where typname = 'session_key') then
    create type session_key as enum ('test','informative','normative');
  end if;

  if not exists (select 1 from pg_type where typname = 'survey_type') then
    create type survey_type as enum ('background','post_self','post_open');
  end if;
end$$;

-- Participants
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'prolific',
  prolific_pid text,
  study_id text,
  session_id text,
  condition_type social_influence,
  task_order text check (task_order in ('informativeFirst','normativeFirst')),
  informative_task_index int,
  normative_task_index int,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Experiment conditions (pre-seeded for counterbalancing)
create table if not exists experiment_conditions (
  id bigserial primary key,
  condition_type social_influence not null,
  task_order text not null check (task_order in ('informativeFirst','normativeFirst')),
  informative_task_index int not null check (informative_task_index between 0 and 5),
  normative_task_index int not null check (normative_task_index between 0 and 5),
  is_assigned boolean not null default false,
  assigned_participant_id uuid references participants(id),
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

-- Drop existing function to avoid return type change error
drop function if exists assign_next_condition(uuid);

-- Atomic assignment function
create or replace function assign_next_condition(p_participant_id uuid)
returns table (
  condition_id bigint,
  condition_type social_influence,
  task_order text,
  informative_task_index int,
  normative_task_index int
) language plpgsql as $$
declare
  v_id bigint;
begin
  select id into v_id
  from experiment_conditions
  where is_assigned = false
  order by id
  for update skip locked
  limit 1;

  if v_id is null then
    return;
  end if;

  update experiment_conditions
     set is_assigned = true,
         assigned_participant_id = p_participant_id,
         assigned_at = now()
   where id = v_id;

  update participants p
     set condition_type = ec.condition_type,
         task_order = ec.task_order,
         informative_task_index = ec.informative_task_index,
         normative_task_index = ec.normative_task_index
    from experiment_conditions ec
   where p.id = p_participant_id
     and ec.id = v_id;

  return query
  select ec.id, ec.condition_type, ec.task_order, ec.informative_task_index, ec.normative_task_index
    from experiment_conditions ec
   where ec.id = v_id;
end $$;

-- Drop existing stub to avoid signature conflicts
drop function if exists cleanup_abandoned_assignments();

-- Optional cleanup RPC stub (no-op but keeps code paths working)
create or replace function cleanup_abandoned_assignments()
returns int language plpgsql as $$
begin
  return 0;
end $$;

-- Responses (T0..T4)
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_key session_key not null,
  response_index int not null check (response_index between 0 and 4),
  opinion smallint not null check (opinion between -50 and 50),
  confidence smallint not null check (confidence between 0 and 100),
  rt_ms int,
  created_at timestamptz not null default now(),
  unique (participant_id, session_key, response_index)
);

-- Messages (store both session_key and session_id for compatibility)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_key session_key,
  session_id uuid,
  cycle int not null check (cycle between 1 and 4),
  role text not null check (role in ('user','agent1','agent2','agent3')),
  content text not null,
  latency_ms int,
  token_in int,
  token_out int,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now(),
  ts timestamptz not null default now()
);

-- Surveys (background, post_self, post_open)
create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_key session_key,
  survey_type survey_type not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Sessions (compat table used by current code)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  key session_key not null,
  session_order int,
  task_content text,
  task_type session_key,
  task_index int,
  started_at timestamptz,
  completed_at timestamptz,
  current_turn int not null default 0,
  current_response int not null default 0,
  current_cycle int not null default 0
);

-- Turns (compat for orchestrator upsert on conflict)
create table if not exists turns (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_key session_key not null,
  cycle int not null check (cycle between 1 and 4),
  user_msg text,
  ts timestamptz not null default now(),
  unique (participant_id, session_key, cycle)
);

-- Turn-level responses (compat for older code paths)
create table if not exists turn_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid,
  cycle int,
  response_index int not null check (response_index between 0 and 4),
  opinion smallint not null check (opinion between -50 and 50),
  confidence smallint not null check (confidence between 0 and 100),
  response_time_ms int,
  created_at timestamptz not null default now()
);

-- Events (optional)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  type text not null,
  payload jsonb default '{}'::jsonb,
  ts timestamptz not null default now(),
  created_at timestamptz not null default now()
);


