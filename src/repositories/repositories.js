import { BaseRepository } from './BaseRepository.js';
import { Routine } from '../models/Routine.js';
import { Workout } from '../models/Workout.js';
import { Meal, Recipe, MacroTargets } from '../models/Nutrition.js';
import { WeightEntry, Measurement, RecoveryEntry } from '../models/Body.js';
import { Exercise } from '../models/Exercise.js';
import { DEFAULT_ROUTINES, DEFAULT_EXERCISES } from '../data/defaults.js';
import { todayISO, startOfWeek } from '../core/dateUtils.js';

export class RoutineRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'routines', eventName: 'routines',
      revive: Routine.fromJSON,
      seed: DEFAULT_ROUTINES,
    });
  }
  forWeekday(weekdayName) {
    return this._items.find((r) => r.day === weekdayName) || null;
  }
}

export class WorkoutRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'workoutLog', eventName: 'workouts',
      revive: Workout.fromJSON,
    });
  }
  recent(n = 20) {
    return [...this._items].reverse().slice(0, n);
  }
  countThisWeek(now = new Date()) {
    const ws = startOfWeek(now);
    return this._items.filter((w) => new Date(w.date) >= ws).length;
  }
  hasOnDate(dateISO) {
    return this._items.some((w) => w.date === dateISO);
  }
}

export class MealRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'meals', eventName: 'meals',
      revive: Meal.fromJSON,
    });
  }
  forDate(dateISO = todayISO()) {
    return this._items.filter((m) => m.date === dateISO);
  }
}

export class RecipeRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'recipes', eventName: 'recipes',
      revive: Recipe.fromJSON,
    });
  }
}

export class WeightRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'weights', eventName: 'weights',
      revive: WeightEntry.fromJSON,
    });
  }
  latest() { return this._items[this._items.length - 1] || null; }
  previousToLast() {
    return this._items.length >= 2 ? this._items[this._items.length - 2] : null;
  }
  lastN(n = 14) { return this._items.slice(-n); }
}

export class MeasurementRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'measurements', eventName: 'measurements',
      revive: Measurement.fromJSON,
    });
  }
  latest() { return this._items[this._items.length - 1] || null; }
  previousToLast() {
    return this._items.length >= 2 ? this._items[this._items.length - 2] : null;
  }
}

export class RecoveryRepository extends BaseRepository {
  constructor(store, bus) {
    super({
      store, bus,
      key: 'recovery', eventName: 'recovery',
      revive: RecoveryEntry.fromJSON,
    });
  }
  forDate(dateISO = todayISO()) {
    return this._items.find((r) => r.date === dateISO) || null;
  }
  recent(n = 7) {
    return this._items.slice(-n).reverse();
  }
}

/**
 * ExerciseRepository — keeps the custom-exercise list and merges it
 * with DEFAULT_EXERCISES on read. Custom exercises are persisted alone
 * so app updates can ship new defaults without losing user entries.
 */
export class ExerciseRepository {
  constructor(store, bus) {
    this.store = store;
    this.bus = bus;
    this._custom = (store.get('exercises', null) || []).map(Exercise.fromJSON);
  }
  all() {
    return [
      ...DEFAULT_EXERCISES.map(Exercise.fromJSON),
      ...this._custom,
    ];
  }
  search(query = '') {
    const q = query.trim().toLowerCase();
    if (!q) return this.all();
    return this.all().filter((e) => e.name.toLowerCase().includes(q));
  }
  /** Group by muscle group, preserving discovery order. */
  groupedByMuscle(query = '') {
    const groups = {};
    this.search(query).forEach((e) => {
      (groups[e.muscle] ||= []).push(e);
    });
    return groups;
  }
  addCustom(exercise) {
    this._custom.push(exercise instanceof Exercise ? exercise : new Exercise(exercise));
    this.store.set('exercises', this._custom.map((e) => e.toJSON()));
    this.bus.emit('exercises:changed');
  }
}

/**
 * SettingsRepository — singleton-ish values: macro targets, weekly goal.
 */
export class SettingsRepository {
  constructor(store, bus) {
    this.store = store;
    this.bus = bus;
    this._targets = new MacroTargets(store.get('targets', undefined));
    this._weeklyGoal = store.get('weeklyGoal', 4);
  }
  targets() { return this._targets; }
  setTargets(o) {
    this._targets = new MacroTargets(o);
    this.store.set('targets', this._targets.toJSON());
    this.bus.emit('targets:changed');
  }
  weeklyGoal() { return this._weeklyGoal; }
  setWeeklyGoal(n) {
    this._weeklyGoal = Number(n) || 4;
    this.store.set('weeklyGoal', this._weeklyGoal);
    this.bus.emit('weeklyGoal:changed');
  }
}
