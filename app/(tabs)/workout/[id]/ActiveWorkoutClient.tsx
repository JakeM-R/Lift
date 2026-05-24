'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, MoreHorizontal, Plus, Check, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Workout, WorkoutSet, Exercise, UserPreferences } from '@/lib/types'
import { epley } from '@/lib/utils/one-rm'
import { formatDuration, elapsedSeconds } from '@/lib/utils/format'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { NumberInput } from '@/components/ui/NumberInput'
import { Badge } from '@/components/ui/Badge'
import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { ExercisePickerSheet } from '@/components/workout/ExercisePickerSheet'

interface Props {
  workout: Workout
  initialSets: WorkoutSet[]
  preferences?: UserPreferences
  exercises: Exercise[]
  userId: string
}

type GroupedSets = { exercise: Exercise; sets: WorkoutSet[] }[]

export function ActiveWorkoutClient({ workout, initialSets, preferences, exercises, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [sets, setSets] = useState<WorkoutSet[]>(initialSets)
  const [elapsed, setElapsed] = useState(() => elapsedSeconds(workout.started_at))
  const [showFinishSheet, setShowFinishSheet] = useState(false)
  const [showDiscardSheet, setShowDiscardSheet] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [restTimer, setRestTimer] = useState<{ seconds: number; exerciseId: string } | null>(null)
  const [finishing, setFinishing] = useState(false)

  // Elapsed timer
  useEffect(() => {
    const iv = setInterval(() => setElapsed(elapsedSeconds(workout.started_at)), 1000)
    return () => clearInterval(iv)
  }, [workout.started_at])

  // Group sets by exercise
  const grouped: GroupedSets = []
  const seenIds = new Set<string>()
  for (const set of sets) {
    if (!set.exercise) continue
    if (!seenIds.has(set.exercise_id)) {
      seenIds.add(set.exercise_id)
      grouped.push({ exercise: set.exercise, sets: [] })
    }
    grouped.find((g) => g.exercise.id === set.exercise_id)!.sets.push(set)
  }

  async function addExerciseToWorkout(exercise: Exercise) {
    const existingForExercise = sets.filter((s) => s.exercise_id === exercise.id)
    const defaultSets = 3
    const newSets: Partial<WorkoutSet>[] = []

    for (let i = 0; i < defaultSets; i++) {
      newSets.push({
        workout_id: workout.id,
        exercise_id: exercise.id,
        set_number: existingForExercise.length + i + 1,
        set_type: 'normal',
        completed: false,
        is_pr: false,
      })
    }

    const { data } = await supabase
      .from('workout_sets')
      .insert(newSets)
      .select('*, exercise:exercises(*)')

    if (data) setSets((prev) => [...prev, ...data])
    setShowExercisePicker(false)
  }

  async function addSet(exerciseId: string) {
    const existing = sets.filter((s) => s.exercise_id === exerciseId)
    const lastCompleted = [...existing].reverse().find((s) => s.completed)

    const { data } = await supabase
      .from('workout_sets')
      .insert({
        workout_id: workout.id,
        exercise_id: exerciseId,
        set_number: existing.length + 1,
        set_type: 'normal',
        weight_kg: lastCompleted?.weight_kg ?? null,
        reps: lastCompleted?.reps ?? null,
        completed: false,
        is_pr: false,
      })
      .select('*, exercise:exercises(*)')
      .single()

    if (data) setSets((prev) => [...prev, data])
  }

  async function updateSet(setId: string, updates: Partial<WorkoutSet>) {
    setSets((prev) => prev.map((s) => s.id === setId ? { ...s, ...updates } : s))
    await supabase.from('workout_sets').update(updates).eq('id', setId)
  }

  async function completeSet(set: WorkoutSet) {
    const one_rm = epley(set.weight_kg ?? 0, set.reps ?? 0)

    // Check PR
    let is_pr = false
    if (one_rm > 0) {
      const { data: prData } = await supabase
        .from('workout_sets')
        .select('one_rm, workouts!inner(user_id, finished_at)')
        .eq('exercise_id', set.exercise_id)
        .not('workouts.finished_at', 'is', null)
        .order('one_rm', { ascending: false })
        .limit(1)

      const prevBest = prData?.[0]?.one_rm ?? 0
      is_pr = one_rm > prevBest
    }

    const updates = { completed: true, one_rm, is_pr }
    await updateSet(set.id, updates)

    // Start rest timer if enabled
    const exercise = exercises.find((e) => e.id === set.exercise_id)
    if (preferences?.rest_timer_enabled) {
      const exerciseInTemplate = null // TODO: look up per-exercise rest seconds
      const restSeconds = preferences.rest_timer_default_seconds
      setRestTimer({ seconds: restSeconds, exerciseId: set.exercise_id })
    }
  }

  async function finishWorkout() {
    setFinishing(true)
    await supabase.rpc('finish_workout', { p_workout_id: workout.id })
    router.push('/history')
  }

  async function discardWorkout() {
    await supabase.from('workouts').delete().eq('id', workout.id)
    router.push('/workout')
  }

  const totalVolume = sets
    .filter((s) => s.completed && s.set_type !== 'warmup')
    .reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)

  const prCount = sets.filter((s) => s.is_pr).length

  return (
    <div className="h-dvh flex flex-col bg-[var(--bg)] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center px-4 py-3 border-b border-[var(--border)] shrink-0 gap-3">
        <button
          onClick={() => setShowDiscardSheet(true)}
          className="w-10 h-10 flex items-center justify-center text-[var(--danger)]"
          aria-label="Discard workout"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{workout.name}</p>
          <p className="text-[var(--accent)] tabular-nums text-xs font-medium">
            {formatDuration(elapsed)}
          </p>
        </div>
        <Button variant="success" size="sm" onClick={() => setShowFinishSheet(true)}>
          Finish
        </Button>
      </div>

      {/* Rest timer */}
      {restTimer && (
        <RestTimerBar
          seconds={restTimer.seconds}
          onDone={() => setRestTimer(null)}
          onSkip={() => setRestTimer(null)}
        />
      )}

      {/* Exercise sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4">
          {grouped.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-[var(--text-secondary)]">No exercises yet.</p>
              <p className="text-sm text-[var(--text-secondary)]">Tap below to add your first exercise.</p>
            </div>
          )}

          {grouped.map(({ exercise, sets: exSets }) => (
            <ExerciseSection
              key={exercise.id}
              exercise={exercise}
              sets={exSets}
              preferences={preferences}
              onAddSet={() => addSet(exercise.id)}
              onUpdateSet={updateSet}
              onCompleteSet={completeSet}
              onRemoveExercise={async () => {
                await supabase
                  .from('workout_sets')
                  .delete()
                  .eq('workout_id', workout.id)
                  .eq('exercise_id', exercise.id)
                setSets((prev) => prev.filter((s) => s.exercise_id !== exercise.id))
              }}
            />
          ))}

          {/* Spacer for sticky button */}
          <div className="h-20" />
        </div>
      </div>

      {/* Sticky Add Exercise */}
      <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] pb-safe" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-[var(--border)] text-[var(--accent)] font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </button>
      </div>

      {/* Exercise picker */}
      <ExercisePickerSheet
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        exercises={exercises}
        onSelect={addExerciseToWorkout}
      />

      {/* Finish sheet */}
      <Sheet open={showFinishSheet} onClose={() => setShowFinishSheet(false)} title="Finish Workout?" showClose>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Duration" value={formatDuration(elapsed)} />
            <Stat label="Volume" value={`${Math.round(totalVolume)} kg`} />
            <Stat label="PRs" value={String(prCount)} icon={prCount > 0 ? <Trophy className="w-3 h-3" /> : undefined} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">Exercises</p>
            {grouped.map(({ exercise, sets: exSets }) => (
              <p key={exercise.id} className="text-sm text-[var(--text-primary)]">
                {exercise.name} · {exSets.filter((s) => s.completed).length}/{exSets.length} sets
              </p>
            ))}
          </div>
          <Button variant="success" className="w-full" onClick={finishWorkout} disabled={finishing}>
            {finishing ? 'Saving…' : 'Save Workout'}
          </Button>
        </div>
      </Sheet>

      {/* Discard sheet */}
      <Sheet open={showDiscardSheet} onClose={() => setShowDiscardSheet(false)} title="Discard Workout?" showClose>
        <div className="p-4 space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            This will permanently delete this workout and all logged sets. This can&apos;t be undone.
          </p>
          <Button variant="danger" className="w-full" onClick={discardWorkout}>
            Discard Workout
          </Button>
          <Button variant="surface" className="w-full" onClick={() => setShowDiscardSheet(false)}>
            Keep Workout
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 text-center">
      <p className="text-[var(--text-secondary)] text-xs">{label}</p>
      <p className="text-[var(--text-primary)] font-semibold tabular-nums flex items-center justify-center gap-1 mt-0.5">
        {icon} {value}
      </p>
    </div>
  )
}

