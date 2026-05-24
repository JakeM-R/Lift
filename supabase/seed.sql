-- ─── Seeded Exercise Library ─────────────────────────────────────────────────
-- created_by is NULL for all seeded exercises (readable by all authenticated users)

insert into exercises (name, body_part, primary_muscle, secondary_muscles, category, is_custom) values
-- Chest
('Bench Press (Barbell)',          'Chest',     'Pectoralis Major',  array['Triceps','Front Deltoid'],              'Barbell',    false),
('Bench Press (Dumbbell)',         'Chest',     'Pectoralis Major',  array['Triceps','Front Deltoid'],              'Dumbbell',   false),
('Incline Bench Press (Barbell)',  'Chest',     'Pectoralis Major',  array['Front Deltoid','Triceps'],              'Barbell',    false),
('Chest Fly (Cable)',              'Chest',     'Pectoralis Major',  array['Front Deltoid'],                        'Cable',      false),
('Push-Up',                        'Chest',     'Pectoralis Major',  array['Triceps','Front Deltoid'],              'Bodyweight', false),
-- Back
('Deadlift (Barbell)',             'Back',      'Erector Spinae',    array['Hamstrings','Glutes','Latissimus Dorsi','Trapezius'], 'Barbell', false),
('Lat Pulldown (Cable)',           'Back',      'Latissimus Dorsi',  array['Biceps','Rear Deltoid'],                'Cable',      false),
('Bent Over Row (Barbell)',        'Back',      'Latissimus Dorsi',  array['Rhomboids','Biceps','Rear Deltoid'],    'Barbell',    false),
('Seated Row (Cable)',             'Back',      'Rhomboids',         array['Latissimus Dorsi','Biceps'],            'Cable',      false),
('Pull-Up',                        'Back',      'Latissimus Dorsi',  array['Biceps','Rear Deltoid'],                'Bodyweight', false),
-- Shoulders
('Overhead Press (Barbell)',       'Shoulders', 'Front Deltoid',     array['Side Deltoid','Triceps'],               'Barbell',    false),
('Seated Overhead Press (Dumbbell)', 'Shoulders','Front Deltoid',    array['Side Deltoid','Triceps'],               'Dumbbell',   false),
('Lateral Raise (Dumbbell)',       'Shoulders', 'Side Deltoid',      array[]::text[],                              'Dumbbell',   false),
('Arnold Press (Dumbbell)',        'Shoulders', 'Front Deltoid',     array['Side Deltoid','Triceps'],               'Dumbbell',   false),
('Face Pull (Cable)',              'Shoulders', 'Rear Deltoid',      array['Trapezius'],                            'Cable',      false),
-- Arms
('Bicep Curl (Dumbbell)',          'Arms',      'Biceps',            array['Forearms'],                             'Dumbbell',   false),
('Hammer Curl (Dumbbell)',         'Arms',      'Biceps',            array['Forearms'],                             'Dumbbell',   false),
('Incline Curl (Dumbbell)',        'Arms',      'Biceps',            array[]::text[],                              'Dumbbell',   false),
('Triceps Extension (Cable)',      'Arms',      'Triceps',           array[]::text[],                              'Cable',      false),
('Triceps Pushdown (Cable)',       'Arms',      'Triceps',           array[]::text[],                              'Cable',      false),
-- Legs
('Squat (Barbell)',                'Legs',      'Quadriceps',        array['Glutes','Hamstrings','Erector Spinae'], 'Barbell',    false),
('Romanian Deadlift (Barbell)',    'Legs',      'Hamstrings',        array['Glutes','Erector Spinae'],              'Barbell',    false),
('Leg Press (Machine)',            'Legs',      'Quadriceps',        array['Glutes','Hamstrings'],                  'Machine',    false),
('Leg Extension (Machine)',        'Legs',      'Quadriceps',        array[]::text[],                              'Machine',    false),
('Seated Leg Curl (Machine)',      'Legs',      'Hamstrings',        array[]::text[],                              'Machine',    false),
('Hip Thrust (Barbell)',           'Legs',      'Glutes',            array['Hamstrings'],                           'Barbell',    false),
-- Core
('Plank',                          'Core',      'Transverse Abdominis', array['Rectus Abdominis'],                 'Bodyweight', false),
('Ab Wheel',                       'Core',      'Rectus Abdominis',  array['Transverse Abdominis','Obliques'],      'Bodyweight', false),
('Cable Crunch',                   'Core',      'Rectus Abdominis',  array['Obliques'],                             'Cable',      false),
-- Cardio
('Treadmill',                      'Cardio',    'Quadriceps',        array['Hamstrings','Calves'],                  'Cardio',     false),
('Rowing Machine',                 'Cardio',    'Latissimus Dorsi',  array['Rhomboids','Biceps','Quadriceps'],      'Cardio',     false),
('Cycling',                        'Cardio',    'Quadriceps',        array['Hamstrings','Calves'],                  'Cardio',     false);

-- ─── Seeded Example Templates ────────────────────────────────────────────────
-- These are "example" templates not tied to any user (user_id points to a sentinel).
-- In practice, we store these as regular template rows owned by a special seed user,
-- OR we expose them as static data in the app and let users duplicate them.
-- For v1 simplicity, we mark them with a special note in the name
-- and load them in the "Example Templates" section via a static list in code.
-- (No DB rows needed for example templates — they are rendered from a constant.)
