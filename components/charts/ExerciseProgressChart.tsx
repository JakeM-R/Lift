'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  exerciseId: string
}

interface DataPoint {
  session: number
  oneRM: number
  date: string
}

export function ExerciseProgressChart({ exerciseId }: Props) {
  const supabase = createClient()
  const [data, setData] = useState<DataPoint[]>([])
  const [bestOneRM, setBestOneRM] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('one_rm, weight_kg, reps, workouts!inner(finished_at)')
        .eq('exercise_id', exerciseId)
        .eq('completed', true)
        .not('workouts.finished_at', 'is', null)
        .limit(200)

      if (!sets) {
        setLoading(false)
        return
      }

      // Group by workout session date, keep best 1RM per session
      const sessionMap = new Map<string, number>()
      for (const s of sets) {
        const workoutDate =
          (s.workouts as unknown as { finished_at: string })?.finished_at
            ?.split('T')[0] ?? ''
        if (!workoutDate) continue

        const oneRM =
          (s.one_rm as number | null) ??
          (s.weight_kg && s.reps
            ? (s.weight_kg as number) * (1 + (s.reps as number) / 30)
            : null)

        if (!oneRM) continue

        const prev = sessionMap.get(workoutDate) ?? 0
        if (oneRM > prev) sessionMap.set(workoutDate, oneRM)
      }

      const sessions = Array.from(sessionMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([date, oneRM], i) => ({
          session: i + 1,
          oneRM: Math.round(oneRM * 10) / 10,
          date,
        }))

      setData(sessions)
      setBestOneRM(sessions.length ? Math.max(...sessions.map((s) => s.oneRM)) : null)
      setLoading(false)
    }
    load()
  }, [exerciseId])

  if (loading) {
    return <div className="h-32 rounded-lg bg-[var(--border)] animate-pulse" />
  }

  if (data.length < 2) {
    return (
      <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
        Log this exercise at least twice to see progress.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {bestOneRM !== null && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {bestOneRM} kg
          </span>
          <span className="text-xs text-[var(--text-secondary)]">est. 1RM best</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="session"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
            formatter={(val: unknown) => [`${val} kg`, 'Est. 1RM'] as [string, string]}
            labelFormatter={(label: unknown) => {
              const point = data.find((d) => d.session === (label as number))
              return point ? point.date : `Session ${label}`
            }}
          />
          <Line
            type="monotone"
            dataKey="oneRM"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
