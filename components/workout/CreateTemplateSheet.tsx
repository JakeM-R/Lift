'use client'

import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import type { Exercise, Template } from '@/lib/types'
import { Plus, Trash2, Search } from 'lucide-react'

interface SelectedExercise {
  exercise: Exercise
  sets: number
}

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  exercises: Exercise[]
  onCreated: (template: Template) => void
}

export function CreateTemplateSheet({ open, onClose, userId, exercises, onCreated }: Props) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<SelectedExercise[]>([])
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  function addExercise(ex: Exercise) {
    if (!selected.find((s) => s.exercise.id === ex.id)) {
      setSelected((prev) => [...prev, { exercise: ex, sets: 3 }])
    }
    setShowPicker(false)
    setSearch('')
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)

    const { data: template } = await supabase
      .from('templates')
      .insert({ user_id: userId, name: name.trim() })
      .select()
      .single()

    if (template && selected.length > 0) {
      const rows = selected.map((s, i) => ({
        template_id: template.id,
        exercise_id: s.exercise.id,
        position: i,
        default_sets: s.sets,
      }))
      await supabase.from('template_exercises').insert(rows)
    }

    if (template) {
      onCreated(template)
      setName('')
      setSelected([])
    }
    setSaving(false)
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="New Template" showClose>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--text-secondary)]">Template name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Day"
            />
          </div>

          {/* Selected exercises */}
          {selected.length > 0 && (
            <div className="space-y-2">
              {selected.map((s, i) => (
                <div
                  key={s.exercise.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{s.exercise.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={s.sets}
                      min={1}
                      max={20}
                      onChange={(e) => {
                        const sets = parseInt(e.target.value) || 1
                        setSelected((prev) =>
                          prev.map((x, j) => j === i ? { ...x, sets } : x)
                        )
                      }}
                      className="w-10 text-center rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm h-8 tabular-nums"
                    />
                    <span className="text-xs text-[var(--text-secondary)]">sets</span>
                  </div>
                  <button
                    onClick={() => setSelected((prev) => prev.filter((_, j) => j !== i))}
                    className="w-8 h-8 flex items-center justify-center text-[var(--danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--accent)] text-sm font-medium min-h-[48px]"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>

          <Button
            variant="primary"
            className="w-full"
            disabled={!name.trim() || saving}
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save Template'}
          </Button>
        </div>
      </Sheet>

      {/* Exercise picker */}
      <Sheet open={showPicker} onClose={() => setShowPicker(false)} title="Add Exercise" showClose>
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises…"
              className="pl-9"
            />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[var(--surface)] min-h-[56px]"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'var(--accent)' }}
                >
                  {ex.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{ex.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{ex.primary_muscle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </>
  )
}
