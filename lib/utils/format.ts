/**
 * Format elapsed seconds as HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Format a Date into elapsed duration from startedAt to now (or finishedAt)
 */
export function elapsedSeconds(startedAt: string | Date, endAt?: string | Date): number {
  const start = new Date(startedAt).getTime()
  const end = endAt ? new Date(endAt).getTime() : Date.now()
  return Math.floor((end - start) / 1000)
}

/**
 * Format weight respecting unit preference
 */
export function formatWeight(kg: number | null | undefined, unit: 'kg' | 'lbs' = 'kg'): string {
  if (kg == null) return '—'
  if (unit === 'lbs') {
    return `${Math.round(kg * 2.20462 * 4) / 4} lbs`
  }
  return `${kg} kg`
}

/**
 * Convert kg to lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 4) / 4
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100
}

/**
 * "Saturday, 23 May"
 */
export function formatWorkoutDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * "MAY 2026"
 */
export function formatMonthHeader(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase()
}

/**
 * "23 May 2026, 09:41"
 */
export function formatFullDatetime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ISO week number for a date
 */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
