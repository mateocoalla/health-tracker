import { todayISO } from '../core/dateUtils.js';

export class WeightEntry {
  constructor({ date, val, ts } = {}) {
    this.date = date || todayISO();
    this.val = Number(val);
    this.ts = ts || Date.now();
  }
  toJSON() { return { date: this.date, val: this.val, ts: this.ts }; }
  static fromJSON(o) { return new WeightEntry(o); }
}

export const MEASUREMENT_FIELDS = ['chest', 'waist', 'hips', 'bicep', 'thigh', 'calf'];
export const MEASUREMENT_LABELS = {
  chest: 'Chest', waist: 'Waist', hips: 'Hips',
  bicep: 'Bicep', thigh: 'Thigh', calf: 'Calf',
};

export class Measurement {
  constructor(o = {}) {
    this.date = o.date || todayISO();
    MEASUREMENT_FIELDS.forEach((f) => {
      if (o[f] != null && o[f] !== '') this[f] = Number(o[f]);
    });
  }
  hasAny() { return MEASUREMENT_FIELDS.some((f) => this[f] != null); }
  toJSON() {
    const o = { date: this.date };
    MEASUREMENT_FIELDS.forEach((f) => { if (this[f] != null) o[f] = this[f]; });
    return o;
  }
  static fromJSON(o) { return new Measurement(o); }
}

/**
 * RecoveryEntry — daily check-in for sleep / energy / soreness.
 * Values are strings (e.g. "Good", "High"); scoreMap converts to 1-4.
 */
export class RecoveryEntry {
  constructor({ date, sleep, energy, soreness } = {}) {
    this.date = date || todayISO();
    if (sleep)    this.sleep = sleep;
    if (energy)   this.energy = energy;
    if (soreness) this.soreness = soreness;
  }

  static SCORE_MAP = {
    Poor: 1, Fair: 2, Good: 3, Great: 4,
    Drained: 1, Low: 2, High: 4,
    Severe: 1, Moderate: 2, Mild: 3, None: 4,
  };

  averageScore() {
    const scores = [this.sleep, this.energy, this.soreness]
      .filter(Boolean)
      .map((v) => RecoveryEntry.SCORE_MAP[v] ?? 2);
    if (!scores.length) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  toJSON() {
    const o = { date: this.date };
    if (this.sleep)    o.sleep = this.sleep;
    if (this.energy)   o.energy = this.energy;
    if (this.soreness) o.soreness = this.soreness;
    return o;
  }
  static fromJSON(o) { return new RecoveryEntry(o); }
}
