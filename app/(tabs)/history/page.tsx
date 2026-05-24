import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from './HistoryClient'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_sets (
        *,
        exercise:exercises (*)
      )
    `)
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  return <HistoryClient workouts={workouts ?? []} />
}
