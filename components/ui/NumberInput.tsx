'use client'

interface NumberInputProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  className?: string
}

export function NumberInput({
  value,
  onChange,
  placeholder = '—',
  min,
  max,
  step = 1,
  className = '',
}: NumberInputProps) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : parseFloat(v))
      }}
      className={[
        'w-full text-center h-11 min-w-[52px] rounded-lg',
        'bg-[var(--surface)] border border-[var(--border)]',
        'text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]',
        'focus:outline-none focus:border-[var(--accent)]',
        'tabular-nums text-base',
        className,
      ].join(' ')}
    />
  )
}
