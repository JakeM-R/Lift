import type { WorkoutSet } from '@/lib/types'

/**
 * Volume for a single set attributed to primary muscle (100%)
 */
export function primaryVolume(set: Pick<WorkoutSet, 'weight_kg' | 'reps'>): number {
  return (set.weight_kg ?? 0) * (set.reps ?? 0)
}

/**
 * Volume for a single set attributed to each secondary muscle (50%)
 */
export function secondaryVolume(set: Pick<WorkoutSet, 'weight_kg' | 'reps'>): number {
  return (set.weight_kg ?? 0) * (set.reps ?? 0) * 0.5
}

/**
 * Total workout volume — sum of weight × reps for all completed non-warmup sets.
 */
export function totalWorkoutVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => s.completed && s.set_type !== 'warmup')
    .reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
}
