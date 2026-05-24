-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── exercises ──────────────────────────────────────────────────────────────
create table exercises (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  body_part        text,
  primary_muscle   text,
  secondary_muscles text[] default '{}',
  category         text,
  is_custom        boolean default false,
  created_by       uuid references auth.users on delete cascade
);

-- ─── templates ──────────────────────────────────────────────────────────────
create table templates (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  created_at   timestamptz default now(),
  last_used_at timestamptz
);

-- ─── template_exercises ─────────────────────────────────────────────────────
create table template_exercises (
  id           uuid primary key default uuid_generate_v4(),
  template_id  uuid references templates on delete cascade not null,
  exercise_id  uuid references exercises on delete cascade not null,
  position     int not null,
  default_sets int default 3,
  rest_seconds int
);

-- ─── workouts ───────────────────────────────────────────────────────────────
create table workouts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users on delete cascade not null,
  template_id      uuid references templates on delete set null,
  name             text not null,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  total_volume_kg  numeric,
  pr_count         int default 0
);

-- ─── workout_sets ───────────────────────────────────────────────────────────
create table workout_sets (
  id          uuid primary key default uuid_generate_v4(),
  workout_id  uuid references workouts on delete cascade not null,
  exercise_id uuid references exercises on delete cascade not null,
  set_number  int not null,
  set_type    text default 'normal',
  weight_kg   numeric,
  reps        int,
  rpe         numeric,
  completed   boolean default false,
  one_rm      numeric,
  is_pr       boolean default false
);

-- ─── body_measurements ──────────────────────────────────────────────────────
create table body_measurements (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid references auth.users on delete cascade not null,
  logged_at date not null,
  weight_kg numeric not null,
  notes     text
);

-- ─── user_preferences ───────────────────────────────────────────────────────
create table user_preferences (
  user_id                    uuid primary key references auth.users on delete cascade,
  display_name               text,
  theme                      text default 'strong',
  weight_unit                text default 'kg',
  rest_timer_enabled         boolean default false,
  rest_timer_default_seconds int default 90,
  rpe_enabled                boolean default false,
  previous_value_mode        text default 'exercise',
  dashboard_widgets          text[] default '{}'
);
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
-- ─── Seeded Exercise Library ─────────────────────────────────────────────────
-- created_by is NULL for all seeded exercises (readable by all authenticated users)

insert into exercises (name, body_part, primary_muscle, secondary_muscles, category, is_custom) values
-- Chest
('Bench Press (Barbell)',          'Chest',     'Pectoralis Major',  array['Triceps','Front Deltoid'],              'Barbell',    false),
('Bench Press (Dumbbell)',         'Chest',     'Pectoralis Major',  array['Triceps','Front Deltoid'],              'Dumbbell',   false),
('Incline Bench Press (Barbell)',  'Chest',     'Pectoralis Major',  array['Front Deltoid','Triceps'],              'Barbell',    false),
('Chest Fly (Cable)',              'Chest',     'Pectoralis Major',  array['Front Deltoid'],                        'Cable',      false),
('Push-Up',                        'Chest',     'Pectoralis Major',  array['Triceps','Front Deltoid'],              'Bodyweight', false),
-- Back
('Deadlift (Barbell)',             'Back',      'Erector Spinae',    array['Hamstrings','Glutes','Latissimus Dorsi','Trapezius'], 'Barbell', false),
('Lat Pulldown (Cable)',           'Back',      'Latissimus Dorsi',  array['Biceps','Rear Deltoid'],                'Cable',      false),
('Bent Over Row (Barbell)',        'Back',      'Latissimus Dorsi',  array['Rhomboids','Biceps','Rear Deltoid'],    'Barbell',    false),
('Seated Row (Cable)',             'Back',      'Rhomboids',         array['Latissimus Dorsi','Biceps'],            'Cable',      false),
('Pull-Up',                        'Back',      'Latissimus Dorsi',  array['Biceps','Rear Deltoid'],                'Bodyweight', false),
-- Shoulders
('Overhead Press (Barbell)',       'Shoulders', 'Front Deltoid',     array['Side Deltoid','Triceps'],               'Barbell',    false),
('Seated Overhead Press (Dumbbell)', 'Shoulders','Front Deltoid',    array['Side Deltoid','Triceps'],               'Dumbbell',   false),
('Lateral Raise (Dumbbell)',       'Shoulders', 'Side Deltoid',      array[]::text[],                              'Dumbbell',   false),
('Arnold Press (Dumbbell)',        'Shoulders', 'Front Deltoid',     array['Side Deltoid','Triceps'],               'Dumbbell',   false),
('Face Pull (Cable)',              'Shoulders', 'Rear Deltoid',      array['Trapezius'],                            'Cable',      false),
-- Arms
('Bicep Curl (Dumbbell)',          'Arms',      'Biceps',            array['Forearms'],                             'Dumbbell',   false),
('Hammer Curl (Dumbbell)',         'Arms',      'Biceps',            array['Forearms'],                             'Dumbbell',   false),
('Incline Curl (Dumbbell)',        'Arms',      'Biceps',            array[]::text[],                              'Dumbbell',   false),
('Triceps Extension (Cable)',      'Arms',      'Triceps',           array[]::text[],                              'Cable',      false),
('Triceps Pushdown (Cable)',       'Arms',      'Triceps',           array[]::text[],                              'Cable',      false),
-- Legs
('Squat (Barbell)',                'Legs',      'Quadriceps',        array['Glutes','Hamstrings','Erector Spinae'], 'Barbell',    false),
('Romanian Deadlift (Barbell)',    'Legs',      'Hamstrings',        array['Glutes','Erector Spinae'],              'Barbell',    false),
('Leg Press (Machine)',            'Legs',      'Quadriceps',        array['Glutes','Hamstrings'],                  'Machine',    false),
('Leg Extension (Machine)',        'Legs',      'Quadriceps',        array[]::text[],                              'Machine',    false),
('Seated Leg Curl (Machine)',      'Legs',      'Hamstrings',        array[]::text[],                              'Machine',    false),
('Hip Thrust (Barbell)',           'Legs',      'Glutes',            array['Hamstrings'],                           'Barbell',    false),
-- Core
('Plank',                          'Core',      'Transverse Abdominis', array['Rectus Abdominis'],                 'Bodyweight', false),
('Ab Wheel',                       'Core',      'Rectus Abdominis',  array['Transverse Abdominis','Obliques'],      'Bodyweight', false),
('Cable Crunch',                   'Core',      'Rectus Abdominis',  array['Obliques'],                             'Cable',      false),
-- Cardio
('Treadmill',                      'Cardio',    'Quadriceps',        array['Hamstrings','Calves'],                  'Cardio',     false),
('Rowing Machine',                 'Cardio',    'Latissimus Dorsi',  array['Rhomboids','Biceps','Quadriceps'],      'Cardio',     false),
('Cycling',                        'Cardio',    'Quadriceps',        array['Hamstrings','Calves'],                  'Cardio',     false);

-- ─── Seeded Example Templates ────────────────────────────────────────────────
-- These are "example" templates not tied to any user (user_id points to a sentinel).
-- In practice, we store these as regular template rows owned by a special seed user,
-- OR we expose them as static data in the app and let users duplicate them.
-- For v1 simplicity, we mark them with a special note in the name
-- and load them in the "Example Templates" section via a static list in code.
-- (No DB rows needed for example templates — they are rendered from a constant.)
