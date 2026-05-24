'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { UserPreferences, Theme } from '@/lib/types'
import { THEMES } from '@/lib/types'
import * as Slider from '@radix-ui/react-slider'

interface Props {
  userId: string
  email: string
  preferences?: UserPreferences
}

export function SettingsClient({ userId, email, preferences }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(preferences?.display_name ?? '')
  const [theme, setTheme] = useState<Theme>((preferences?.theme as Theme) ?? 'strong')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>(preferences?.weight_unit ?? 'kg')
  const [restEnabled, setRestEnabled] = useState(preferences?.rest_timer_enabled ?? false)
  const [restSeconds, setRestSeconds] = useState(preferences?.rest_timer_default_seconds ?? 90)
  const [rpeEnabled, setRpeEnabled] = useState(preferences?.rpe_enabled ?? false)
  const [prevMode, setPrevMode] = useState<'exercise' | 'routine'>(
    (preferences?.previous_value_mode as 'exercise' | 'routine') ?? 'exercise'
  )
  const [saving, setSaving] = useState(false)

  async function save(updates: Partial<UserPreferences>) {
    await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
  }

  function applyTheme(t: Theme) {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    save({ theme: t })
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function exportData() {
    const res = await fetch('/api/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lift-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveDisplayName() {
    setSaving(true)
    await save({ display_name: displayName || null })
    setSaving(false)
  }

  const restLabel = restSeconds >= 60
    ? `${Math.floor(restSeconds / 60)}m ${restSeconds % 60 > 0 ? `${restSeconds % 60}s` : ''}`
    : `${restSeconds}s`

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="w-10 h-10 flex items-center justify-center text-[var(--accent)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-[var(--text-primary)] font-heading">Settings</h1>
      </div>

      {/* Display Name */}
      <Section title="Display Name">
        <div className="flex gap-2">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={email}
            className="flex-1 h-11 rounded-xl px-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] text-base"
          />
          <button
            onClick={saveDisplayName}
            disabled={saving}
            className="h-11 px-4 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Theme">
        <div className="flex gap-3 flex-wrap">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => applyTheme(t.key)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={[
                  'w-12 h-12 rounded-full border-2 transition-all',
                  theme === t.key ? 'border-[var(--accent)] scale-110' : 'border-transparent',
                ].join(' ')}
                style={{ background: t.bg, outline: `3px solid ${t.accent}`, outlineOffset: theme === t.key ? '2px' : '0' }}
              >
                <div
                  className="w-full h-full rounded-full opacity-80"
                  style={{ background: `radial-gradient(circle at 35% 35%, ${t.accent}, ${t.bg})` }}
                />
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{t.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Weight Unit */}
      <Section title="Weight Unit">
        <div className="flex gap-2">
          {(['kg', 'lbs'] as const).map((u) => (
            <button
              key={u}
              onClick={() => { setWeightUnit(u); save({ weight_unit: u }) }}
              className={[
                'flex-1 h-11 rounded-xl font-semibold text-sm',
                weightUnit === u
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {u}
            </button>
          ))}
        </div>
      </Section>

      {/* Rest Timer */}
      <Section title="Rest Timer">
        <div className="space-y-4">
          <ToggleRow
            label="Enable rest timer"
            value={restEnabled}
            onChange={(v) => { setRestEnabled(v); save({ rest_timer_enabled: v }) }}
          />
          {restEnabled && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Default duration</span>
                <span className="text-[var(--text-primary)] tabular-nums font-medium">{restLabel}</span>
              </div>
              <Slider.Root
                value={[restSeconds]}
                onValueChange={([v]) => setRestSeconds(v)}
                onValueCommit={([v]) => save({ rest_timer_default_seconds: v })}
                min={30}
                max={300}
                step={30}
                className="relative flex items-center w-full h-6"
              >
                <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-[var(--border)]">
                  <Slider.Range className="absolute h-full rounded-full bg-[var(--accent)]" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 rounded-full bg-[var(--accent)] shadow-sm focus:outline-none" />
              </Slider.Root>
            </div>
          )}
        </div>
      </Section>

      {/* RPE */}
      <Section title="RPE Tracking">
        <ToggleRow
          label="Show RPE column during workouts"
          value={rpeEnabled}
          onChange={(v) => { setRpeEnabled(v); save({ rpe_enabled: v }) }}
        />
      </Section>

      {/* Previous Value Mode */}
      <Section title="Previous Values">
        <div className="space-y-2">
          {[
            { value: 'exercise', label: 'Any workout', description: 'Show best values for this exercise ever' },
            { value: 'routine', label: 'Same routine', description: 'Show values from the same template' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setPrevMode(opt.value as 'exercise' | 'routine'); save({ previous_value_mode: opt.value as 'exercise' | 'routine' }) }}
              className={[
                'w-full flex items-center gap-3 p-4 rounded-xl border text-left min-h-[60px]',
                prevMode === opt.value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] bg-[var(--surface)]',
              ].join(' ')}
            >
              <div
                className={[
                  'w-4 h-4 rounded-full border-2 shrink-0',
                  prevMode === opt.value
                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                    : 'border-[var(--border)]',
                ].join(' ')}
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Export */}
      <Section title="Data">
        <button
          onClick={exportData}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] min-h-[56px]"
        >
          <Download className="w-4 h-4 text-[var(--text-secondary)]" />
          Export Data (JSON)
        </button>
      </Section>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full h-12 rounded-xl border border-[var(--danger)] text-[var(--danger)] font-semibold text-base"
      >
        Sign Out
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">{title}</h2>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-[44px]">
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={[
          'relative w-12 h-7 rounded-full transition-colors shrink-0',
          value ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
        ].join(' ')}
        role="switch"
        aria-checked={value}
      >
        <span
          className={[
            'absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
