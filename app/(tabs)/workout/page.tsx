import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StartWorkoutClient } from './StartWorkoutClient'

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <StartWorkoutClient userId={user.id} />
}
