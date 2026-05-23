import { Page } from './Page.js';
import { $, esc } from '../../core/dom.js';
import { formatDuration } from '../../core/dateUtils.js';

/**
 * ActiveWorkoutPage — renders the in-progress WorkoutSession.
 * Listens to the session's own EventBus (tick/changed/finished) and
 * re-paints on each event.
 */
export class ActiveWorkoutPage extends Page {
  mount() {
    Object.assign(window, {
      htToggleExBlock: (i) => {
        const el = $(`#exblock-${i}`);
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
      },
      htUpdateSet: (ei, si, field, val) =>
        this.ctx.activeSession?.updateSet(ei, si, field, val),
      htToggleSet: (ei, si) => this.ctx.activeSession?.toggleSet(ei, si),
      htAddSet: (ei) => this.ctx.activeSession?.addSet(ei),
      htFinishWorkout: () => this.ctx.flows.openFinishWorkout(),
      htOpenAddExerciseInWorkout: () => this.ctx.flows.openAddExerciseInWorkout(),
    });
  }

  /** Called by App when a new WorkoutSession starts. */
  attachSession(session) {
    this._session = session;
    $('#active-routine-name').textContent = session.routine.name;
    session.on('tick', (s) => { $('#workout-timer').textContent = formatDuration(s); });
    session.on('changed', () => this.render());
    this.render();
  }

  render() {
    const session = this._session;
    if (!session) return;
    const el = $('#active-exercises-list');
    el.innerHTML = session.exercises.map((ex, ei) => `
      <div class="workout-exercise-header" onclick="htToggleExBlock(${ei})">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:15px;font-weight:600">${esc(ex.name)}</div>
          <div style="font-size:12px;color:var(--text2)">${esc(ex.muscle || '')}</div>
        </div>
      </div>
      <div id="exblock-${ei}" style="padding:0 16px 12px">
        <div style="display:grid;grid-template-columns:28px 1fr 1fr auto;gap:8px;margin-bottom:6px;padding:0 4px">
          <div style="font-size:11px;color:var(--text3);text-align:center">Set</div>
          <div style="font-size:11px;color:var(--text3);text-align:center">kg</div>
          <div style="font-size:11px;color:var(--text3);text-align:center">Reps</div>
          <div style="width:34px"></div>
        </div>
        ${ex.sets.map((s, si) => `
          <div class="set-row">
            <div class="set-num">${s.num}</div>
            <input type="number" class="set-input" placeholder="kg" value="${esc(s.weight)}" min="0" step="2.5"
              onchange="htUpdateSet(${ei},${si},'weight',this.value)">
            <input type="number" class="set-input" value="${esc(s.reps)}" min="0"
              onchange="htUpdateSet(${ei},${si},'reps',this.value)">
            <div class="set-check ${s.done ? 'done' : ''}" onclick="htToggleSet(${ei},${si})">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>`).join('')}
        <button class="btn btn-ghost btn-sm" style="margin-top:4px" onclick="htAddSet(${ei})">+ Set</button>
      </div>`).join('');
  }
}
