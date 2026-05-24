'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell } from 'lucide-react'

type Mode = 'signin' | 'signup' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/profile/settings`,
      })
      if (error) setError(error.message)
      else setResetSent(true)
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // Sign in immediately after sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      // Init preferences
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.rpc('init_user_preferences', { p_user_id: user.id })
      router.push('/workout')
      return
    }

    // Sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/workout')
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

        {/* Reset sent confirmation */}
        {resetSent ? (
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 text-center space-y-3">
            <p className="text-[var(--text-primary)] font-medium">Check your email</p>
            <p className="text-[var(--text-secondary)] text-sm">
              Password reset link sent to <strong>{email}</strong>.
            </p>
            <button
              onClick={() => { setResetSent(false); setMode('signin') }}
              className="text-[var(--accent)] text-sm font-medium"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[var(--text-secondary)]">
                Email
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

            {/* Password (not shown for reset) */}
            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 rounded-xl px-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] text-base"
                />
              </div>
            )}

            {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading || !email || (mode !== 'reset' && !password)}
              className="w-full h-12 rounded-xl bg-[var(--accent)] text-white font-semibold text-base disabled:opacity-50 active:opacity-80 transition-opacity"
            >
              {loading
                ? '…'
                : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>

            {/* Mode switchers */}
            <div className="flex flex-col items-center gap-2 pt-1">
              {mode === 'signin' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError('') }}
                    className="text-sm text-[var(--text-secondary)]"
                  >
                    No account? <span className="text-[var(--accent)] font-medium">Create one</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError('') }}
                    className="text-sm text-[var(--text-secondary)]"
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError('') }}
                  className="text-sm text-[var(--text-secondary)]"
                >
                  Already have an account? <span className="text-[var(--accent)] font-medium">Sign in</span>
                </button>
              )}
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError('') }}
                  className="text-sm text-[var(--accent)] font-medium"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
