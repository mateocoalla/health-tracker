import { Macros } from '../models/Nutrition.js';
import { todayISO } from '../core/dateUtils.js';

/**
 * Compute totals for a list of meals.
 */
export function sumMacros(meals) {
  const total = new Macros();
  meals.forEach((m) => total.add(m.macros ? m.macros() : m));
  return total;
}

/**
 * StreakCalculator — consecutive days (ending today or yesterday) with
 * at least one logged workout. Matches the original semantics:
 * the streak survives a "today: 0 / yesterday: ≥1" gap but breaks once
 * any non-first day is empty.
 */
export class StreakCalculator {
  static compute(workoutRepo, now = new Date()) {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = todayISO(d);
      if (workoutRepo.hasOnDate(ds)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
}

/**
 * PRCalculator — best estimated 1RM per exercise across all logged
 * workouts. Returns { exerciseName -> { weight, reps, est, date } }.
 */
export class PRCalculator {
  static compute(workoutRepo) {
    const prs = {};
    workoutRepo.all().forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          if (!s.weight || !s.reps) return;
          const est = s.estimated1RM();
          if (!prs[ex.name] || est > prs[ex.name].est) {
            prs[ex.name] = { weight: s.weight, reps: s.reps, est, date: w.date };
          }
        });
      });
    });
    return prs;
  }
}
