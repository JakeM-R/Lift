'use client'

import { useState, useEffect } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pills } from '@/components/ui/Pills'
import { createClient } from '@/lib/supabase/client'
import type { Exercise } from '@/lib/types'
import { BODY_PARTS, CATEGORIES, MUSCLES_BY_BODY_PART } from '@/lib/utils/muscles'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  initial?: Exercise
  onSaved: (exercise: Exercise) => void
}

export function ExerciseForm({ open, onClose, userId, initial, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [bodyPart, setBodyPart] = useState(initial?.body_part ?? '')
  const [primaryMuscle, setPrimaryMuscle] = useState(initial?.primary_muscle ?? '')
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(initial?.secondary_muscles ?? [])
  const [category, setCategory] = useState(initial?.category ?? '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Reset when initial changes
  useEffect(() => {
    setName(initial?.name ?? '')
    setBodyPart(initial?.body_part ?? '')
    setPrimaryMuscle(initial?.primary_muscle ?? '')
    setSecondaryMuscles(initial?.secondary_muscles ?? [])
    setCategory(initial?.category ?? '')
  }, [initial])

  const availableMuscles = bodyPart ? MUSCLES_BY_BODY_PART[bodyPart as keyof typeof MUSCLES_BY_BODY_PART] ?? [] : []
  const secondaryOptions = availableMuscles.filter((m) => m !== primaryMuscle)

  async function save() {
    if (!name.trim() || !bodyPart || !primaryMuscle || !category) return
    setSaving(true)

    const payload = {
      name: name.trim(),
      body_part: bodyPart,
      primary_muscle: primaryMuscle,
      secondary_muscles: secondaryMuscles,
      category,
      is_custom: true,
      created_by: userId,
    }

    let data: Exercise | null = null
    if (initial) {
      const { data: d } = await supabase
        .from('exercises')
        .update(payload)
        .eq('id', initial.id)
        .select()
        .single()
      data = d
    } else {
      const { data: d } = await supabase
        .from('exercises')
        .insert(payload)
        .select()
        .single()
      data = d
    }

    if (data) onSaved(data)
    setSaving(false)
  }

  const isValid = name.trim() && bodyPart && primaryMuscle && category

  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'Edit Exercise' : 'New Exercise'} showClose>
      <div className="p-4 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bulgarian Split Squat"
          />
        </div>

        {/* Body Part */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Body Part *</label>
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map((bp) => (
              <button
                key={bp}
                type="button"
                onClick={() => {
                  setBodyPart(bp)
                  setPrimaryMuscle('')
                  setSecondaryMuscles([])
                }}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium min-h-[36px]',
                  bodyPart === bp
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
                ].join(' ')}
              >
                {bp}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Muscle */}
        {bodyPart && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Primary Muscle *</label>
            <div className="flex flex-wrap gap-2">
              {availableMuscles.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPrimaryMuscle(m)
                    setSecondaryMuscles((prev) => prev.filter((s) => s !== m))
                  }}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-medium min-h-[36px]',
                    primaryMuscle === m
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
                  ].join(' ')}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Secondary Muscles */}
        {primaryMuscle && secondaryOptions.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Secondary Muscles <span className="font-normal">(optional)</span>
            </label>
            <Pills
              options={secondaryOptions}
              selected={secondaryMuscles}
              onChange={setSecondaryMuscles}
            />
          </div>
        )}

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Category *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium min-h-[36px]',
                  category === c
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
                ].join(' ')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={!isValid || saving}
          onClick={save}
        >
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </div>
    </Sheet>
  )
}
