import { Page } from './Page.js';
import { $, esc } from '../../core/dom.js';
import { greeting, weekdayName, todayISO } from '../../core/dateUtils.js';
import { sumMacros, StreakCalculator } from '../../services/calculators.js';

/**
 * HomePage — top dashboard: greeting, today's workout pill, macro
 * summary, week + streak + recovery cards, recent meals teaser.
 *
 * Pure read view: any user action delegates to other pages/modals via
 * the shared context.
 */
export class HomePage extends Page {
  mount() {
    const { bus } = this.ctx;
    // Greeting + date are static for this session.
    const now = new Date();
    $('#home-greeting').textContent = `${greeting(now)}, ${this.ctx.config.userName}`;
    $('#home-date').textContent = now.toLocaleDateString('en-GB',
      { weekday: 'long', day: 'numeric', month: 'long' });
    $('#nut-date').textContent = now.toLocaleDateString('en-GB',
      { day: 'numeric', month: 'long' });

    // Re-render whenever any of the relevant repos change.
    ['meals:changed', 'targets:changed', 'weights:changed',
     'workouts:changed', 'recovery:changed', 'weeklyGoal:changed',
     'routines:changed'].forEach((e) => bus.on(e, () => this.render()));

    this.render();
  }

  render() {
    this._renderTodayPill();
    this._renderMacros();
    this._renderWeight();
    this._renderWeekly();
    this._renderStreak();
    this._renderRecovery();
    this._renderRecentMeals();
  }

  _renderTodayPill() {
    const { routines } = this.ctx;
    const r = routines.forWeekday(weekdayName());
    if (r) {
      $('#today-workout-title').textContent = r.name;
      $('#today-workout-sub').textContent = `${r.exercises.length} exercises · Tap to start`;
    } else {
      $('#today-workout-title').textContent = 'Rest Day';
      $('#today-workout-sub').textContent = 'No workout scheduled today';
    }
  }

  _renderMacros() {
    const { meals, settings } = this.ctx;
    const totals = sumMacros(meals.forDate(todayISO()));
    const t = settings.targets();
    const pct = t.percentOf(totals);
    $('#dash-kcal').textContent = Math.round(totals.kcal);
    $('#dash-prot').textContent = Math.round(totals.prot);
    $('#dash-carb').textContent = Math.round(totals.carb);
    $('#dash-fat').textContent  = Math.round(totals.fat);
    $('#bar-kcal').style.width = pct.kcal + '%';
    $('#bar-prot').style.width = pct.prot + '%';
    $('#bar-carb').style.width = pct.carb + '%';
    $('#bar-fat').style.width  = pct.fat  + '%';
  }

  _renderWeight() {
    const { weights } = this.ctx;
    const latest = weights.latest();
    const prev = weights.previousToLast();
    if (!latest) return;
    $('#dash-weight').textContent = latest.val.toFixed(1);
    if (prev) {
      const d = latest.val - prev.val;
      $('#dash-weight-delta').textContent =
        `${d >= 0 ? '+' : ''}${d.toFixed(1)} kg from last`;
    }
  }

  _renderWeekly() {
    const { workouts, settings } = this.ctx;
    const ws = workouts.countThisWeek();
    const goal = settings.weeklyGoal();
    $('#dash-workouts').textContent = ws;
    $('#dash-weekly-goal-label').textContent = '/' + goal;
    $('#bar-workouts').style.width =
      Math.min(100, Math.round((ws / goal) * 100)) + '%';
  }

  _renderStreak() {
    $('#dash-streak').textContent = StreakCalculator.compute(this.ctx.workouts);
  }

  _renderRecovery() {
    const todayRec = this.ctx.recovery.forDate(todayISO());
    if (todayRec) {
      $('#dash-recovery').textContent = todayRec.averageScore().toFixed(1) + '/4';
      $('#dash-recovery-sub').textContent = 'Logged today';
    } else {
      $('#dash-recovery').textContent = '—';
      $('#dash-recovery-sub').textContent = 'Not logged today';
    }
  }

  _renderRecentMeals() {
    const meals = this.ctx.meals.forDate(todayISO());
    const el = $('#recent-meals-list');
    if (!el) return;
    if (!meals.length) {
      el.innerHTML = `<div class="empty-state"><p>No meals logged today</p></div>`;
      return;
    }
    el.innerHTML = meals.map((m) => `
      <div class="log-entry">
        <div class="log-icon" style="background:var(--accent-dim)"></div>
        <div class="log-info">
          <div class="log-name">${esc(m.name)}</div>
          <div class="log-detail">${esc(m.time)} · P:${m.prot}g C:${m.carb}g F:${m.fat}g</div>
        </div>
        <div class="log-cals">${Math.round(m.kcal)}</div>
      </div>`).join('');
  }
}
