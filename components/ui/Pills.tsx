'use client'

interface PillsProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

export function Pills({ options, selected, onChange, className = '' }: PillsProps) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px]',
              isSelected
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
