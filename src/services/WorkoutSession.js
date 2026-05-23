import { EventBus } from '../core/EventBus.js';
import { LoggedSet, LoggedExercise, Workout } from '../models/Workout.js';

/**
 * WorkoutSession — encapsulates an in-progress workout: the timer,
 * the per-exercise editable sets, adding exercises mid-session,
 * and producing a Workout record on finish.
 *
 * Pages subscribe to internal events so they don't poll.
 */
export class WorkoutSession extends EventBus {
  /**
   * @param {Routine} routine
   * @param {WorkoutRepository} workoutRepo
   */
  constructor(routine, workoutRepo) {
    super();
    this.routine = routine;
    this.workoutRepo = workoutRepo;
    this.startedAt = Date.now();
    this.seconds = 0;
    this._tick = null;

    // Expand the routine into editable per-set rows.
    this.exercises = routine.exercises.map((rex) => ({
      name: rex.name,
      muscle: rex.muscle,
      sets: Array.from({ length: rex.sets }, (_, i) => ({
        num: i + 1,
        weight: '',
        reps: String(rex.startingReps()),
        done: false,
      })),
    }));
  }

  start() {
    if (this._tick) return;
    this._tick = setInterval(() => {
      this.seconds++;
      this.emit('tick', this.seconds);
    }, 1000);
  }

  stop() {
    if (this._tick) { clearInterval(this._tick); this._tick = null; }
  }

  updateSet(exIdx, setIdx, field, value) {
    const set = this.exercises[exIdx]?.sets[setIdx];
    if (!set) return;
    set[field] = value;
  }

  toggleSet(exIdx, setIdx) {
    const set = this.exercises[exIdx]?.sets[setIdx];
    if (!set) return;
    set.done = !set.done;
    this.emit('changed');
  }

  addSet(exIdx) {
    const sets = this.exercises[exIdx]?.sets;
    if (!sets) return;
    const last = sets[sets.length - 1];
    sets.push({
      num: sets.length + 1,
      weight: last?.weight || '',
      reps: last?.reps || '10',
      done: false,
    });
    this.emit('changed');
  }

  addExercise({ name, muscle }) {
    this.exercises.push({
      name, muscle,
      sets: [{ num: 1, weight: '', reps: '10', done: false }],
    });
    this.emit('changed');
  }

  /**
   * Build & persist a Workout from this session, then stop the timer.
   * @param {{ avgHR?:number, maxHR?:number, calBurned?:number }} extra
   */
  finish(extra = {}) {
    this.stop();
    const workout = new Workout({
      routineId: this.routine.id,
      routineName: this.routine.name,
      duration: this.seconds,
      avgHR: extra.avgHR ?? null,
      maxHR: extra.maxHR ?? null,
      calBurned: extra.calBurned ?? null,
      exercises: this.exercises.map((ex) => new LoggedExercise({
        name: ex.name, muscle: ex.muscle,
        sets: ex.sets
          .filter((s) => s.done)
          .map((s) => new LoggedSet({ weight: s.weight, reps: s.reps })),
      })),
    });
    this.workoutRepo.add(workout);
    this.emit('finished', workout);
    return workout;
  }
}
