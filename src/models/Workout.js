import { todayISO } from '../core/dateUtils.js';

/**
 * LoggedSet — a single set actually performed and saved to history.
 */
export class LoggedSet {
  constructor({ weight = 0, reps = 0 }) {
    this.weight = Number(weight) || 0;
    this.reps = Number(reps) || 0;
  }
  /**
   * Epley estimated 1RM. Used to rank PRs across rep ranges.
   * Formula: weight * (1 + reps/30).
   */
  estimated1RM() {
    return this.weight * (1 + this.reps / 30);
  }
  toJSON() { return { weight: this.weight, reps: this.reps }; }
}

/**
 * LoggedExercise — exercise as part of a completed workout.
 */
export class LoggedExercise {
  constructor({ name, muscle = '', sets = [] }) {
    this.name = name;
    this.muscle = muscle;
    this.sets = sets.map((s) => (s instanceof LoggedSet ? s : new LoggedSet(s)));
  }
  toJSON() {
    return { name: this.name, muscle: this.muscle, sets: this.sets.map((s) => s.toJSON()) };
  }
}

/**
 * Workout — a completed (or manually logged past) workout entry.
 */
export class Workout {
  constructor({
    id, date, routineId = null, routineName = 'Workout',
    duration = 0, avgHR = null, maxHR = null, calBurned = null,
    exercises = [],
  }) {
    this.id = id || Date.now();
    this.date = date || todayISO();
    this.routineId = routineId;
    this.routineName = routineName;
    this.duration = duration;       // seconds
    this.avgHR = avgHR;
    this.maxHR = maxHR;
    this.calBurned = calBurned;
    this.exercises = exercises.map((e) =>
      e instanceof LoggedExercise ? e : new LoggedExercise(e)
    );
  }

  totalSets() {
    return this.exercises.reduce((a, e) => a + e.sets.length, 0);
  }

  durationMinutes() {
    return this.duration ? Math.round(this.duration / 60) : null;
  }

  toJSON() {
    return {
      id: this.id, date: this.date,
      routineId: this.routineId, routineName: this.routineName,
      duration: this.duration,
      avgHR: this.avgHR, maxHR: this.maxHR, calBurned: this.calBurned,
      exercises: this.exercises.map((e) => e.toJSON()),
    };
  }

  static fromJSON(o) { return new Workout(o); }
}
