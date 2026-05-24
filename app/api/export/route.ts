import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const [
    { data: workouts },
    { data: sets },
    { data: measurements },
    { data: templates },
  ] = await Promise.all([
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at'),
    supabase
      .from('workout_sets')
      .select('*, workouts!inner(user_id)')
      .eq('workouts.user_id', user.id),
    supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at'),
    supabase
      .from('templates')
      .select('*, template_exercises(*)')
      .eq('user_id', user.id),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    workouts: workouts ?? [],
    workout_sets: sets ?? [],
    body_measurements: measurements ?? [],
    templates: templates ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="lift-export.json"',
    },
  })
}
