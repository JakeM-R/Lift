'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Plus, X, Trophy, BarChart2, Weight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserPreferences, BodyMeasurement } from '@/lib/types'
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart'
import { MuscleVolumeChart } from '@/components/charts/MuscleVolumeChart'
import { BodyweightChart } from '@/components/charts/BodyweightChart'
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
    icon: <Trophy className="w-4 h-4" />,
  },
  bodyweight: {
    name: 'Bodyweight Trend',
    description: 'Bodyweight over time',
    icon: <Weight className="w-4 h-4" />,
  },
}

interface Props {
  userId: string
  email: string
  preferences?: UserPreferences
  workoutCount: number
  workouts: Array<{ finished_at: string | null }>
  measurements: BodyMeasurement[]
  sets: Array<{
    exercise_id: string
    weight_kg: number | null
    reps: number | null
    exercise?: { primary_muscle: string | null; secondary_muscles: string[] } | null
  }>
}

export function ProfileClient({
  userId,
  email,
  preferences,
  workoutCount,
  workouts,
  measurements,
  sets,
}: Props) {
  const [widgets, setWidgets] = useState<string[]>(preferences?.dashboard_widgets ?? [])
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [showLogWeight, setShowLogWeight] = useState(false)
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0])
  const [weightValue, setWeightValue] = useState('')
  const supabase = createClient()

  const initials = (preferences?.display_name ?? email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function saveWidgets(newWidgets: string[]) {
    setWidgets(newWidgets)
    await supabase
      .from('user_preferences')
      .update({ dashboard_widgets: newWidgets })
      .eq('user_id', userId)
  }

  async function logWeight() {
    if (!weightValue) return
    await supabase.from('body_measurements').insert({
      user_id: userId,
      logged_at: weightDate,
      weight_kg: parseFloat(weightValue),
    })
    setShowLogWeight(false)
    setWeightValue('')
  }

  const availableWidgets = Object.keys(WIDGET_META).filter((k) => {
    if (widgets.includes(k)) return false
    if (k === 'bodyweight' && measurements.length < 2) return false
    return true
  })

  const setsForChart = sets.map((s) => ({
    exercise_id: s.exercise_id,
    weight_kg: s.weight_kg,
    reps: s.reps,
    primary_muscle: s.exercise?.primary_muscle ?? undefined,
    secondary_muscles: s.exercise?.secondary_muscles ?? [],
  }))

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
          <p className="font-semibold text-[var(--text-primary)] text-lg">
            {preferences?.display_name ?? email}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {workoutCount} workout{workoutCount !== 1 ? 's' : ''} logged
          </p>
        </div>
      </div>

      {/* Dashboard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Dashboard
          </h2>
          {availableWidgets.length > 0 && (
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center gap-1 text-[var(--accent)] text-sm font-medium min-h-[36px]"
            >
              <Plus className="w-4 h-4" /> Add Widget
            </button>
          )}
        </div>

        {widgets.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] py-4 text-center">
            No widgets yet. Tap &quot;Add Widget&quot; to get started.
          </p>
        )}

        <div className="space-y-4">
          {widgets.map((widgetKey) => (
            <WidgetCard
              key={widgetKey}
              widgetKey={widgetKey}
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
            </WidgetCard>
          ))}
        </div>
      </section>

      {/* Log weight FAB (if bodyweight widget active) */}
      {widgets.includes('bodyweight') && (
        <button
          onClick={() => setShowLogWeight(true)}
          className="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center z-20"
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Add Widget Sheet */}
      <Sheet open={showAddWidget} onClose={() => setShowAddWidget(false)} title="Add Widget" showClose>
        <div className="p-4 space-y-2">
          {availableWidgets.map((k) => (
            <button
              key={k}
              onClick={() => { saveWidgets([...widgets, k]); setShowAddWidget(false) }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] min-h-[64px] text-left"
            >
              <span className="text-[var(--accent)]">{WIDGET_META[k].icon}</span>
              <div>
                <p className="font-medium text-[var(--text-primary)] text-sm">{WIDGET_META[k].name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{WIDGET_META[k].description}</p>
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
    </div>
  )
}

function WidgetCard({
  widgetKey,
  onRemove,
  children,
}: {
  widgetKey: string
  onRemove: () => void
  children: React.ReactNode
}) {
  const meta = WIDGET_META[widgetKey]
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-[var(--text-primary)] text-sm">{meta?.name ?? widgetKey}</p>
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
