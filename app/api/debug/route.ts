import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ auth: 'no user', authError: authError?.message })
  }

  // Try exercises query
  const { data: seeded, error: seededError } = await supabase
    .from('exercises')
    .select('id, name')
    .is('created_by', null)
    .limit(5)

  const { data: custom, error: customError } = await supabase
    .from('exercises')
    .select('id, name')
    .eq('created_by', user.id)
    .limit(5)

  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Count total seeded
  const { count, error: countError } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .is('created_by', null)

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    seededSample: seeded,
    seededError: seededError?.message,
    seededCount: count,
    seededCountError: countError?.message,
    customSample: custom,
    customError: customError?.message,
    preferences: prefs,
    prefsError: prefsError?.message,
  })
}
