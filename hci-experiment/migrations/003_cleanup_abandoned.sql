-- Improve cleanup function to actually recycle abandoned assignments
-- Heuristic: release assignments older than N minutes with no responses and unfinished participants

drop function if exists cleanup_abandoned_assignments();

create or replace function cleanup_abandoned_assignments(p_inactive_minutes int default 30)
returns int language plpgsql as $$
declare
  v_released int := 0;
begin
  with inactive as (
    select ec.id
    from experiment_conditions ec
    join participants p on p.id = ec.assigned_participant_id
    left join responses r on r.participant_id = p.id
    where ec.is_assigned = true
      and ec.assigned_at < (now() - make_interval(mins => p_inactive_minutes))
      and p.finished_at is null
    group by ec.id, p.id
    having count(r.id) = 0
  )
  update experiment_conditions ec
     set is_assigned = false,
         assigned_participant_id = null,
         assigned_at = null
  where ec.id in (select id from inactive);

  get diagnostics v_released = row_count;
  return v_released;
end $$;


