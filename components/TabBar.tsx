'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Plus, Dumbbell, User } from 'lucide-react'

const TABS = [
  { href: '/history',   icon: Clock,    label: 'History' },
  { href: '/workout',   icon: Plus,     label: 'Workout' },
  { href: '/exercises', icon: Dumbbell, label: 'Exercises' },
  { href: '/profile',   icon: User,     label: 'Profile' },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="shrink-0 flex border-t border-[var(--border)] bg-[var(--surface)] pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')

        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5 min-h-[56px]"
            aria-label={label}
          >
            <Icon
              className="w-6 h-6"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
              strokeWidth={isActive ? 2.5 : 1.75}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
