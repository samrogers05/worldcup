-- Add R32 to the games stage check constraint
alter table games drop constraint if exists games_stage_check;
alter table games add constraint games_stage_check
  check (stage in ('group', 'R32', 'R16', 'QF', 'SF', 'F'));

-- Add r32_predictions_open setting if it doesn't exist
insert into settings (key, value)
values ('r32_predictions_open', 'false')
on conflict (key) do nothing;
