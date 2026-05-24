import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const [prefsRes, workoutsRes, measurementsRes, setsRes, seeded, custom] = await Promise.all([
    supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    supabase.from('workouts').select('finished_at').eq('user_id', user.id).not('finished_at', 'is', null),
    supabase.from('body_measurements').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }),
    supabase.from('workout_sets')
      .select('exercise_id, weight_kg, reps, exercise:exercises(primary_muscle, secondary_muscles)')
      .eq('completed', true),
    supabase.from('exercises').select('*').is('created_by', null).order('name'),
    supabase.from('exercises').select('*').eq('created_by', user.id).order('name'),
  ])

  // Ensure preferences row exists
  let prefs = prefsRes.data
  if (!prefs) {
    const { data: newPrefs } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id })
      .select()
      .single()
    prefs = newPrefs
  }

  const exercises = [...(seeded.data ?? []), ...(custom.data ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({
    preferences: prefs,
    workoutCount: workoutsRes.data?.length ?? 0,
    workouts: workoutsRes.data ?? [],
    measurements: measurementsRes.data ?? [],
    sets: setsRes.data ?? [],
    exercises,
  })
}
