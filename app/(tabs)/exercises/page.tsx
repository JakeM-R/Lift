import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExercisesClient } from './ExercisesClient'
import type { Exercise } from '@/lib/types'

interface SetStat {
  exercise_id: string
  weight_kg: number | null
  reps: number | null
  one_rm: number | null
  is_pr: boolean
}

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    .sort((a, b) => a.name.localeCompare(b.name)) as Exercise[]

  return (
    <ExercisesClient
      userId={user.id}
      initialExercises={exercises}
      initialSets={(setsRes.data ?? []) as unknown as SetStat[]}
    />
  )
}
