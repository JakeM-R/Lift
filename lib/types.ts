export interface Exercise {
  id: string
  name: string
  body_part: string | null
  primary_muscle: string | null
  secondary_muscles: string[]
  category: string | null
  is_custom: boolean
  created_by: string | null
}

export interface Template {
  id: string
  user_id: string
  name: string
  created_at: string
  last_used_at: string | null
  template_exercises?: TemplateExercise[]
}

export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  position: number
  default_sets: number
  rest_seconds: number | null
  exercise?: Exercise
}

export interface Workout {
  id: string
  user_id: string
  template_id: string | null
  name: string
  started_at: string
  finished_at: string | null
  total_volume_kg: number | null
  pr_count: number
  workout_sets?: WorkoutSet[]
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  set_type: 'normal' | 'warmup' | 'dropset' | 'failure'
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  completed: boolean
  one_rm: number | null
  is_pr: boolean
  exercise?: Exercise
}

export interface BodyMeasurement {
  id: string
  user_id: string
  logged_at: string
  weight_kg: number
  notes: string | null
}

export interface UserPreferences {
  user_id: string
  display_name: string | null
  theme: string
  weight_unit: 'kg' | 'lbs'
  rest_timer_enabled: boolean
  rest_timer_default_seconds: number
  rpe_enabled: boolean
  previous_value_mode: 'exercise' | 'routine'
  dashboard_widgets: string[]
}

export type Theme = 'strong' | 'ryokan' | 'forge' | 'obsidian' | 'volt'

export const THEMES: { key: Theme; name: string; accent: string; bg: string }[] = [
  { key: 'strong',   name: 'Strong',   accent: '#0A84FF', bg: '#000000' },
  { key: 'ryokan',   name: 'Ryokan',   accent: '#9B2335', bg: '#F7F3EE' },
  { key: 'forge',    name: 'Forge',    accent: '#D4820A', bg: '#141008' },
  { key: 'obsidian', name: 'Obsidian', accent: '#A8B4BC', bg: '#0A0A0C' },
  { key: 'volt',     name: 'Volt',     accent: '#7C3AFF', bg: '#08060F' },
]

// Example templates (static — seeded exercises, no DB row for these)
export const EXAMPLE_TEMPLATES = [
  {
    id: 'example-push',
    name: 'Push',
    exercises: [
      { name: 'Bench Press (Barbell)', sets: 4 },
      { name: 'Seated Overhead Press (Dumbbell)', sets: 3 },
      { name: 'Lateral Raise (Dumbbell)', sets: 3 },
      { name: 'Triceps Extension (Cable)', sets: 3 },
    ],
  },
  {
    id: 'example-pull',
    name: 'Pull',
    exercises: [
      { name: 'Deadlift (Barbell)', sets: 3 },
      { name: 'Lat Pulldown (Cable)', sets: 3 },
      { name: 'Seated Row (Cable)', sets: 3 },
      { name: 'Incline Curl (Dumbbell)', sets: 3 },
    ],
  },
  {
    id: 'example-legs',
    name: 'Legs',
    exercises: [
      { name: 'Squat (Barbell)', sets: 4 },
      { name: 'Romanian Deadlift (Barbell)', sets: 3 },
      { name: 'Leg Press (Machine)', sets: 3 },
      { name: 'Leg Extension (Machine)', sets: 3 },
      { name: 'Seated Leg Curl (Machine)', sets: 3 },
    ],
  },
  {
    id: 'example-full-body',
    name: 'Full Body',
    exercises: [
      { name: 'Squat (Barbell)', sets: 3 },
      { name: 'Bench Press (Barbell)', sets: 3 },
      { name: 'Bent Over Row (Barbell)', sets: 3 },
      { name: 'Overhead Press (Barbell)', sets: 3 },
    ],
  },
  {
    id: 'example-strong-5x5',
    name: 'Strong 5×5',
    exercises: [
      { name: 'Squat (Barbell)', sets: 5 },
      { name: 'Bench Press (Barbell)', sets: 5 },
      { name: 'Bent Over Row (Barbell)', sets: 5 },
    ],
  },
]
