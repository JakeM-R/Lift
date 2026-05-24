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
