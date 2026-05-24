'use client'

import { useState, useEffect } from 'react'
import { Settings, Plus, X, BarChart2, Weight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserPreferences, BodyMeasurement, Exercise } from '@/lib/types'
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart'
import { MuscleVolumeChart } from '@/components/charts/MuscleVolumeChart'
import { BodyweightChart } from '@/components/charts/BodyweightChart'
import { ExerciseProgressChart } from '@/components/charts/ExerciseProgressChart'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const WIDGET_META: Record<string, { name: string; description: string; icon: React.ReactNode }> = {
  workouts_per_week: {
    name: 'Workouts Per Week',
    description: 'Bar chart of the last 8 weeks',
    icon: <BarChart2 className="w-4 h-4" />,
  },
  muscle_volume: {
    name: 'Muscle Group Volume',
    description: 'Volume by muscle group',
    icon: <BarChart2 className="w-4 h-4" />,
  },
  bodyweight: {
    name: 'Bodyweight Trend',
    description: 'Bodyweight over time',
    icon: <Weight className="w-4 h-4" />,
  },
  exercise_progress: {
    name: 'Exercise Progress',
    description: 'Track 1RM progression for a specific exercise',
    icon: <TrendingUp className="w-4 h-4" />,
  },
}

interface SetStat {
  exercise_id: string
  weight_kg: number | null
  reps: number | null
  exercise?: { primary_muscle: string | null; secondary_muscles: string[] | null } | null
}

