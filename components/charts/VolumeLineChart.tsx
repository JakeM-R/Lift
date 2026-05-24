'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: Array<{ session: number; volume: number }>
}

export function VolumeLineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
          dataKey="volume"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--accent)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
