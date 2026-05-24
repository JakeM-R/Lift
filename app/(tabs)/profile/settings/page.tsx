import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <SettingsClient
      userId={user.id}
      email={user.email ?? ''}
      preferences={prefs ?? undefined}
    />
  )
}
