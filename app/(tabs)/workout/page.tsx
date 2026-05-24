import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StartWorkoutClient } from './StartWorkoutClient'

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's templates with their exercises
  const { data: templates } = await supabase
    .from('templates')
    .select(`
      *,
      template_exercises (
        *,
        exercise:exercises (*)
      )
    `)
    .eq('user_id', user.id)
    .order('last_used_at', { ascending: false, nullsFirst: false })

  // Fetch all exercises (for exercise picker)
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .or(`created_by.is.null,created_by.eq.${user.id}`)
    .order('name')

  return (
    <StartWorkoutClient
      userId={user.id}
      templates={templates ?? []}
      exercises={exercises ?? []}
    />
  )
}
