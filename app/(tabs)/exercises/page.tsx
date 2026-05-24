import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExercisesClient } from './ExercisesClient'

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`created_by.is.null,created_by.eq.${user.id}`)
    .order('name')

  // Fetch user's workout stats per exercise
  const { data: sets } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight_kg, reps, one_rm, is_pr, workouts!inner(user_id, finished_at)')
    .eq('workouts.user_id', user.id)
    .not('workouts.finished_at', 'is', null)
    .eq('completed', true)

  return (
    <ExercisesClient
      exercises={exercises ?? []}
      sets={sets ?? []}
      userId={user.id}
    />
  )
}
