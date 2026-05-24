'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { MUSCLE_TO_BODY_PART } from '@/lib/utils/muscles'

type Window = 'week' | '4weeks' | 'all'

interface SetData {
  exercise_id: string
  weight_kg: number | null
  reps: number | null
  completed_at?: string
  primary_muscle?: string
  secondary_muscles?: string[]
}

interface Props {
  sets: SetData[]
}

export function MuscleVolumeChart({ sets }: Props) {
  const [window, setWindow] = useState<Window>('week')
  const [viewMode, setViewMode] = useState<'muscle' | 'body_part'>('body_part')

  const now = Date.now()
  const cutoff: Record<Window, number> = {
    week:   now - 7 * 86400000,
    '4weeks': now - 28 * 86400000,
    all:    0,
  }

  const filtered = sets.filter((s) => {
    if (!s.completed_at) return window === 'all'
    return new Date(s.completed_at).getTime() >= cutoff[window]
  })

  const volumeMap: Record<string, number> = {}
  for (const s of filtered) {
    const vol = (s.weight_kg ?? 0) * (s.reps ?? 0)
    const primary = s.primary_muscle
    if (!primary) continue

    const key = viewMode === 'body_part' ? (MUSCLE_TO_BODY_PART[primary] ?? primary) : primary
    volumeMap[key] = (volumeMap[key] ?? 0) + vol

    for (const sec of s.secondary_muscles ?? []) {
      const secKey = viewMode === 'body_part' ? (MUSCLE_TO_BODY_PART[sec] ?? sec) : sec
      volumeMap[secKey] = (volumeMap[secKey] ?? 0) + vol * 0.5
    }
  }

  const data = Object.entries(volumeMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, volume]) => ({ name: name.split(' ')[0], volume: Math.round(volume) }))
    .slice(0, 8)

  return (
    <div className="space-y-3">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['week', '4weeks', 'all'] as Window[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={[
                'px-2.5 py-1 rounded-full text-xs font-medium',
                window === w
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {w === 'week' ? 'This Week' : w === '4weeks' ? '4 Weeks' : 'All Time'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setViewMode((m) => m === 'body_part' ? 'muscle' : 'body_part')}
          className="text-xs text-[var(--accent)]"
        >
          {viewMode === 'body_part' ? 'By Muscle' : 'By Body Part'}
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">
          No data for this period.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} width={56} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
              cursor={{ fill: 'var(--border)' }}
            />
            <Bar dataKey="volume" fill="var(--accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
