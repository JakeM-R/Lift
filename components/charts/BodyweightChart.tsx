'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { BodyMeasurement } from '@/lib/types'

interface Props {
  measurements: BodyMeasurement[]
}

export function BodyweightChart({ measurements }: Props) {
  const data = measurements.map((m) => ({
    date: new Date(m.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    weight: m.weight_kg,
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={['auto', 'auto']}
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
          itemStyle={{ color: 'var(--accent)' }}
          cursor={{ stroke: 'var(--border)' }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--accent)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
