import { Page } from './Page.js';
import { $, esc } from '../../core/dom.js';
import { WeightChart } from '../components/WeightChart.js';
import { PRCalculator } from '../../services/calculators.js';
import { MEASUREMENT_LABELS } from '../../models/Body.js';

/**
 * ProgressPage — body weight chart + summary, measurements, exercise
 * PRs (estimated 1RM), recovery log of the last 7 days.
 */
export class ProgressPage extends Page {
  mount() {
    this._chart = new WeightChart($('#weight-chart'));
    const { bus } = this.ctx;
    ['weights:changed', 'measurements:changed',
     'recovery:changed', 'workouts:changed']
      .forEach((e) => bus.on(e, () => this.render()));
    this.render();
  }

  render() {
    this._renderWeight();
    this._renderMeasurements();
    this._renderPRs();
    this._renderRecovery();
  }

  _renderWeight() {
    const data = this.ctx.weights.lastN(14);
    const el = $('#prog-weight');
    const avgEl = $('#prog-avg');
    const deltaEl = $('#prog-delta');
    if (!data.length) {
      el.textContent = '—'; avgEl.textContent = '—'; deltaEl.textContent = '—';
      return;
    }
    const vals = data.map((d) => d.val);
    const latest = vals[vals.length - 1];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    el.textContent = latest.toFixed(1) + ' kg';
    avgEl.textContent = avg.toFixed(1) + ' kg';
    if (vals.length >= 2) {
      const delta = latest - vals[0];
      deltaEl.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' kg';
      deltaEl.style.color = delta <= 0 ? 'var(--accent)' : 'var(--orange)';
    }
    this._chart.render(vals);
  }

  _renderMeasurements() {
    const el = $('#measurements-list');
    const latest = this.ctx.measurements.latest();
    const prev = this.ctx.measurements.previousToLast();
    if (!latest) {
      el.innerHTML = `<div class="empty-state"><p>No measurements logged</p></div>`;
      return;
    }
    el.innerHTML = `<div style="font-size:11px;color:var(--text2);margin-bottom:10px">${esc(latest.date)}</div>` +
      Object.entries(MEASUREMENT_LABELS)
        .filter(([k]) => latest[k] != null)
        .map(([k, lbl]) => {
          const delta = prev?.[k] != null ? (latest[k] - prev[k]).toFixed(1) : null;
          return `<div class="metric-row">
            <div class="metric-label">${lbl}</div>
            <div style="display:flex;align-items:center;gap:8px">
              ${delta != null ? `<div style="font-size:12px;color:${parseFloat(delta) <= 0 ? 'var(--accent)' : 'var(--orange)'}">${parseFloat(delta) > 0 ? '+' : ''}${delta}</div>` : ''}
              <div class="metric-val">${latest[k]} cm</div>
            </div>
          </div>`;
        }).join('');
  }

  _renderPRs() {
    const el = $('#pr-list');
    const prs = PRCalculator.compute(this.ctx.workouts);
    const entries = Object.entries(prs);
    if (!entries.length) {
      el.innerHTML = `<div class="empty-state"><p>Complete workouts to see PRs</p></div>`;
      return;
    }
    el.innerHTML = entries.map(([name, pr]) => `
      <div class="exercise-item">
        <div class="exercise-dot"></div>
        <div class="exercise-info">
          <div class="exercise-name">${esc(name)}</div>
          <div class="exercise-detail">${esc(pr.date)} · ${pr.weight}kg × ${pr.reps} reps</div>
        </div>
        <div class="exercise-badge">~${Math.round(pr.est)}kg</div>
      </div>`).join('');
  }

  _renderRecovery() {
    const el = $('#recovery-list');
    const recent = this.ctx.recovery.recent(7);
    if (!recent.length) {
      el.innerHTML = `<div class="empty-state"><p>No recovery entries yet</p></div>`;
      return;
    }
    el.innerHTML = recent.map((r) => {
      const avg = r.averageScore() ?? 2;
      const col = avg >= 3.5 ? 'var(--accent)'
                : avg >= 2.5 ? 'var(--orange)'
                : 'var(--red)';
      return `<div class="metric-row">
        <div>
          <div class="metric-label">${esc(r.date)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">
            ${r.sleep ? 'Sleep: ' + esc(r.sleep) : ''}
            ${r.energy ? '· Energy: ' + esc(r.energy) : ''}
            ${r.soreness ? '· Soreness: ' + esc(r.soreness) : ''}
          </div>
        </div>
        <div style="font-size:20px;font-weight:600;color:${col}">${avg.toFixed(1)}</div>
      </div>`;
    }).join('');
  }
}
