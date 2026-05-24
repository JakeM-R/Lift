'use client'

import { useState, useMemo, useRef } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Exercise } from '@/lib/types'
import { BODY_PARTS, CATEGORIES } from '@/lib/utils/muscles'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import { ExerciseDetailSheet } from '@/components/exercises/ExerciseDetailSheet'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { Badge } from '@/components/ui/Badge'

interface Props {
  exercises: Exercise[]
  sets: Array<{
    exercise_id: string
    weight_kg: number | null
    reps: number | null
    one_rm: number | null
    is_pr: boolean
  }>
  userId: string
}

export function ExercisesClient({ exercises: initialExercises, sets, userId }: Props) {
  const [exercises, setExercises] = useState(initialExercises)
  const [search, setSearch] = useState('')
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('Any Body Part')
  const [categoryFilter, setCategoryFilter] = useState<string>('Any Category')
  const [detail, setDetail] = useState<Exercise | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      if (bodyPartFilter !== 'Any Body Part' && e.body_part !== bodyPartFilter) return false
      if (categoryFilter !== 'Any Category' && e.category !== categoryFilter) return false
      return true
    })
  }, [exercises, search, bodyPartFilter, categoryFilter])

  // Group alphabetically
  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {}
    for (const ex of filtered) {
      const letter = ex.name.charAt(0).toUpperCase()
      if (!map[letter]) map[letter] = []
      map[letter].push(ex)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const letters = grouped.map(([l]) => l)

  function scrollToLetter(letter: string) {
    sectionRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function statsForExercise(exId: string) {
    const exSets = sets.filter((s) => s.exercise_id === exId)
    const bestSet = exSets.reduce<typeof exSets[0] | undefined>((best, s) => {
      if (!best) return s
      const vol = (s.weight_kg ?? 0) * (s.reps ?? 0)
      return vol > (best.weight_kg ?? 0) * (best.reps ?? 0) ? s : best
    }, undefined)
    const bestOneRm = Math.max(0, ...exSets.map((s) => s.one_rm ?? 0))
    const sessions = new Set(exSets.map((s) => s.exercise_id)).size
    return { bestSet, bestOneRm, sessions: exSets.length }
  }

  return (
    <div className="relative h-full">
      <div className="px-4 pt-6 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-heading">Exercises</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-[var(--accent)] font-medium text-sm min-h-[44px] px-2"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="pl-9 rounded-2xl"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <FilterSelect
            value={bodyPartFilter}
            options={['Any Body Part', ...BODY_PARTS]}
            onChange={setBodyPartFilter}
          />
          <FilterSelect
            value={categoryFilter}
            options={['Any Category', ...CATEGORIES]}
            onChange={setCategoryFilter}
          />
        </div>

        {/* List */}
        <div className="pr-6"> {/* padding for scrubber */}
          {grouped.map(([letter, exs]) => (
            <div
              key={letter}
              ref={(el) => { sectionRefs.current[letter] = el }}
            >
              <div className="sticky top-0 bg-[var(--bg)] py-1 z-10">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {letter}
                </span>
              </div>
              {exs.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setDetail(ex)}
                  className="w-full flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0 min-h-[56px] text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    {ex.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ex.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{ex.primary_muscle}</p>
                  </div>
                  {ex.is_custom && (
                    <Badge variant="custom" className="shrink-0">Custom</Badge>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* A–Z Scrubber */}
      <div className="fixed right-1 top-1/2 -translate-y-1/2 flex flex-col z-20">
        {letters.map((l) => (
          <button
            key={l}
            onClick={() => scrollToLetter(l)}
            className="text-[10px] font-bold text-[var(--text-secondary)] leading-tight px-1.5 py-0.5 min-w-[20px] text-center"
          >
            {l}
          </button>
        ))}
      </div>

      {/* Detail sheet */}
      {detail && (
        <ExerciseDetailSheet
          exercise={detail}
          sets={sets.filter((s) => s.exercise_id === detail.id)}
          onClose={() => setDetail(null)}
          onEdit={detail.is_custom ? () => {
            setShowCreate(true)
          } : undefined}
        />
      )}

      {/* Create / Edit form */}
      <ExerciseForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        userId={userId}
        onSaved={(ex) => {
          setExercises((prev) => {
            const exists = prev.find((e) => e.id === ex.id)
            if (exists) return prev.map((e) => e.id === ex.id ? ex : e)
            return [...prev, ex].sort((a, b) => a.name.localeCompare(b.name))
          })
          setShowCreate(false)
        }}
      />
    </div>
  )
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-full px-3 text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] shrink-0 focus:outline-none focus:border-[var(--accent)]"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}
