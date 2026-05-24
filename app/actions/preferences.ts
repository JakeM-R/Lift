'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveWidgetsAction(widgets: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, dashboard_widgets: widgets })

  return error ? { error: error.message } : { success: true }
}

export async function saveDisplayNameAction(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, display_name: name.trim() })

  return error ? { error: error.message } : { success: true }
}

export async function logWeightAction(date: string, weightKg: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('body_measurements')
    .insert({ user_id: user.id, logged_at: date, weight_kg: weightKg })
    .select()
    .single()

  return error ? { error: error.message } : { success: true, data }
}
