import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'pr' | 'custom'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold'
  const variants = {
    default: 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]',
    pr:      'bg-[var(--pr)] text-[var(--pr-text)]',
    custom:  'bg-[var(--accent)]/20 text-[var(--accent)]',
  }
  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  )
}
