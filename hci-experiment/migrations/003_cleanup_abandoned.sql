-- Improve cleanup function to actually recycle abandoned assignments
-- Heuristic: release assignments older than N minutes with no responses and unfinished participants

drop function if exists cleanup_abandoned_assignments();

create or replace function cleanup_abandoned_assignments(p_inactive_minutes int default 30)
returns int language plpgsql as $$
declare
  v_released int := 0;
begin
  with last_activity as (
    select p.id as participant_id,
           greatest(
             coalesce(max(r.created_at), timestamp 'epoch'),
             coalesce(max(m.created_at), timestamp 'epoch'),
             coalesce(p.created_at, timestamp 'epoch')
           ) as last_ts
    from participants p
    left join responses r on r.participant_id = p.id
    left join messages m on m.participant_id = p.id
    group by p.id
  ), inactive as (
    select ec.id
    from experiment_conditions ec
    join participants p on p.id = ec.assigned_participant_id
    join last_activity la on la.participant_id = p.id
    left join responses r on r.participant_id = p.id
    where ec.is_assigned = true
      and p.finished_at is null
      and la.last_ts < (now() - make_interval(mins => p_inactive_minutes))
    group by ec.id, p.id, la.last_ts
    having count(r.id) = 0  -- 응답이 하나도 없는 경우만 해제(보수적)
  )
  update experiment_conditions ec
     set is_assigned = false,
         assigned_participant_id = null,
         assigned_at = null
  where ec.id in (select id from inactive);

  get diagnostics v_released = row_count;
  return v_released;
end $$;


