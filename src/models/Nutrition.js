import { todayISO, formatTime } from '../core/dateUtils.js';

/**
 * Macros — shared shape for a kcal / protein / carbs / fat tuple.
 * Used by Meal, Recipe, MacroTargets and totals.
 */
export class Macros {
  constructor(o) {
    const { kcal = 0, prot = 0, carb = 0, fat = 0 } = o || {};
    this.kcal = Number(kcal) || 0;
    this.prot = Number(prot) || 0;
    this.carb = Number(carb) || 0;
    this.fat  = Number(fat)  || 0;
  }
  add(other) {
    this.kcal += other.kcal; this.prot += other.prot;
    this.carb += other.carb; this.fat  += other.fat;
    return this;
  }
  toJSON() { return { kcal: this.kcal, prot: this.prot, carb: this.carb, fat: this.fat }; }
}

export class Meal {
  constructor({ id, date, name, kcal, prot, carb, fat, time } = {}) {
    this.id = id || Date.now();
    this.date = date || todayISO();
    this.name = name || '';
    Object.assign(this, new Macros({ kcal, prot, carb, fat }));
    this.time = time || formatTime();
  }
  macros() { return new Macros(this); }
  toJSON() {
    return {
      id: this.id, date: this.date, name: this.name, time: this.time,
      kcal: this.kcal, prot: this.prot, carb: this.carb, fat: this.fat,
    };
  }
  static fromJSON(o) { return new Meal(o); }
}

export class Recipe {
  constructor({ id, name, kcal, prot, carb, fat, notes = '' } = {}) {
    this.id = id || Date.now();
    this.name = name || '';
    Object.assign(this, new Macros({ kcal, prot, carb, fat }));
    this.notes = notes;
  }
  /** Create a Meal entry from this recipe, logged "now". */
  toMeal() {
    return new Meal({
      name: this.name,
      kcal: this.kcal, prot: this.prot, carb: this.carb, fat: this.fat,
    });
  }
  toJSON() {
    return {
      id: this.id, name: this.name, notes: this.notes,
      kcal: this.kcal, prot: this.prot, carb: this.carb, fat: this.fat,
    };
  }
  static fromJSON(o) { return new Recipe(o); }
}

export class MacroTargets extends Macros {
  constructor(o) {
    super(o || { kcal: 2800, prot: 175, carb: 310, fat: 80 });
  }
  /** Percentage (0-100) of `consumed` against this target, capped at 100. */
  percentOf(consumed) {
    const p = (v, max) => Math.min(100, Math.round((v / max) * 100));
    return {
      kcal: p(consumed.kcal, this.kcal),
      prot: p(consumed.prot, this.prot),
      carb: p(consumed.carb, this.carb),
      fat:  p(consumed.fat,  this.fat),
    };
  }
}
