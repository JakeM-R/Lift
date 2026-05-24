'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Pencil, Copy, Trash2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Template, Exercise } from '@/lib/types'
import { EXAMPLE_TEMPLATES } from '@/lib/types'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { TemplatePreviewSheet } from '@/components/workout/TemplatePreviewSheet'
import { CreateTemplateSheet } from '@/components/workout/CreateTemplateSheet'
import { formatWorkoutDate } from '@/lib/utils/format'

interface Props {
  userId: string
  templates: Template[]
  exercises: Exercise[]
}

export function StartWorkoutClient({ userId, templates: initialTemplates, exercises }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [menuTemplate, setMenuTemplate] = useState<Template | null>(null)
  const supabase = createClient()

  async function startEmptyWorkout() {
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: userId, name: 'Quick Workout', started_at: new Date().toISOString() })
      .select()
      .single()
    if (!error && data) router.push(`/workout/${data.id}`)
  }

  async function startFromTemplate(template: Template) {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        template_id: template.id,
        name: template.name,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (!error && data) {
      // Update last_used_at
      await supabase
        .from('templates')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', template.id)

      router.push(`/workout/${data.id}`)
    }
  }

  async function duplicateTemplate(t: Template) {
    const { data: newTemplate } = await supabase
      .from('templates')
      .insert({ user_id: userId, name: `${t.name} (Copy)` })
      .select()
      .single()

    if (newTemplate && t.template_exercises) {
      const rows = t.template_exercises.map((te) => ({
        template_id: newTemplate.id,
        exercise_id: te.exercise_id,
        position: te.position,
        default_sets: te.default_sets,
        rest_seconds: te.rest_seconds,
      }))
      await supabase.from('template_exercises').insert(rows)
    }
    router.refresh()
    setMenuTemplate(null)
  }

  async function deleteTemplate(t: Template) {
    await supabase.from('templates').delete().eq('id', t.id)
    setTemplates((prev) => prev.filter((x) => x.id !== t.id))
    setMenuTemplate(null)
  }

  function exercisePreview(template: Template): string {
    const exs = template.template_exercises
      ?.sort((a, b) => a.position - b.position)
      .map((te) => te.exercise?.name ?? '')
      .filter(Boolean)
    if (!exs?.length) return 'No exercises'
    return exs.slice(0, 4).join(', ') + (exs.length > 4 ? '…' : '')
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-heading">Start Workout</h1>
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="flex items-center gap-1.5 text-[var(--accent)] font-medium text-sm min-h-[44px] px-2"
        >
          <Plus className="w-4 h-4" /> Template
        </button>
      </div>

      {/* Quick Start */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
          Quick Start
        </h2>
        <Button variant="primary" className="w-full" onClick={startEmptyWorkout}>
          <Plus className="w-4 h-4 mr-2" /> Start an Empty Workout
        </Button>
      </section>

      {/* My Templates */}
      {templates.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
            My Templates
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                preview={exercisePreview(t)}
                onTap={() => setPreviewTemplate(t)}
                onMenu={() => setMenuTemplate(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Example Templates */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
          Example Templates
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {EXAMPLE_TEMPLATES.map((et) => (
            <div
              key={et.id}
              onClick={() => {
                /* Show a preview-like sheet for example templates */
              }}
              className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-1 cursor-pointer active:opacity-70"
            >
              <p className="font-semibold text-[var(--text-primary)] text-sm">{et.name}</p>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {et.exercises.map((e) => e.name).slice(0, 3).join(', ')}
                {et.exercises.length > 3 ? '…' : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Template Preview Sheet */}
      {previewTemplate && (
        <TemplatePreviewSheet
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onStart={() => startFromTemplate(previewTemplate)}
          onEdit={() => {
            setPreviewTemplate(null)
            // TODO: open edit sheet
          }}
        />
      )}

      {/* Template context menu */}
      <Sheet
        open={!!menuTemplate}
        onClose={() => setMenuTemplate(null)}
        title={menuTemplate?.name}
        showClose
      >
        <div className="p-4 space-y-2">
          <button
            onClick={() => { setMenuTemplate(null); setShowCreateTemplate(true) }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] min-h-[56px]"
          >
            <Pencil className="w-4 h-4 text-[var(--text-secondary)]" />
            Edit Template
          </button>
          <button
            onClick={() => menuTemplate && duplicateTemplate(menuTemplate)}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] min-h-[56px]"
          >
            <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
            Duplicate
          </button>
          <button
            onClick={() => menuTemplate && deleteTemplate(menuTemplate)}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--danger)] min-h-[56px]"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </Sheet>

      {/* Create Template Sheet */}
      <CreateTemplateSheet
        open={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        userId={userId}
        exercises={exercises}
        onCreated={(t) => {
          setTemplates((prev) => [t, ...prev])
          setShowCreateTemplate(false)
        }}
      />
    </div>
  )
}

function TemplateCard({
  template,
  preview,
  onTap,
  onMenu,
}: {
  template: Template
  preview: string
  onTap: () => void
  onMenu: () => void
}) {
  return (
    <div
      className="relative rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-1 cursor-pointer active:opacity-70"
      onClick={onTap}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold text-[var(--text-primary)] text-sm leading-snug flex-1">{template.name}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onMenu() }}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] -mt-0.5 -mr-0.5"
          aria-label="Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{preview}</p>
      {template.last_used_at && (
        <p className="text-[var(--text-secondary)] text-xs italic">
          {formatWorkoutDate(template.last_used_at)}
        </p>
      )}
    </div>
  )
}
