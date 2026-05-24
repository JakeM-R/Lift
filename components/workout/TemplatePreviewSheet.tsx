'use client'

import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import type { Template } from '@/lib/types'
import { formatWorkoutDate } from '@/lib/utils/format'
import { Pencil } from 'lucide-react'

interface Props {
  template: Template
  onClose: () => void
  onStart: () => void
  onEdit: () => void
}

export function TemplatePreviewSheet({ template, onClose, onStart, onEdit }: Props) {
  const exercises = template.template_exercises
    ?.sort((a, b) => a.position - b.position) ?? []

  return (
    <Sheet
      open
      onClose={onClose}
      title={template.name}
      showClose
      headerRight={
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)]"
          aria-label="Edit template"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      }
    >
      <div className="p-4 space-y-4">
        {template.last_used_at && (
          <p className="text-sm text-[var(--text-secondary)]">
            Last performed: {formatWorkoutDate(template.last_used_at)}
          </p>
        )}

        {/* Exercise list */}
        <div className="space-y-1">
          {exercises.map((te) => (
            <div
              key={te.id}
              className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {te.exercise?.name ?? 'Unknown'}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {te.exercise?.body_part}
                </p>
              </div>
              <span className="text-sm text-[var(--text-secondary)] tabular-nums">
                {te.default_sets}× sets
              </span>
            </div>
          ))}
        </div>

        <Button variant="primary" className="w-full" onClick={onStart}>
          Start Workout
        </Button>
      </div>
    </Sheet>
  )
}
