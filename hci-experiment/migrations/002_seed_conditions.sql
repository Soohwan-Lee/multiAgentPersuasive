-- Seed experiment_conditions with counterbalanced rows
-- majority -> minority -> minorityDiffusion cycling
-- task_order alternating informativeFirst / normativeFirst
-- task indices cycling 0..5

with seq as (
  select generate_series(1, 150) as n
), typed as (
  select
    n,
    case (n-1) % 3
      when 0 then 'majority'
      when 1 then 'minority'
      else 'minorityDiffusion'
    end::social_influence as condition_type,
    case (n-1) % 2
      when 0 then 'informativeFirst'
      else 'normativeFirst'
    end as task_order,
    ((n-1) % 6) as informative_task_index,
    (((n-1) / 2) % 6) as normative_task_index
  from seq
)
insert into experiment_conditions (condition_type, task_order, informative_task_index, normative_task_index)
select condition_type, task_order, informative_task_index, normative_task_index
from typed;


