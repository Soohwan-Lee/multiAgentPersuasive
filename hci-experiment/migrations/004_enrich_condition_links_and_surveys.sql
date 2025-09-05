-- Add participant_no and condition_id propagation; create dedicated survey tables

-- 1) participants.participant_no (experiment_conditions.id)
alter table if exists participants add column if not exists participant_no bigint;

-- backfill participant_no for already assigned participants
update participants p
   set participant_no = ec.id
  from experiment_conditions ec
 where ec.assigned_participant_id = p.id
   and p.participant_no is null;

-- 2) responses/messages add condition_id for every row
alter table if exists responses add column if not exists condition_id bigint references experiment_conditions(id);
alter table if exists messages add column if not exists condition_id bigint references experiment_conditions(id);

-- backfill condition_id
update responses r
   set condition_id = ec.id
  from experiment_conditions ec
  join participants p on p.id = r.participant_id
 where ec.assigned_participant_id = p.id
   and r.condition_id is null;

update messages m
   set condition_id = ec.id
  from experiment_conditions ec
  join participants p on p.id = m.participant_id
 where ec.assigned_participant_id = p.id
   and m.condition_id is null;

-- 3) create dedicated survey tables
create table if not exists background_surveys (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  participant_no bigint,
  condition_id bigint references experiment_conditions(id),
  condition_type social_influence,
  task_order text,
  age int not null,
  gender text not null,
  education text not null,
  occupation text,
  political_views text,
  social_media_usage text,
  created_at timestamptz not null default now()
);

create table if not exists post_self_surveys (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  participant_no bigint,
  condition_id bigint references experiment_conditions(id),
  condition_type social_influence,
  task_order text,
  task_type session_key,
  survey_number int not null check (survey_number in (1,2)),
  perceived_compliance_1 int not null,
  perceived_compliance_2 int not null,
  perceived_compliance_3 int not null,
  perceived_compliance_4 int not null,
  perceived_conversion_1 int not null,
  perceived_conversion_2 int not null,
  perceived_conversion_3 int not null,
  perceived_conversion_4 int not null,
  concentration_test int not null,
  -- condition-specific agent metrics (nullable to avoid schema conflicts)
  agent_competence int,
  agent_predictability int,
  agent_integrity int,
  agent_understanding int,
  agent_utility int,
  agent_affect int,
  agent_trust int,
  agent1_competence int,
  agent1_predictability int,
  agent1_integrity int,
  agent1_understanding int,
  agent1_utility int,
  agent1_affect int,
  agent1_trust int,
  agent3_competence int,
  agent3_predictability int,
  agent3_integrity int,
  agent3_understanding int,
  agent3_utility int,
  agent3_affect int,
  agent3_trust int,
  created_at timestamptz not null default now()
);

create table if not exists post_open_surveys (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  participant_no bigint,
  condition_id bigint references experiment_conditions(id),
  condition_type social_influence,
  task_order text,
  task_type session_key,
  survey_number int not null check (survey_number in (1,2)),
  thoughts_on_experiment text,
  agent_comparison text,
  suggestions text,
  created_at timestamptz not null default now()
);

-- 4) strengthen function to also set participant_no on assignment
drop function if exists assign_next_condition(uuid);
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
     set participant_no = v_id,
         condition_type = ec.condition_type,
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


