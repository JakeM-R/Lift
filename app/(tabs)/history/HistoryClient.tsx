'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trophy, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Workout } from '@/lib/types'
import { formatWorkoutDate, formatMonthHeader, formatDuration, elapsedSeconds } from '@/lib/utils/format'
import { Sheet } from '@/components/ui/Sheet'
import { WorkoutDetailSheet } from '@/components/workout/WorkoutDetailSheet'

interface Props {
  workouts: Workout[]
}

export function HistoryClient({ workouts: initialWorkouts }: Props) {
  const [workouts, setWorkouts] = useState(initialWorkouts)
  const [detail, setDetail] = useState<Workout | null>(null)
  const [menu, setMenu] = useState<Workout | null>(null)
  const [editingName, setEditingName] = useState<{ id: string; name: string } | null>(null)
  const supabase = createClient()

  // Group by month
  const grouped = workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    const key = formatMonthHeader(w.finished_at!)
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  async function deleteWorkout(w: Workout) {
    await supabase.from('workouts').delete().eq('id', w.id)
    setWorkouts((prev) => prev.filter((x) => x.id !== w.id))
    setMenu(null)
  }

  async function renameWorkout() {
    if (!editingName) return
    await supabase
      .from('workouts')
      .update({ name: editingName.name })
      .eq('id', editingName.id)
    setWorkouts((prev) =>
      prev.map((w) => w.id === editingName.id ? { ...w, name: editingName.name } : w)
    )
    setEditingName(null)
    setMenu(null)
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-24">
        <Dumbbell className="w-12 h-12 text-[var(--text-secondary)]" strokeWidth={1.5} />
        <p className="text-[var(--text-primary)] font-semibold text-lg">No workouts yet</p>
        <p className="text-[var(--text-secondary)] text-sm text-center">
          Finish your first workout to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] font-heading">History</h1>

      {Object.entries(grouped).map(([month, monthWorkouts]) => (
        <section key={month} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            {month}
          </h2>
          <div className="space-y-3">
            {monthWorkouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onTap={() => setDetail(w)}
                onMenu={() => setMenu(w)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Detail sheet */}
      {detail && (
        <WorkoutDetailSheet
          workout={detail}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Context menu */}
      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name} showClose>
        <div className="p-4 space-y-2">
          <button
            onClick={() => { setEditingName({ id: menu!.id, name: menu!.name }); }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] min-h-[56px]"
          >
            Edit Name
          </button>
          <button
            onClick={() => menu && deleteWorkout(menu)}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--danger)] min-h-[56px]"
          >
            Delete
          </button>
        </div>
      </Sheet>

      {/* Rename sheet */}
      <Sheet open={!!editingName} onClose={() => setEditingName(null)} title="Rename Workout" showClose>
        <div className="p-4 space-y-4">
          <input
            value={editingName?.name ?? ''}
            onChange={(e) => setEditingName((prev) => prev ? { ...prev, name: e.target.value } : null)}
            className="w-full h-11 rounded-xl px-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-base"
          />
          <button
            onClick={renameWorkout}
            className="w-full h-11 rounded-xl bg-[var(--accent)] text-white font-semibold"
          >
            Save
          </button>
        </div>
      </Sheet>
    </div>
  )
}

function WorkoutCard({
  workout,
  onTap,
  onMenu,
}: {
  workout: Workout
  onTap: () => void
  onMenu: () => void
}) {
  const duration = workout.finished_at
    ? elapsedSeconds(workout.started_at, workout.finished_at)
    : 0

  // Top 5 exercises
  const exerciseMap = new Map<string, { name: string; bestSet: string }>()
  for (const set of workout.workout_sets ?? []) {
    if (!set.exercise || !set.completed) continue
    const key = set.exercise_id
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { name: set.exercise.name, bestSet: '' })
    }
    const prev = exerciseMap.get(key)!
    if (set.weight_kg && set.reps) {
      const label = `${set.weight_kg} kg × ${set.reps}`
      if (!prev.bestSet) prev.bestSet = label
    }
  }
  const topExercises = [...exerciseMap.values()].slice(0, 5)

  return (
    <div
      className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-2 cursor-pointer active:opacity-70"
      onClick={onTap}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] text-sm">{workout.name}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {formatWorkoutDate(workout.finished_at!)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onMenu() }}
          className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] -mt-0.5 -mr-0.5 shrink-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] tabular-nums">
        <span>{formatDuration(duration)}</span>
        <span>·</span>
        <span>{Math.round(workout.total_volume_kg ?? 0)} kg</span>
        {(workout.pr_count ?? 0) > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1 text-[var(--pr-text)]">
              <Trophy className="w-3 h-3" /> {workout.pr_count}
            </span>
          </>
        )}
      </div>

      {/* Exercise summary */}
      {topExercises.length > 0 && (
        <div className="space-y-1 border-t border-[var(--border)] pt-2">
          {topExercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-primary)] font-medium truncate max-w-[60%]">{ex.name}</span>
              <span className="text-[var(--text-secondary)] tabular-nums">{ex.bestSet || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
