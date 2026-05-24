import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'
import type { Exercise, UserPreferences, BodyMeasurement } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [prefsRes, workoutsRes, measurementsRes, setsRes, seeded, custom] = await Promise.all([
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('workouts').select('finished_at').eq('user_id', user.id).not('finished_at', 'is', null),
    supabase.from('body_measurements').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }),
    supabase
      .from('workout_sets')
      .select('exercise_id, weight_kg, reps, exercise:exercises(primary_muscle, secondary_muscles)')
      .eq('completed', true),
    supabase.from('exercises').select('*').is('created_by', null).order('name'),
    supabase.from('exercises').select('*').eq('created_by', user.id).order('name'),
  ])

  // Ensure preferences row exists
  let prefs = prefsRes.data as UserPreferences | null
  if (!prefs) {
    const { data: newPrefs } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id })
      .select()
      .single()
    prefs = newPrefs as UserPreferences | null
  }

  const exercises = [...(seeded.data ?? []), ...(custom.data ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name)) as Exercise[]

  return (
    <ProfileClient
      userId={user.id}
      email={user.email ?? ''}
      initialPreferences={prefs}
      initialWorkoutCount={workoutsRes.data?.length ?? 0}
      initialWorkouts={(workoutsRes.data ?? []) as Array<{ finished_at: string | null }>}
      initialMeasurements={(measurementsRes.data ?? []) as BodyMeasurement[]}
      initialSets={(setsRes.data ?? []) as unknown as Array<{
        exercise_id: string
        weight_kg: number | null
        reps: number | null
        exercise?: { primary_muscle: string | null; secondary_muscles: string[] | null } | null
      }>}
      initialExercises={exercises}
    />
  )
}
