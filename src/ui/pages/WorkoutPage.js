import { Page } from './Page.js';
import { $, esc } from '../../core/dom.js';

/**
 * WorkoutPage — routine list (with inline exercise editor) +
 * collapsible workout history. Heavy handler surface area, so this is
 * the largest page module.
 */
export class WorkoutPage extends Page {
  mount() {
    const { bus } = this.ctx;
    bus.on('routines:changed', () => this.render());
    bus.on('workouts:changed', () => this.render());

    // Expose handlers used by inline HTML onclicks rendered below.
    Object.assign(window, {
      htToggleRoutine: (id) => $(`#rb-${id}`)?.classList.toggle('open'),
      htStartRoutine: (id) => this.ctx.flows.startRoutine(id),
      htOpenEditRoutine: (id) => this.ctx.flows.openEditRoutine(id),
      htDeleteRoutine: (id) => this.ctx.flows.confirmDeleteRoutine(id),
      htToggleExerciseEdit: (rid, ei) => this._toggleExEdit(rid, ei),
      htCloseExerciseEdit: () => this.render(),
      htSaveInlineExercise: (rid, ei, field, val) =>
        this.ctx.flows.saveInlineExercise(rid, ei, field, val),
      htAddExerciseToRoutine: (rid) => this.ctx.flows.openAddExerciseToRoutine(rid),
      htViewWorkoutDetail: (id) => this.ctx.flows.viewWorkoutDetail(id),
    });

    this.render();
  }

  render() {
    this._renderRoutines();
    this._renderHistory();
  }

  _renderRoutines() {
    const el = $('#routines-list');
    const list = this.ctx.routines.all();
    if (!list.length) {
      el.innerHTML = `<div class="card"><div class="empty-state"><p>No routines yet. Create one!</p></div></div>`;
      return;
    }
    el.innerHTML = list.map((r) => `
      <div class="routine-card" id="rc-${esc(r.id)}">
        <div class="routine-header" onclick="htToggleRoutine('${esc(r.id)}')">
          <div>
            <div class="routine-title">${esc(r.name)}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:2px">
              ${esc(r.day || '')} · ${r.exercises.length} exercises
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="routine-tag">${esc(r.type)}</span>
            <button class="btn btn-primary btn-sm"
              onclick="event.stopPropagation();htStartRoutine('${esc(r.id)}')">Start</button>
            <button onclick="event.stopPropagation();htOpenEditRoutine('${esc(r.id)}')"
              style="background:var(--bg3);border:0.5px solid var(--border2);border-radius:8px;cursor:pointer;padding:7px 9px;color:var(--text2);display:flex;align-items:center" title="Edit routine">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="event.stopPropagation();htDeleteRoutine('${esc(r.id)}')"
              style="background:var(--red-dim);border:0.5px solid rgba(255,90,90,0.2);border-radius:8px;cursor:pointer;padding:7px 9px;color:var(--red);display:flex;align-items:center" title="Delete routine">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="15" height="15"><polyline stroke-linecap="round" stroke-linejoin="round" points="3 6 5 6 21 6"/><path stroke-linecap="round" stroke-linejoin="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
        <div class="routine-body" id="rb-${esc(r.id)}">
          ${r.exercises.map((e, ei) => this._renderRoutineExercise(r, ei, e)).join('')}
          <button class="btn btn-ghost btn-sm btn-full" style="margin-top:4px"
            onclick="htAddExerciseToRoutine('${esc(r.id)}')">+ Exercise</button>
        </div>
      </div>`).join('');
  }