// ─── ExerciseSection ──────────────────────────────────────────────────────────

function ExerciseSection({
  exercise,
  sets,
  preferences,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onRemoveExercise,
}: {
  exercise: Exercise
  sets: WorkoutSet[]
  preferences?: UserPreferences
  onAddSet: () => void
  onUpdateSet: (id: string, updates: Partial<WorkoutSet>) => void
  onCompleteSet: (set: WorkoutSet) => void
  onRemoveExercise: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="space-y-2">
      {/* Exercise header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--accent)] font-heading text-base">{exercise.name}</h3>
        <button
          onClick={() => setShowMenu(true)}
          className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)]"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Column headers */}
      <div className="grid gap-2 text-xs text-[var(--text-secondary)] font-medium px-1"
        style={{ gridTemplateColumns: preferences?.rpe_enabled ? '28px 80px 1fr 1fr 56px 40px' : '28px 80px 1fr 1fr 40px' }}>
        <span className="text-center">Set</span>
        <span className="text-center">Previous</span>
        <span className="text-center">kg</span>
        <span className="text-center">Reps</span>
        {preferences?.rpe_enabled && <span className="text-center">RPE</span>}
        <span />
      </div>

      {/* Set rows */}
      {sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          showRpe={preferences?.rpe_enabled ?? false}
          onUpdate={(updates) => onUpdateSet(set.id, updates)}
          onComplete={() => onCompleteSet(set)}
        />
      ))}

      {/* Add set */}
      <button
        onClick={onAddSet}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-secondary)] text-sm"
      >
        <Plus className="w-3.5 h-3.5" /> Add Set
      </button>

      {/* Menu */}
      <Sheet open={showMenu} onClose={() => setShowMenu(false)} title={exercise.name} showClose>
        <div className="p-4 space-y-2">
          <button
            onClick={() => { onRemoveExercise(); setShowMenu(false) }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--danger)] min-h-[56px]"
          >
            <X className="w-4 h-4" /> Remove Exercise
          </button>
        </div>
      </Sheet>
    </div>
  )
}

