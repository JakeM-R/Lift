'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { isoWeek } from '@/lib/utils/format'

interface Props {
  workouts: Array<{ finished_at: string | null }>
}

export function WeeklyBarChart({ workouts }: Props) {
  // Build last 8 ISO weeks
  const weeks: Record<string, number> = {}
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    weeks[isoWeek(d)] = 0
  }

  for (const w of workouts) {
    if (!w.finished_at) continue
    const key = isoWeek(new Date(w.finished_at))
    if (key in weeks) weeks[key] = (weeks[key] ?? 0) + 1
  }

  const data = Object.entries(weeks).map(([week, count]) => ({
    week: week.split('-W')[1], // just the week number
    count,
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '12px',
          }}
          cursor={{ fill: 'var(--border)' }}
        />
        <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
