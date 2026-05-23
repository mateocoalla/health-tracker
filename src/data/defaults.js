/**
 * Default exercise catalog. Custom user exercises are merged on top by ExerciseRepository.
 */
export const DEFAULT_EXERCISES = [
  { name: 'Barbell Bench Press', muscle: 'Chest' },
  { name: 'Incline Dumbbell Press', muscle: 'Chest' },
  { name: 'Cable Fly', muscle: 'Chest' },
  { name: 'Dips', muscle: 'Chest' },
  { name: 'Pull-Up', muscle: 'Back' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Lat Pulldown', muscle: 'Back' },
  { name: 'Seated Cable Row', muscle: 'Back' },
  { name: 'Face Pull', muscle: 'Back' },
  { name: 'Deadlift', muscle: 'Back' },
  { name: 'Overhead Press', muscle: 'Shoulders' },
  { name: 'Lateral Raise', muscle: 'Shoulders' },
  { name: 'Arnold Press', muscle: 'Shoulders' },
  { name: 'Rear Delt Fly', muscle: 'Shoulders' },
  { name: 'Barbell Curl', muscle: 'Biceps' },
  { name: 'Hammer Curl', muscle: 'Biceps' },
  { name: 'Incline Dumbbell Curl', muscle: 'Biceps' },
  { name: 'Cable Curl', muscle: 'Biceps' },
  { name: 'Tricep Pushdown', muscle: 'Triceps' },
  { name: 'Skull Crusher', muscle: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscle: 'Triceps' },
  { name: 'Close-Grip Bench Press', muscle: 'Triceps' },
  { name: 'Squat', muscle: 'Quads' },
  { name: 'Leg Press', muscle: 'Quads' },
  { name: 'Hack Squat', muscle: 'Quads' },
  { name: 'Leg Extension', muscle: 'Quads' },
  { name: 'Romanian Deadlift', muscle: 'Hamstrings' },
  { name: 'Leg Curl', muscle: 'Hamstrings' },
  { name: 'Nordic Curl', muscle: 'Hamstrings' },
  { name: 'Hip Thrust', muscle: 'Glutes' },
  { name: 'Bulgarian Split Squat', muscle: 'Glutes' },
  { name: 'Calf Raise', muscle: 'Calves' },
  { name: 'Seated Calf Raise', muscle: 'Calves' },
  { name: 'Plank', muscle: 'Core' },
  { name: 'Cable Crunch', muscle: 'Core' },
  { name: 'Hanging Leg Raise', muscle: 'Core' },
];

/**
 * Default Upper/Lower 4-day split. Seeded on first run.
 */
export const DEFAULT_ROUTINES = [
  {
    id: 'r1', name: 'Upper A — Chest & Back', type: 'Upper', day: 'Monday',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rir: 2, note: 'Main horizontal push' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Pull-Up', sets: 4, reps: '6-8', rir: 2, note: 'Add weight if needed' },
      { name: 'Barbell Row', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Lateral Raise', sets: 3, reps: '12-15', rir: 1 },
      { name: 'Tricep Pushdown', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Barbell Curl', sets: 3, reps: '10-12', rir: 1 },
    ],
  },
  {
    id: 'r2', name: 'Lower A — Quad Focus', type: 'Lower', day: 'Tuesday',
    exercises: [
      { name: 'Squat', sets: 4, reps: '6-8', rir: 2, note: 'ATG depth if possible' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Leg Press', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Leg Curl', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Calf Raise', sets: 4, reps: '12-15', rir: 1 },
      { name: 'Hanging Leg Raise', sets: 3, reps: '12-15', rir: 1 },
    ],
  },
  {
    id: 'r3', name: 'Upper B — Shoulders & Arms', type: 'Upper', day: 'Thursday',
    exercises: [
      { name: 'Overhead Press', sets: 4, reps: '6-8', rir: 2, note: 'Strict form, no leg drive' },
      { name: 'Lat Pulldown', sets: 4, reps: '8-10', rir: 2 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Seated Cable Row', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Lateral Raise', sets: 4, reps: '15-20', rir: 0 },
      { name: 'Hammer Curl', sets: 3, reps: '10-12', rir: 1 },
      { name: 'Skull Crusher', sets: 3, reps: '10-12', rir: 1 },
    ],
  },
  {
    id: 'r4', name: 'Lower B — Posterior Chain', type: 'Lower', day: 'Friday',
    exercises: [
      { name: 'Deadlift', sets: 3, reps: '5-6', rir: 3, note: 'Conventional, brace hard' },
      { name: 'Hip Thrust', sets: 4, reps: '10-12', rir: 1 },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '8-10', rir: 2 },
      { name: 'Leg Curl', sets: 4, reps: '10-12', rir: 1 },
      { name: 'Calf Raise', sets: 4, reps: '15-20', rir: 0 },
      { name: 'Cable Crunch', sets: 3, reps: '12-15', rir: 1 },
    ],
  },
];

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body',
];

export const ROUTINE_TYPES = ['Upper', 'Lower', 'Push', 'Pull', 'Legs', 'Full Body', 'Other'];
