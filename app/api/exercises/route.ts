import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ exercises: [], sets: [] })

  const [seeded, custom, setsRes] = await Promise.all([
    supabase.from('exercises').select('*').is('created_by', null).order('name'),
    supabase.from('exercises').select('*').eq('created_by', user.id).order('name'),
    supabase
      .from('workout_sets')
      .select('exercise_id, weight_kg, reps, one_rm, is_pr, workouts!inner(finished_at)')
      .not('workouts.finished_at', 'is', null)
      .eq('completed', true),
  ])

  const exercises = [...(seeded.data ?? []), ...(custom.data ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ exercises, sets: setsRes.data ?? [] })
}
