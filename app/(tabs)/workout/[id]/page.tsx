import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActiveWorkoutClient } from './ActiveWorkoutClient'

export default async function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workout } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workout) redirect('/workout')
  if (workout.finished_at) redirect('/history')

  // Fetch sets for this workout
  const { data: sets } = await supabase
    .from('workout_sets')
    .select('*, exercise:exercises(*)')
    .eq('workout_id', id)
    .order('set_number')

  // Fetch preferences
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch all available exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`created_by.is.null,created_by.eq.${user.id}`)
    .order('name')

  return (
    <ActiveWorkoutClient
      workout={workout}
      initialSets={sets ?? []}
      preferences={prefs ?? undefined}
      exercises={exercises ?? []}
      userId={user.id}
    />
  )
}
