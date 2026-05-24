import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const exerciseId = request.nextUrl.searchParams.get('exerciseId')
  if (!exerciseId) return NextResponse.json([])

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const { data: sets } = await supabase
    .from('workout_sets')
    .select('one_rm, weight_kg, reps, workouts!inner(finished_at)')
    .eq('exercise_id', exerciseId)
    .eq('completed', true)
    .not('workouts.finished_at', 'is', null)
    .limit(200)

  return NextResponse.json(sets ?? [])
}
