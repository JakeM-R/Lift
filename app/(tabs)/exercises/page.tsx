import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExercisesClient } from './ExercisesClient'

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <ExercisesClient userId={user.id} />
}
