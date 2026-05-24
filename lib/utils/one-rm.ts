/**
 * Epley 1RM formula: weight × (1 + reps / 30)
 * Returns 0 if inputs are invalid.
 */
export function epley(weightKg: number, reps: number): number {
  if (!weightKg || !reps || reps <= 0 || weightKg <= 0) return 0
  return Math.round((weightKg * (1 + reps / 30)) * 10) / 10
}

/**
 * 1RM relative to bodyweight.
 * Returns e.g. 1.24 (display as "1.24× BW")
 */
export function relativeStrength(oneRm: number, bodyWeightKg: number): number | null {
  if (!bodyWeightKg || bodyWeightKg <= 0 || !oneRm) return null
  return Math.round((oneRm / bodyWeightKg) * 100) / 100
}
