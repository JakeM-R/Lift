import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-11 rounded-xl px-4 bg-[var(--surface)] border border-[var(--border)]',
        'text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]',
        'focus:outline-none focus:border-[var(--accent)] text-base',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