// ─── SetRow ──────────────────────────────────────────────────────────────────

const SET_TYPES = [
  { value: 'normal',  label: 'Normal' },
  { value: 'warmup',  label: 'Warm-up' },
  { value: 'dropset', label: 'Drop Set' },
  { value: 'failure', label: 'Failure' },
] as const

function SetRow({
  set,
  showRpe,
  onUpdate,
  onComplete,
}: {
  set: WorkoutSet
  showRpe: boolean
  onUpdate: (updates: Partial<WorkoutSet>) => void
  onComplete: () => void
}) {
  const [showTypePicker, setShowTypePicker] = useState(false)
  const isWarmup = set.set_type === 'warmup'

  const pillColors: Record<string, string> = {
    normal:  'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]',
    warmup:  'bg-[var(--border)] text-[var(--text-secondary)]',
    dropset: 'bg-[var(--accent)]/20 text-[var(--accent)]',
    failure: 'bg-[var(--danger)]/20 text-[var(--danger)]',
  }

  const pillLabel: Record<string, string> = {
    normal:  String(set.set_number),
    warmup:  'W',
    dropset: 'D',
    failure: 'F',
  }

  return (
    <div
      className={[
        'grid gap-2 items-center',
        set.completed ? 'opacity-50' : '',
      ].join(' ')}
      style={{ gridTemplateColumns: showRpe ? '28px 80px 1fr 1fr 56px 40px' : '28px 80px 1fr 1fr 40px' }}
    >
      {/* Set # pill */}
      <button
        onClick={() => setShowTypePicker(true)}
        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${pillColors[set.set_type] ?? pillColors.normal}`}
      >
        {pillLabel[set.set_type] ?? set.set_number}
      </button>

      {/* Previous */}
      <div className="text-center text-xs text-[var(--text-secondary)] tabular-nums truncate">
        {set.weight_kg && set.reps ? `${set.weight_kg}×${set.reps}` : '—'}
      </div>

      {/* kg */}
      <NumberInput
        value={set.weight_kg}
        onChange={(v) => onUpdate({ weight_kg: v })}
        placeholder="kg"
        min={0}
        step={2.5}
      />

      {/* Reps */}
      <NumberInput
        value={set.reps}
        onChange={(v) => onUpdate({ reps: v ? Math.round(v) : null })}
        placeholder="reps"
        min={0}
        step={1}
      />

      {/* RPE */}
      {showRpe && (
        <NumberInput
          value={set.rpe}
          onChange={(v) => onUpdate({ rpe: v })}
          placeholder="RPE"
          min={1}
          max={10}
          step={0.5}
        />
      )}

      {/* Complete */}
      <button
        onClick={onComplete}
        disabled={set.completed}
        className={[
          'w-9 h-9 rounded-full flex items-center justify-center',
          set.completed
            ? 'bg-[var(--success)]/20 text-[var(--success)]'
            : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
        ].join(' ')}
      >
        {set.is_pr ? (
          <Trophy className="w-4 h-4 text-[var(--pr-text)]" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>

      {/* Set type picker */}
      <Sheet open={showTypePicker} onClose={() => setShowTypePicker(false)} title="Set Type" showClose>
        <div className="p-4 space-y-2">
          {SET_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { onUpdate({ set_type: t.value }); setShowTypePicker(false) }}
              className={[
                'w-full flex items-center justify-between p-4 rounded-xl border min-h-[56px]',
                set.set_type === t.value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]',
              ].join(' ')}
            >
              <span className="font-medium">{t.label}</span>
              {set.set_type === t.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
