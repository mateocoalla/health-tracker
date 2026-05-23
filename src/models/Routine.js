import { RoutineExercise } from './Exercise.js';

/**
 * Routine — a named training session: name, type (Upper/Lower/...),
 * optional scheduled weekday, and an ordered list of RoutineExercise.
 */
export class Routine {
  constructor({ id, name, type = 'Other', day = '', exercises = [] }) {
    this.id = id || Routine.newId();
    this.name = name;
    this.type = type;
    this.day = day;
    this.exercises = exercises.map((e) =>
      e instanceof RoutineExercise ? e : RoutineExercise.fromJSON(e)
    );
  }

  static newId() {
    return 'r' + Date.now() + Math.floor(Math.random() * 1000);
  }

  addExercise(exData) {
    this.exercises.push(
      exData instanceof RoutineExercise ? exData : new RoutineExercise(exData)
    );
  }

  removeExerciseAt(idx) {
    this.exercises.splice(idx, 1);
  }

  moveExercise(idx, delta) {
    const j = idx + delta;
    if (j < 0 || j >= this.exercises.length) return false;
    [this.exercises[idx], this.exercises[j]] = [this.exercises[j], this.exercises[idx]];
    return true;
  }

  updateExerciseField(idx, field, value) {
    if (!this.exercises[idx]) return;
    this.exercises[idx][field] = value;
  }

  toJSON() {
    return {
      id: this.id, name: this.name, type: this.type, day: this.day,
      exercises: this.exercises.map((e) => e.toJSON()),
    };
  }

  static fromJSON(o) {
    return new Routine(o);
  }
}
