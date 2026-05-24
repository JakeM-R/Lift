export const BODY_PARTS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'] as const
export type BodyPart = typeof BODY_PARTS[number]

export const CATEGORIES = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Cardio'] as const
export type Category = typeof CATEGORIES[number]

/** Muscles grouped by body part */
export const MUSCLES_BY_BODY_PART: Record<BodyPart, string[]> = {
  Chest:     ['Pectoralis Major', 'Pectoralis Minor'],
  Back:      ['Latissimus Dorsi', 'Rhomboids', 'Trapezius', 'Rear Deltoid', 'Erector Spinae'],
  Shoulders: ['Front Deltoid', 'Side Deltoid', 'Rear Deltoid'],
  Arms:      ['Biceps', 'Triceps', 'Forearms'],
  Legs:      ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors'],
  Core:      ['Rectus Abdominis', 'Obliques', 'Transverse Abdominis'],
  Cardio:    ['Quadriceps', 'Hamstrings', 'Calves', 'Latissimus Dorsi'],
}

/** Reverse map: muscle → body part */
export const MUSCLE_TO_BODY_PART: Record<string, BodyPart> = {
  'Pectoralis Major':    'Chest',
  'Pectoralis Minor':    'Chest',
  'Latissimus Dorsi':    'Back',
  'Rhomboids':           'Back',
  'Trapezius':           'Back',
  'Rear Deltoid':        'Shoulders',
  'Erector Spinae':      'Back',
  'Front Deltoid':       'Shoulders',
  'Side Deltoid':        'Shoulders',
  'Biceps':              'Arms',
  'Triceps':             'Arms',
  'Forearms':            'Arms',
  'Quadriceps':          'Legs',
  'Hamstrings':          'Legs',
  'Glutes':              'Legs',
  'Calves':              'Legs',
  'Hip Flexors':         'Legs',
  'Rectus Abdominis':    'Core',
  'Obliques':            'Core',
  'Transverse Abdominis':'Core',
}

export function getAllMuscles(): string[] {
  return Object.keys(MUSCLE_TO_BODY_PART)
}

/** First letter of exercise name → coloured avatar */
export function exerciseInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}
