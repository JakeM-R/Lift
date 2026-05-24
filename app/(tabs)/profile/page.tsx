import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { count: workoutCount } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)

  const { data: workouts } = await supabase
    .from('workouts')
    .select('finished_at')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)

  const { data: measurements } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: true })

  // For muscle volume chart: fetch sets with exercise data
  const { data: sets } = await supabase
    .from('workout_sets')
    .select(`
      exercise_id,
      weight_kg,
      reps,
      completed,
      workouts!inner(user_id, finished_at),
      exercise:exercises(primary_muscle, secondary_muscles)
    `)
    .eq('workouts.user_id', user.id)
    .not('workouts.finished_at', 'is', null)
    .eq('completed', true)

  // Supabase join returns exercise as array; normalise to single object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalisedSets = (sets ?? []).map((s: any) => ({
    exercise_id: s.exercise_id,
    weight_kg: s.weight_kg,
    reps: s.reps,
    exercise: Array.isArray(s.exercise) ? s.exercise[0] ?? null : s.exercise,
  }))

  return (
    <ProfileClient
      userId={user.id}
      email={user.email ?? ''}
      preferences={prefs ?? undefined}
      workoutCount={workoutCount ?? 0}
      workouts={workouts ?? []}
      measurements={measurements ?? []}
      sets={normalisedSets}
    />
  )
}
