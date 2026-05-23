/**
 * Exercise — a row in the exercise catalog (built-in or custom).
 */
export class Exercise {
  constructor({ name, muscle }) {
    this.name = name;
    this.muscle = muscle;
  }

  toJSON() {
    return { name: this.name, muscle: this.muscle };
  }

  static fromJSON(o) {
    return new Exercise(o);
  }
}

/**
 * RoutineExercise — an exercise as it appears inside a routine,
 * with prescribed sets/reps/RIR and an optional cue note.
 */
export class RoutineExercise {
  constructor({ name, muscle = '', sets = 3, reps = '8-12', rir, note = '' }) {
    this.name = name;
    this.muscle = muscle;
    this.sets = sets;
    this.reps = reps;
    this.rir = rir;
    this.note = note;
  }

  /** First number in the rep range, e.g. "8-12" -> 8. Used to prefill set rows. */
  startingReps() {
    const first = String(this.reps).split('-')[0];
    const n = parseInt(first, 10);
    return Number.isFinite(n) ? n : 10;
  }

  toJSON() {
    const o = {
      name: this.name, muscle: this.muscle,
      sets: this.sets, reps: this.reps,
    };
    if (this.rir !== undefined) o.rir = this.rir;
    if (this.note) o.note = this.note;
    return o;
  }

  static fromJSON(o) {
    return new RoutineExercise(o);
  }
}