  _renderRoutineExercise(r, ei, e) {
    return `
      <div id="rex-${esc(r.id)}-${ei}">
        <div class="exercise-item" id="rex-row-${esc(r.id)}-${ei}"
          onclick="htToggleExerciseEdit('${esc(r.id)}',${ei})" style="cursor:pointer">
          <div class="exercise-dot"></div>
          <div class="exercise-info">
            <div class="exercise-name">${esc(e.name)}</div>
            <div class="exercise-detail">${e.sets}×${esc(e.reps)}${e.rir !== undefined ? ' · RIR ' + e.rir : ''}</div>
            ${e.note ? `<div class="exercise-detail" style="color:var(--text3);font-style:italic">${esc(e.note)}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="exercise-badge">${e.sets}×${esc(e.reps)}</div>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" style="color:var(--text3);flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </div>
        </div>
        <div id="rex-edit-${esc(r.id)}-${ei}" style="display:none;background:var(--bg3);border-radius:10px;padding:12px 14px;margin:4px 0 8px">
          <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:10px">${esc(e.name)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
            <div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Sets</div>
              <input type="number" value="${e.sets}" min="1" max="20" step="1"
                onchange="htSaveInlineExercise('${esc(r.id)}',${ei},'sets',parseInt(this.value)||1)"
                style="padding:8px;font-size:15px;font-weight:600;text-align:center;font-family:'DM Mono',monospace">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Reps</div>
              <input type="text" value="${esc(e.reps)}" placeholder="8-12"
                onchange="htSaveInlineExercise('${esc(r.id)}',${ei},'reps',this.value)"
                style="padding:8px;font-size:15px;font-weight:600;text-align:center;font-family:'DM Mono',monospace">
            </div>
            <div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:4px">RIR</div>
              <input type="number" value="${e.rir !== undefined ? e.rir : ''}" min="0" max="5" placeholder="—"
                onchange="htSaveInlineExercise('${esc(r.id)}',${ei},'rir',this.value===''?undefined:parseInt(this.value))"
                style="padding:8px;font-size:15px;font-weight:600;text-align:center;font-family:'DM Mono',monospace">
            </div>
          </div>
          <div style="margin-bottom:8px">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Note</div>
            <input type="text" value="${esc(e.note || '')}" placeholder="Cue, tempo…"
              onchange="htSaveInlineExercise('${esc(r.id)}',${ei},'note',this.value)"
              style="padding:8px 10px;font-size:13px">
          </div>
          <button class="btn btn-ghost btn-sm btn-full" onclick="htCloseExerciseEdit()">Done</button>
        </div>
      </div>`;
  }

  _toggleExEdit(rid, ei) {
    const panel = $(`#rex-edit-${rid}-${ei}`);
    const row = $(`#rex-row-${rid}-${ei}`);
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    row.style.display = open ? 'flex' : 'none';
  }

  _renderHistory() {
    const el = $('#workout-history-list');
    const log = this.ctx.workouts.recent(20);
    if (!log.length) {
      el.innerHTML = `<div class="card" style="margin:0 16px 12px"><div class="empty-state"><p>No workouts logged yet</p></div></div>`;
      return;
    }
    el.innerHTML = log.map((w) => {
      const dur = w.durationMinutes() ? w.durationMinutes() + 'min' : '—';
      const hrInfo = w.avgHR ? `♥ ${w.avgHR} avg` : '';
      const calInfo = w.calBurned ? `· ${w.calBurned} kcal` : '';
      return `
        <div class="card" style="margin:0 16px 10px;cursor:pointer"
          onclick="htViewWorkoutDetail('${w.id}')">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:14px;font-weight:600">${esc(w.routineName)}</div>
              <div style="font-size:12px;color:var(--text2);margin-top:3px">${esc(w.date)} · ${dur}</div>
              ${hrInfo || calInfo ? `<div style="font-size:12px;margin-top:3px;display:flex;gap:8px">
                ${hrInfo ? `<span style="color:var(--red)">${hrInfo}</span>` : ''}
                ${calInfo ? `<span style="color:var(--orange)">${calInfo}</span>` : ''}
              </div>` : ''}
            </div>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" style="color:var(--text3)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>`;
    }).join('');
  }
}
