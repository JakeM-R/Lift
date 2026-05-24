-- ─── finish_workout ──────────────────────────────────────────────────────────
-- Atomically finishes a workout: sets finished_at, computes total_volume_kg and pr_count.
-- Callable by authenticated users who own the workout.
create or replace function finish_workout(p_workout_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_volume  numeric;
  v_pr_count int;
begin
  -- Ownership check
  select user_id into v_user_id
  from workouts
  where id = p_workout_id;

  if v_user_id is distinct from auth.uid() then
    raise exception 'Not authorised';
  end if;

  -- Compute total volume (excludes warmup sets)
  select coalesce(sum(weight_kg * reps), 0)
  into v_volume
  from workout_sets
  where workout_id = p_workout_id
    and completed = true
    and set_type <> 'warmup';

  -- Count PR sets
  select count(*)
  into v_pr_count
  from workout_sets
  where workout_id = p_workout_id
    and is_pr = true;

  -- Mark workout finished
  update workouts
  set
    finished_at      = now(),
    total_volume_kg  = v_volume,
    pr_count         = v_pr_count
  where id = p_workout_id;
end;
$$;

-- ─── init_user_preferences ───────────────────────────────────────────────────
-- Called from the auth callback to create default preferences for a new user.
create or replace function init_user_preferences(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;
