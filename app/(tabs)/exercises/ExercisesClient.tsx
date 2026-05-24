'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Search } from 'lucide-react'
import type { Exercise } from '@/lib/types'
import { BODY_PARTS, CATEGORIES } from '@/lib/utils/muscles'
import { createClient } from '@/lib/supabase/client'
import { ExerciseDetailSheet } from '@/components/exercises/ExerciseDetailSheet'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

interface SetStat {
  exercise_id: string
  weight_kg: number | null
  reps: number | null
  one_rm: number | null
  is_pr: boolean
}

export function ExercisesClient({ userId }: { userId: string }) {
  const supabase = createClient()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [sets, setSets] = useState<SetStat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bodyPartFilter, setBodyPartFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [detail, setDetail] = useState<Exercise | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    async function load() {
      // Ensure session cookie is loaded before querying (avoids RLS race on first render)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      // Split into two queries to avoid or() null issues
      const [seeded, custom, setsRes] = await Promise.all([
        supabase.from('exercises').select('*').is('created_by', null).order('name'),
        supabase.from('exercises').select('*').eq('created_by', userId).order('name'),
        supabase
          .from('workout_sets')
          .select('exercise_id, weight_kg, reps, one_rm, is_pr, workouts!inner(finished_at)')
          .not('workouts.finished_at', 'is', null)
          .eq('completed', true),
      ])
      const all = [...(seeded.data ?? []), ...(custom.data ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name))
      setExercises(all)
      setSets((setsRes.data ?? []) as SetStat[])
      setLoading(false)
    }
    load()
  }, [userId])

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
      if (bodyPartFilter !== 'All' && e.body_part !== bodyPartFilter) return false
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false
      return true
    })
  }, [exercises, search, bodyPartFilter, categoryFilter])

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

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-8 w-32 rounded-xl bg-[var(--surface)] animate-pulse" />
        <div className="h-11 rounded-2xl bg-[var(--surface)] animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-full bg-[var(--surface)] animate-pulse" />
          <div className="h-8 w-24 rounded-full bg-[var(--surface)] animate-pulse" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-[var(--surface)] animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 rounded bg-[var(--surface)] animate-pulse" />
              <div className="h-3 w-24 rounded bg-[var(--surface)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
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

        {/* Filter pills — Body Part */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {['All', ...BODY_PARTS].map((bp) => (
            <button
              key={bp}
              onClick={() => setBodyPartFilter(bp)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 min-h-[32px]',
                bodyPartFilter === bp
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {bp}
            </button>
          ))}
        </div>

        {/* Filter pills — Category */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 min-h-[32px]',
                categoryFilter === cat
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="pr-6">
          {grouped.length === 0 && (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">No exercises found.</p>
          )}
          {grouped.map(([letter, exs]) => (
            <div key={letter} ref={(el) => { sectionRefs.current[letter] = el }}>
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
                  {ex.is_custom && <Badge variant="custom" className="shrink-0">Custom</Badge>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* A–Z Scrubber */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col z-20 py-2">
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

      {detail && (
        <ExerciseDetailSheet
          exercise={detail}
          sets={sets.filter((s) => s.exercise_id === detail.id)}
          onClose={() => setDetail(null)}
          onEdit={detail.is_custom ? () => setShowCreate(true) : undefined}
        />
      )}

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
