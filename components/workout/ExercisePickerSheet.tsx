'use client'

import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'
import type { Exercise } from '@/lib/types'
import { Search } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
}

export function ExercisePickerSheet({ open, onClose, exercises, onSelect }: Props) {
  const [search, setSearch] = useState('')

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Sheet open={open} onClose={onClose} title="Add Exercise" showClose>
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onSelect(ex); onClose() }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left active:bg-[var(--surface)] min-h-[56px]"
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
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