export function ProfileClient({ userId, email }: { userId: string; email: string }) {
  const supabase = createClient()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [workoutCount, setWorkoutCount] = useState(0)
  const [workouts, setWorkouts] = useState<Array<{ finished_at: string | null }>>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [sets, setSets] = useState<SetStat[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [widgets, setWidgets] = useState<string[]>([])
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [showLogWeight, setShowLogWeight] = useState(false)
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0])
  const [weightValue, setWeightValue] = useState('')
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showDisplayNameSheet, setShowDisplayNameSheet] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')

  useEffect(() => {
    async function load() {
      const [prefsRes, workoutsRes, measurementsRes, setsRes, seeded, custom] = await Promise.all([
        supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
        supabase
          .from('workouts')
          .select('finished_at')
          .eq('user_id', userId)
          .not('finished_at', 'is', null),
        supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', userId)
          .order('logged_at', { ascending: true }),
        supabase
          .from('workout_sets')
          .select('exercise_id, weight_kg, reps, exercise:exercises(primary_muscle, secondary_muscles)')
          .eq('completed', true),
        supabase.from('exercises').select('*').is('created_by', null).order('name'),
        supabase.from('exercises').select('*').eq('created_by', userId).order('name'),
      ])

      let prefs = prefsRes.data as UserPreferences | null
      if (!prefs) {
        // Row missing — create it now so saves work immediately
        await supabase.rpc('init_user_preferences', { p_user_id: userId })
        prefs = null
      }
      setPreferences(prefs)
      setWidgets(prefs?.dashboard_widgets ?? [])
      setWorkoutCount(workoutsRes.data?.length ?? 0)
      setWorkouts((workoutsRes.data ?? []) as Array<{ finished_at: string | null }>)
      setMeasurements((measurementsRes.data ?? []) as BodyMeasurement[])
      setSets((setsRes.data ?? []) as unknown as SetStat[])

      const allExercises = [...(seeded.data ?? []), ...(custom.data ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name))
      setExercises(allExercises as Exercise[])
      setLoading(false)
    }
    load()
  }, [userId])

  const displayName = preferences?.display_name ?? null
  const nameToShow = displayName
    ? displayName
    : email.length > 20
    ? email.slice(0, 20) + '…'
    : email

  const initials = (displayName ?? email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function saveWidgets(newWidgets: string[]) {
    setWidgets(newWidgets)
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, dashboard_widgets: newWidgets })
  }

  async function logWeight() {
    if (!weightValue) return
    const { data } = await supabase
      .from('body_measurements')
      .insert({
        user_id: userId,
        logged_at: weightDate,
        weight_kg: parseFloat(weightValue),
      })
      .select()
      .single()
    if (data) {
      setMeasurements((prev) =>
        [...prev, data as BodyMeasurement].sort((a, b) =>
          a.logged_at.localeCompare(b.logged_at)
        )
      )
    }
    setShowLogWeight(false)
    setWeightValue('')
  }

  async function saveDisplayName() {
    if (!displayNameInput.trim()) return
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, display_name: displayNameInput.trim() })
    setPreferences((prev) =>
      prev
        ? { ...prev, display_name: displayNameInput.trim() }
        : ({ user_id: userId, display_name: displayNameInput.trim() } as UserPreferences)
    )
    setShowDisplayNameSheet(false)
  }

  const setsForChart = sets.map((s) => ({
    exercise_id: s.exercise_id,
    weight_kg: s.weight_kg,
    reps: s.reps,
    primary_muscle: s.exercise?.primary_muscle ?? undefined,
    secondary_muscles: Array.isArray(s.exercise?.secondary_muscles)
      ? (s.exercise.secondary_muscles as string[])
      : [],
  }))

  // Base widgets not yet added (bodyweight requires ≥2 measurements)
  const baseWidgetsAvailable = ['workouts_per_week', 'muscle_volume', 'bodyweight'].filter((k) => {
    if (widgets.includes(k)) return false
    if (k === 'bodyweight' && measurements.length < 2) return false
    return true
  })

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-20 rounded-xl bg-[var(--surface)] animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-[var(--surface)] animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] animate-pulse shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-[var(--surface)] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[var(--surface)] animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-[var(--surface)] animate-pulse" />
          <div className="rounded-xl bg-[var(--surface)] h-40 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-heading">Profile</h1>
        <Link
          href="/profile/settings"
          className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)]"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      {/* Avatar + stats */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-lg leading-snug">{nameToShow}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {workoutCount} workout{workoutCount !== 1 ? 's' : ''} logged
          </p>
          {!displayName && (
            <button
              onClick={() => { setDisplayNameInput(''); setShowDisplayNameSheet(true) }}
              className="text-xs text-[var(--accent)] mt-0.5 min-h-[28px]"
            >
              Add a display name →
            </button>
          )}
        </div>
      </div>

      {/* Dashboard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Dashboard
          </h2>
          <button
            onClick={() => setShowAddWidget(true)}
            className="flex items-center gap-1 text-[var(--accent)] text-sm font-medium min-h-[36px]"
          >
            <Plus className="w-4 h-4" /> Add Widget
          </button>
        </div>

        {widgets.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] py-4 text-center">
            No widgets yet. Tap &quot;Add Widget&quot; to get started.
          </p>
        )}

        <div className="space-y-4">
          {widgets.map((widgetKey) => {
            const isExerciseProgress = widgetKey.startsWith('exercise_progress:')
            const exerciseId = isExerciseProgress ? widgetKey.split(':')[1] : null
            const exerciseName = exerciseId
              ? exercises.find((e) => e.id === exerciseId)?.name
              : null
            const title = isExerciseProgress
              ? (exerciseName ? `${exerciseName} — 1RM Progress` : 'Exercise Progress')
              : (WIDGET_META[widgetKey]?.name ?? widgetKey)

            return (
              <WidgetCard
                key={widgetKey}
                title={title}
                onRemove={() => saveWidgets(widgets.filter((w) => w !== widgetKey))}
              >
                {widgetKey === 'workouts_per_week' && (
                  <WeeklyBarChart workouts={workouts} />
                )}
                {widgetKey === 'muscle_volume' && (
                  <MuscleVolumeChart sets={setsForChart} />
                )}
                {widgetKey === 'bodyweight' && measurements.length >= 2 && (
                  <BodyweightChart measurements={measurements} />
                )}
                {isExerciseProgress && exerciseId && (
                  <ExerciseProgressChart exerciseId={exerciseId} />
                )}
              </WidgetCard>
            )
          })}
        </div>
      </section>

      {/* Log weight FAB */}
      {widgets.includes('bodyweight') && (
        <button
          onClick={() => setShowLogWeight(true)}
          className="fixed right-4 w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center z-20"
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Add Widget Sheet */}
      <Sheet open={showAddWidget} onClose={() => setShowAddWidget(false)} title="Add Widget" showClose>
        <div className="divide-y divide-[var(--border)]">
          {baseWidgetsAvailable.map((k) => (
            <button
              key={k}
              onClick={() => { saveWidgets([...widgets, k]); setShowAddWidget(false) }}
              className="w-full flex items-center gap-3 px-4 py-4 text-left min-h-[64px]"
            >
              <span className="text-[var(--accent)] shrink-0">{WIDGET_META[k].icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] text-sm">{WIDGET_META[k].name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{WIDGET_META[k].description}</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => { setShowAddWidget(false); setShowExercisePicker(true) }}
            className="w-full flex items-center gap-3 px-4 py-4 text-left min-h-[64px]"
          >
            <span className="text-[var(--accent)] shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] text-sm">Exercise Progress</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Track 1RM progression for a specific exercise
              </p>
            </div>
          </button>
          {baseWidgetsAvailable.length === 0 && (
            <p className="px-4 py-2 text-xs text-[var(--text-secondary)]">
              All other widgets already added.
            </p>
          )}
        </div>
      </Sheet>

      {/* Exercise Picker Sheet */}
      <Sheet
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        title="Choose Exercise"
        showClose
      >
        <div className="divide-y divide-[var(--border)]">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                const key = `exercise_progress:${ex.id}`
                if (!widgets.includes(key)) saveWidgets([...widgets, key])
                setShowExercisePicker(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-[52px]"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                {ex.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ex.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{ex.primary_muscle}</p>
              </div>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Log weight sheet */}
      <Sheet open={showLogWeight} onClose={() => setShowLogWeight(false)} title="Log Bodyweight" showClose>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--text-secondary)]">Date</label>
            <Input
              type="date"
              value={weightDate}
              onChange={(e) => setWeightDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--text-secondary)]">
              Weight ({preferences?.weight_unit ?? 'kg'})
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              placeholder={preferences?.weight_unit === 'lbs' ? 'e.g. 185' : 'e.g. 84'}
              step="0.1"
            />
          </div>
          <Button variant="primary" className="w-full" onClick={logWeight} disabled={!weightValue}>
            Save
          </Button>
        </div>
      </Sheet>

      {/* Display Name Sheet */}
      <Sheet
        open={showDisplayNameSheet}
        onClose={() => setShowDisplayNameSheet(false)}
        title="Add Display Name"
        showClose
      >
        <div className="p-4 space-y-4">
          <Input
            value={displayNameInput}
            onChange={(e) => setDisplayNameInput(e.target.value)}
            placeholder="Your name"
            autoFocus
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={saveDisplayName}
            disabled={!displayNameInput.trim()}
          >
            Save
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function WidgetCard({
  title,
  onRemove,
  children,
}: {
  title: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-[var(--text-primary)] text-sm">{title}</p>
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-secondary)] bg-[var(--border)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  )
}
