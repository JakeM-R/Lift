'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-heading tracking-tight">
            Lift
          </h1>
          <p className="text-[var(--text-secondary)] text-sm text-center">
            Track your workouts. Hit your PRs.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 text-center space-y-2">
            <p className="text-[var(--text-primary)] font-medium">Check your email</p>
            <p className="text-[var(--text-secondary)] text-sm">
              We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-12 rounded-xl px-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] text-base"
              />
            </div>

            {error && (
              <p className="text-[var(--danger)] text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 rounded-xl bg-[var(--accent)] text-white font-semibold text-base disabled:opacity-50 active:opacity-80 transition-opacity"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
