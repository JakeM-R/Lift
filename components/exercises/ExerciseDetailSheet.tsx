'use client'

import { Sheet } from '@/components/ui/Sheet'
import { Badge } from '@/components/ui/Badge'
import type { Exercise } from '@/lib/types'
import { Pencil } from 'lucide-react'
import { VolumeLineChart } from '@/components/charts/VolumeLineChart'

interface Props {
  exercise: Exercise
  sets: Array<{
    exercise_id: string
    weight_kg: number | null
    reps: number | null
    one_rm: number | null
    is_pr: boolean
  }>
  onClose: () => void
  onEdit?: () => void
}

export function ExerciseDetailSheet({ exercise, sets, onClose, onEdit }: Props) {
  const bestSet = sets.reduce<typeof sets[0] | undefined>((best, s) => {
    const vol = (s.weight_kg ?? 0) * (s.reps ?? 0)
    const bestVol = (best?.weight_kg ?? 0) * (best?.reps ?? 0)
    return vol > bestVol ? s : best
  }, undefined)

  const bestOneRm = sets.length > 0 ? Math.max(...sets.map((s) => s.one_rm ?? 0)) : 0

  // Volume per session for chart (last 12 data points)
  const sessionVolume = sets
    .slice(-12)
    .map((s, i) => ({
      session: i + 1,
      volume: (s.weight_kg ?? 0) * (s.reps ?? 0),
    }))

  return (
    <Sheet
      open
      onClose={onClose}
      title={exercise.name}
      showClose
      headerRight={
        onEdit ? (
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)]"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-5">
        {/* Meta */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {exercise.body_part && <Badge>{exercise.body_part}</Badge>}
            {exercise.category && <Badge>{exercise.category}</Badge>}
            {exercise.is_custom && <Badge variant="custom">Custom</Badge>}
          </div>
          <div className="space-y-1">
            {exercise.primary_muscle && (
              <p className="text-sm text-[var(--text-primary)]">
                <span className="text-[var(--text-secondary)]">Primary: </span>
                {exercise.primary_muscle}
              </p>
            )}
            {exercise.secondary_muscles?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-sm text-[var(--text-secondary)]">Secondary:</span>
                {exercise.secondary_muscles.map((m) => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {sets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Best Set"
              value={bestSet ? `${bestSet.weight_kg}×${bestSet.reps}` : '—'}
            />
            <Stat
              label="Best 1RM"
              value={bestOneRm > 0 ? `${bestOneRm.toFixed(1)} kg` : '—'}
            />
            <Stat
              label="Sets Logged"
              value={String(sets.length)}
            />
          </div>
        )}

        {/* Volume chart */}
        {sessionVolume.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">Volume (last sessions)</p>
            <VolumeLineChart data={sessionVolume} />
          </div>
        )}

        {/* No history */}
        {sets.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">
            No history yet for this exercise.
          </p>
        )}
      </div>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 text-center">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums mt-0.5">{value}</p>
    </div>
  )
}
