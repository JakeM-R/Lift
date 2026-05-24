-- ─── Enable RLS on all tables ───────────────────────────────────────────────
alter table exercises enable row level security;
alter table templates enable row level security;
alter table template_exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table body_measurements enable row level security;
alter table user_preferences enable row level security;

-- ─── exercises ──────────────────────────────────────────────────────────────
-- Seeded (created_by IS NULL): all authenticated users can read
create policy "exercises_read_seeded"
  on exercises for select
  to authenticated
  using (created_by is null);

-- Custom exercises: only the creator can read/insert/update/delete
create policy "exercises_read_own_custom"
  on exercises for select
  to authenticated
  using (created_by = auth.uid());

create policy "exercises_insert_own"
  on exercises for insert
  to authenticated
  with check (created_by = auth.uid() and is_custom = true);

create policy "exercises_update_own"
  on exercises for update
  to authenticated
  using (created_by = auth.uid());

create policy "exercises_delete_own"
  on exercises for delete
  to authenticated
  using (created_by = auth.uid());

-- ─── templates ──────────────────────────────────────────────────────────────
create policy "templates_select"
  on templates for select
  to authenticated
  using (user_id = auth.uid());

create policy "templates_insert"
  on templates for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "templates_update"
  on templates for update
  to authenticated
  using (user_id = auth.uid());

create policy "templates_delete"
  on templates for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── template_exercises ─────────────────────────────────────────────────────
create policy "template_exercises_select"
  on template_exercises for select
  to authenticated
  using (
    exists (
      select 1 from templates
      where templates.id = template_exercises.template_id
        and templates.user_id = auth.uid()
    )
  );

create policy "template_exercises_insert"
  on template_exercises for insert
  to authenticated
  with check (
    exists (
      select 1 from templates
      where templates.id = template_exercises.template_id
        and templates.user_id = auth.uid()
    )
  );

create policy "template_exercises_update"
  on template_exercises for update
  to authenticated
  using (
    exists (
      select 1 from templates
      where templates.id = template_exercises.template_id
        and templates.user_id = auth.uid()
    )
  );

create policy "template_exercises_delete"
  on template_exercises for delete
  to authenticated
  using (
    exists (
      select 1 from templates
      where templates.id = template_exercises.template_id
        and templates.user_id = auth.uid()
    )
  );

-- ─── workouts ───────────────────────────────────────────────────────────────
create policy "workouts_select"
  on workouts for select
  to authenticated
  using (user_id = auth.uid());

create policy "workouts_insert"
  on workouts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "workouts_update"
  on workouts for update
  to authenticated
  using (user_id = auth.uid());

create policy "workouts_delete"
  on workouts for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── workout_sets ───────────────────────────────────────────────────────────
create policy "workout_sets_select"
  on workout_sets for select
  to authenticated
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_sets.workout_id
        and workouts.user_id = auth.uid()
    )
  );

create policy "workout_sets_insert"
  on workout_sets for insert
  to authenticated
  with check (
    exists (
      select 1 from workouts
      where workouts.id = workout_sets.workout_id
        and workouts.user_id = auth.uid()
    )
  );

create policy "workout_sets_update"
  on workout_sets for update
  to authenticated
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_sets.workout_id
        and workouts.user_id = auth.uid()
    )
  );

create policy "workout_sets_delete"
  on workout_sets for delete
  to authenticated
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_sets.workout_id
        and workouts.user_id = auth.uid()
    )
  );

-- ─── body_measurements ──────────────────────────────────────────────────────
create policy "body_measurements_select"
  on body_measurements for select
  to authenticated
  using (user_id = auth.uid());

create policy "body_measurements_insert"
  on body_measurements for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "body_measurements_update"
  on body_measurements for update
  to authenticated
  using (user_id = auth.uid());

create policy "body_measurements_delete"
  on body_measurements for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── user_preferences ───────────────────────────────────────────────────────
create policy "user_preferences_select"
  on user_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_preferences_insert"
  on user_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_preferences_update"
  on user_preferences for update
  to authenticated
  using (user_id = auth.uid());

create policy "user_preferences_delete"
  on user_preferences for delete
  to authenticated
  using (user_id = auth.uid());
