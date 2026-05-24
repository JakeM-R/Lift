'use client'

import { Sheet } from '@/components/ui/Sheet'
import { Badge } from '@/components/ui/Badge'
import type { Workout, WorkoutSet } from '@/lib/types'
import { formatFullDatetime, formatDuration, elapsedSeconds } from '@/lib/utils/format'
import { Trophy } from 'lucide-react'

interface Props {
  workout: Workout
  onClose: () => void
}

export function WorkoutDetailSheet({ workout, onClose }: Props) {
  const duration = workout.finished_at
    ? elapsedSeconds(workout.started_at, workout.finished_at)
    : 0

  // Group sets by exercise
  const exerciseMap = new Map<string, { name: string; sets: WorkoutSet[] }>()
  for (const set of workout.workout_sets ?? []) {
    if (!set.exercise) continue
    if (!exerciseMap.has(set.exercise_id)) {
      exerciseMap.set(set.exercise_id, { name: set.exercise.name, sets: [] })
    }
    exerciseMap.get(set.exercise_id)!.sets.push(set)
  }

  return (
    <Sheet open onClose={onClose} title={workout.name} showClose>
      <div className="p-4 space-y-5">
        {/* Header stats */}
        <div className="space-y-1">
          <p className="text-sm text-[var(--text-secondary)]">
            {formatFullDatetime(workout.finished_at!)}
          </p>
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] tabular-nums">
            <span>{formatDuration(duration)}</span>
            <span>·</span>
            <span>{Math.round(workout.total_volume_kg ?? 0)} kg</span>
            {(workout.pr_count ?? 0) > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-[var(--pr-text)]">
                  <Trophy className="w-3.5 h-3.5" /> {workout.pr_count} PR{workout.pr_count !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Exercises */}
        {[...exerciseMap.values()].map(({ name, sets }) => (
          <div key={name} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[var(--text-primary)] font-heading">{name}</p>
              {sets.some((s) => s.one_rm) && (
                <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                  Best 1RM: {Math.max(...sets.map((s) => s.one_rm ?? 0)).toFixed(1)} kg
                </p>
              )}
            </div>
            <div className="space-y-1">
              {sets.filter((s) => s.completed).map((set) => (
                <div
                  key={set.id}
                  className={[
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                    set.is_pr
                      ? 'bg-[var(--pr)] text-[var(--pr-text)]'
                      : 'bg-[var(--surface)] text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  <span className="text-[var(--text-secondary)] tabular-nums w-8">
                    {set.set_number}
                  </span>
                  <span className="flex-1 tabular-nums">
                    {set.weight_kg} kg × {set.reps}
                  </span>
                  {set.one_rm && (
                    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                      {set.one_rm.toFixed(1)} kg
                    </span>
                  )}
                  {set.rpe && (
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                      RPE {set.rpe}
                    </span>
                  )}
                  {set.is_pr && (
                    <Trophy className="w-3.5 h-3.5 ml-2 text-[var(--pr-text)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
