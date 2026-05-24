import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'surface'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-opacity active:opacity-75 disabled:opacity-40'

    const variants = {
      primary: 'bg-[var(--accent)] text-white',
      success: 'bg-[var(--success)] text-white',
      danger:  'bg-[var(--danger)] text-white',
      ghost:   'bg-transparent text-[var(--accent)] border border-[var(--border)]',
      surface: 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]',
    }

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-5 text-base',
      lg: 'h-12 px-6 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
