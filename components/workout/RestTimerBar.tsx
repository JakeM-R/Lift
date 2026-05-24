'use client'

import { useState, useEffect, useRef } from 'react'
import { SkipForward } from 'lucide-react'
import { formatDuration } from '@/lib/utils/format'

interface Props {
  seconds: number
  onDone: () => void
  onSkip: () => void
}

export function RestTimerBar({ seconds: initialSeconds, onDone, onSkip }: Props) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (remaining <= 0) {
      // Vibrate
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
      // Beep
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start()
        osc.stop(ctx.currentTime + 0.5)
      } catch {}
      onDone()
      return
    }

    const iv = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(iv)
  }, [remaining, onDone])

  const pct = Math.max(0, (remaining / initialSeconds) * 100)

  return (
    <div className="shrink-0 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2">
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-[var(--border)] mb-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-[var(--text-secondary)]">Rest</span>
          <span className="ml-2 text-sm font-semibold text-[var(--accent)] tabular-nums">
            {formatDuration(remaining)}
          </span>
        </div>
        <button
          onClick={onSkip}
          className="flex items-center gap-1 text-xs text-[var(--text-secondary)] min-h-[36px] px-2"
        >
          <SkipForward className="w-3.5 h-3.5" /> Skip
        </button>
      </div>
    </div>
  )
}
