import { Store } from './Store.js';
import { EventBus } from './EventBus.js';
import { $, esc } from './dom.js';
import { todayISO, weekdayName } from './dateUtils.js';

import {
  RoutineRepository, WorkoutRepository, MealRepository, RecipeRepository,
  WeightRepository, MeasurementRepository, RecoveryRepository,
  ExerciseRepository, SettingsRepository,
} from '../repositories/repositories.js';

import { Routine } from '../models/Routine.js';
import { Workout } from '../models/Workout.js';
import { Meal, Recipe } from '../models/Nutrition.js';
import { WeightEntry, Measurement, RecoveryEntry, MEASUREMENT_FIELDS } from '../models/Body.js';

import { WorkoutSession } from '../services/WorkoutSession.js';

import { Toast } from '../ui/components/Toast.js';
import { ModalManager } from '../ui/components/ModalManager.js';
import { Router } from '../ui/components/Router.js';

import { HomePage } from '../ui/pages/HomePage.js';
import { WorkoutPage } from '../ui/pages/WorkoutPage.js';
import { ActiveWorkoutPage } from '../ui/pages/ActiveWorkoutPage.js';
import { NutritionPage } from '../ui/pages/NutritionPage.js';
import { ProgressPage } from '../ui/pages/ProgressPage.js';

/**
 * @typedef {object} AppContext
 * @property {object} config
 * @property {EventBus} bus
 * @property {Store} store
 * @property {Toast} toast
 * @property {ModalManager} modals
 * @property {Router} router
 * @property {RoutineRepository} routines
 * @property {WorkoutRepository} workouts
 * @property {MealRepository} meals
 * @property {RecipeRepository} recipes
 * @property {WeightRepository} weights
 * @property {MeasurementRepository} measurements
 * @property {RecoveryRepository} recovery
 * @property {ExerciseRepository} exercises
 * @property {SettingsRepository} settings
 * @property {WorkoutSession|null} activeSession
 * @property {Flows} flows
 */

/**
 * App — composition root. Builds the shared context, wires events to
 * pages, registers the global inline-onclick handlers used by the HTML,
 * and kicks off the first render.
 */
export class App {
  constructor(config = { userName: 'Mateo' }) {
    this.config = config;
    this.bus = new EventBus();
    this.store = new Store('ht_');
    this.toast = new Toast($('#toast'));
    this.modals = new ModalManager();

    // Repositories.
    this.routines     = new RoutineRepository(this.store, this.bus);
    this.workouts     = new WorkoutRepository(this.store, this.bus);
    this.meals        = new MealRepository(this.store, this.bus);
    this.recipes      = new RecipeRepository(this.store, this.bus);
    this.weights      = new WeightRepository(this.store, this.bus);
    this.measurements = new MeasurementRepository(this.store, this.bus);
    this.recovery     = new RecoveryRepository(this.store, this.bus);
    this.exercises    = new ExerciseRepository(this.store, this.bus);
    this.settings     = new SettingsRepository(this.store, this.bus);

    /** @type {WorkoutSession|null} */
    this.activeSession = null;

    this.router = new Router({ getActiveSession: () => this.activeSession });

    // Flows hold inter-page actions and modal coordination.
    this.flows = new Flows(this);

    // Pages.
    this.pages = {
      home: new HomePage(this),
      workout: new WorkoutPage(this),
      active: new ActiveWorkoutPage(this),
      nutrition: new NutritionPage(this),
      progress: new ProgressPage(this),
    };
  }

  start() {
    // Pre-fill date on "Log past workout".
    const pastDate = $('#past-workout-date');
    if (pastDate) pastDate.valueAsDate = new Date();
    // Pre-fill weekly goal select.
    const wg = $('#weekly-goal-select');
    if (wg) wg.value = String(this.settings.weeklyGoal());
    // Pre-fill macro targets.
    const t = this.settings.targets();
    if ($('#t-kcal')) $('#t-kcal').placeholder = t.kcal;
    if ($('#t-prot')) $('#t-prot').placeholder = t.prot;
    if ($('#t-carb')) $('#t-carb').placeholder = t.carb;
    if ($('#t-fat'))  $('#t-fat').placeholder  = t.fat;

    // Mount pages.
    Object.values(this.pages).forEach((p) => p.mount());

    // Populate routine select inside "Log past workout" modal.
    this.bus.on('routines:changed', () => this._populatePastRoutineSelect());
    this._populatePastRoutineSelect();

    // Modal open hooks.
    this.modals.onOpen('modal-add-exercise', () => this.flows.refreshExerciseSearch());
    this.modals.onOpen('modal-set-targets', () => {
      const tt = this.settings.targets();
      $('#t-kcal').value = tt.kcal;
      $('#t-prot').value = tt.prot;
      $('#t-carb').value = tt.carb;
      $('#t-fat').value  = tt.fat;
    });

    this._exposeGlobalHandlers();
  }

  _populatePastRoutineSelect() {
    const sel = $('#past-routine-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select routine (optional) —</option>' +
      this.routines.all().map((r) =>
        `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');
  }

  /**
   * Inline `onclick="..."` attributes in index.html call these short
   * global names. Defining them here keeps the HTML untouched and
   * the wiring centralized.
   */
  _exposeGlobalHandlers() {
    const f = this.flows;
    Object.assign(window, {
      switchTab: (t) => this.router.switchTab(t),
      goToWorkout: () => f.goToWorkout(),
      openModal: (id) => this.modals.open(id),
      closeModal: (id) => this.modals.close(id),

      // Routine creation/editing.
      createRoutine: () => f.createRoutine(),
      saveEditRoutine: () => f.saveEditRoutine(),
      addExerciseFromEdit: () => f.openAddExerciseFromEdit(),
      removeEditExercise: (i) => f.removeEditExercise(i),
      moveEditExercise: (i, dir) => f.moveEditExercise(i, dir),
      updateEditExercise: (i, field, val) => f.updateEditExercise(i, field, val),
      confirmDeleteRoutine: () => f.commitDeleteRoutine(),

      // Workout flow.
      beginWorkout: () => f.beginWorkout(),
      finishWorkout: () => f.openFinishWorkout(),
      confirmFinishWorkout: (withData) => f.commitFinishWorkout(withData),
      savePastWorkout: () => f.savePastWorkout(),
      deleteWorkoutLog: () => f.deleteWorkoutLog(),

      // Goal.
      saveWeeklyGoal: () => f.saveWeeklyGoal(),

      // Exercise search.
      filterExercises: () => f.filterExerciseSearch(),
      pickExercise: (name, muscle) => f.pickExercise(name, muscle),
      addCustomExercise: () => f.addCustomExercise(),

      // Nutrition.
      logMeal: () => f.logMeal(),
      fillFromRecipe: () => f.fillFromRecipe(),
      saveRecipe: () => f.saveRecipe(),
      saveTargets: () => f.saveTargets(),

      // Body.
      logWeight: () => f.logWeight(),
      logMeasurement: () => f.logMeasurement(),

      // Recovery.
      selectRecovery: (type, val) => f.selectRecovery(type, val),
      saveRecovery: () => f.saveRecovery(),
    });
  }
}

// ============================================================================
// Flows — multi-step user actions that touch repositories + modals + toast.
// Keeping these out of pages lets pages stay focused on rendering.
// ============================================================================
class Flows {
  /** @param {App} app */
  constructor(app) {
    this.app = app;
    // Transient state used across handlers (modal-scoped).
    this._pendingRoutine = null;
    this._pendingDeleteRoutineId = null;
    this._editingRoutineId = null;
    this._addingToRoutineId = null;
    this._afterPickExercise = null;
    this._pendingLogId = null;
    this._recoverySelections = {};
  }

  // ---- Today / routine selection ------------------------------------------
  goToWorkout() {
    const a = this.app;
    if (a.activeSession) { a.router.switchTab('active'); return; }
    const r = a.routines.forWeekday(weekdayName());
    if (r) this._openStartWorkoutModal(r);
    else a.router.switchTab('workout');
  }

  startRoutine(id) {
    const r = this.app.routines.findById(id);
    if (r) this._openStartWorkoutModal(r);
  }

  _openStartWorkoutModal(routine) {
    this._pendingRoutine = routine;
    $('#start-workout-title').textContent = routine.name;
    $('#start-workout-desc').textContent =
      `${routine.exercises.length} exercises · ${routine.type}`;
    $('#start-workout-exercises').innerHTML = routine.exercises.map((e) => `
      <div class="exercise-item">
        <div class="exercise-dot"></div>
        <div class="exercise-info"><div class="exercise-name">${esc(e.name)}</div>
        <div class="exercise-detail">${e.sets} sets · ${esc(e.reps)} reps</div></div>
      </div>`).join('');
    this.app.modals.open('modal-start-workout');
  }

  beginWorkout() {
    const a = this.app;
    if (!this._pendingRoutine) return;
    const session = new WorkoutSession(this._pendingRoutine, a.workouts);
    a.activeSession = session;
    a.pages.active.attachSession(session);
    session.start();
    a.modals.close('modal-start-workout');
    a.router.switchTab('active');
    this._pendingRoutine = null;
  }

  openFinishWorkout() {
    ['finish-avg-hr', 'finish-max-hr', 'finish-calories']
      .forEach((id) => { const el = $('#' + id); if (el) el.value = ''; });
    this.app.modals.open('modal-finish-workout');
  }

  commitFinishWorkout(withData) {
    const a = this.app;
    if (!a.activeSession) return;
    const extra = withData ? {
      avgHR: parseInt($('#finish-avg-hr').value) || null,
      maxHR: parseInt($('#finish-max-hr').value) || null,
      calBurned: parseInt($('#finish-calories').value) || null,
    } : {};
    a.activeSession.finish(extra);
    a.activeSession = null;
    a.modals.close('modal-finish-workout');
    a.toast.show('Workout saved! 💪');
    a.router.switchTab('workout');
  }

  // ---- Routine create/edit/delete -----------------------------------------
  createRoutine() {
    const a = this.app;
    const name = $('#new-routine-name').value.trim();
    const type = $('#new-routine-type').value;
    if (!name) { a.toast.show('Enter a routine name'); return; }
    a.routines.add(new Routine({ name, type, exercises: [] }));
    a.modals.close('modal-new-routine');
    $('#new-routine-name').value = '';
    a.toast.show('Routine created');
  }

  confirmDeleteRoutine(id) {
    this._pendingDeleteRoutineId = id;
    const r = this.app.routines.findById(id);
    $('#delete-routine-name').textContent = r ? r.name : 'this routine';
    this.app.modals.open('modal-delete-routine');
  }

  commitDeleteRoutine() {
    const id = this._pendingDeleteRoutineId;
    if (!id) return;
    this.app.routines.removeById(id);
    this._pendingDeleteRoutineId = null;
    this.app.modals.close('modal-delete-routine');
    this.app.toast.show('Routine deleted');
  }

  openEditRoutine(id) {
    const r = this.app.routines.findById(id);
    if (!r) return;
    this._editingRoutineId = id;
    $('#edit-routine-name').value = r.name;
    $('#edit-routine-type').value = r.type;
    $('#edit-routine-day').value = r.day || '';
    this._renderEditExercises(r);
    this.app.modals.open('modal-edit-routine');
  }

  _renderEditExercises(r) {
    const list = $('#edit-exercises-list');
    if (!r.exercises.length) {
      list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">No exercises yet. Add one below.</div>`;
      return;
    }
    list.innerHTML = r.exercises.map((e, i) => `
      <div style="background:var(--bg3);border:0.5px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:14px;font-weight:600">${esc(e.name)}</div>
          <button onclick="removeEditExercise(${i})"
            style="background:var(--red-dim);border:0.5px solid rgba(255,90,90,0.2);border-radius:6px;cursor:pointer;color:var(--red);font-size:12px;padding:4px 10px">Remove</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:11px;color:var(--text2);margin-bottom:4px">Sets</div>
            <input type="number" value="${e.sets}" min="1" max="20"
              onchange="updateEditExercise(${i},'sets',parseInt(this.value)||1)"
              style="padding:8px 10px;font-size:14px;text-align:center">
          </div>
          <div>
            <div style="font-size:11px;color:var(--text2);margin-bottom:4px">Reps</div>
            <input type="text" value="${esc(e.reps)}" placeholder="8-12"
              onchange="updateEditExercise(${i},'reps',this.value)"
              style="padding:8px 10px;font-size:14px;text-align:center">
          </div>
          <div>
            <div style="font-size:11px;color:var(--text2);margin-bottom:4px">RIR</div>
            <input type="number" value="${e.rir !== undefined ? e.rir : ''}" min="0" max="5" placeholder="—"
              onchange="updateEditExercise(${i},'rir',this.value===''?undefined:parseInt(this.value))"
              style="padding:8px 10px;font-size:14px;text-align:center">
          </div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:4px">Note (optional)</div>
          <input type="text" value="${esc(e.note || '')}" placeholder="Cue, tempo, equipment…"
            onchange="updateEditExercise(${i},'note',this.value)"
            style="padding:8px 10px;font-size:13px">
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button onclick="moveEditExercise(${i},-1)" class="btn btn-ghost btn-sm" style="flex:1"
            ${i === 0 ? 'disabled' : ''}>↑</button>
          <button onclick="moveEditExercise(${i},1)" class="btn btn-ghost btn-sm" style="flex:1"
            ${i === r.exercises.length - 1 ? 'disabled' : ''}>↓</button>
        </div>
      </div>`).join('');
  }

  updateEditExercise(i, field, val) {
    const r = this.app.routines.findById(this._editingRoutineId);
    if (r) r.updateExerciseField(i, field, val);
  }

  removeEditExercise(i) {
    const r = this.app.routines.findById(this._editingRoutineId);
    if (!r) return;
    r.removeExerciseAt(i);
    this._renderEditExercises(r);
  }

  moveEditExercise(i, dir) {
    const r = this.app.routines.findById(this._editingRoutineId);
    if (!r) return;
    if (r.moveExercise(i, dir)) this._renderEditExercises(r);
  }

  saveEditRoutine() {
    const a = this.app;
    const r = a.routines.findById(this._editingRoutineId);
    if (!r) return;
    const name = $('#edit-routine-name').value.trim();
    if (!name) { a.toast.show('Enter a routine name'); return; }
    a.routines.update(this._editingRoutineId, (r) => {
      r.name = name;
      r.type = $('#edit-routine-type').value;
      r.day  = $('#edit-routine-day').value;
    });
    a.modals.close('modal-edit-routine');
    a.toast.show('Routine saved');
  }

  saveInlineExercise(routineId, ei, field, val) {
    this.app.routines.update(routineId, (r) => r.updateExerciseField(ei, field, val));
    // Live-update the badge without a full re-render.
    const badge = document.querySelector(`#rex-row-${routineId}-${ei} .exercise-badge`);
    if (badge) {
      const r = this.app.routines.findById(routineId);
      if (r?.exercises[ei]) badge.textContent = r.exercises[ei].sets + '×' + r.exercises[ei].reps;
    }
  }

  // ---- Exercise search ----------------------------------------------------
  openAddExerciseToRoutine(routineId) {
    this._addingToRoutineId = routineId;
    this._afterPickExercise = null;
    this.refreshExerciseSearch();
    this.app.modals.open('modal-add-exercise');
  }

  openAddExerciseFromEdit() {
    this._addingToRoutineId = this._editingRoutineId;
    this._afterPickExercise = () => {
      const r = this.app.routines.findById(this._editingRoutineId);
      if (r) this._renderEditExercises(r);
    };
    this.refreshExerciseSearch();
    this.app.modals.open('modal-add-exercise');
  }

  openAddExerciseInWorkout() {
    this._addingToRoutineId = null;
    this._afterPickExercise = null;
    this.refreshExerciseSearch();
    this.app.modals.open('modal-add-exercise');
  }

  filterExerciseSearch() {
    this.refreshExerciseSearch($('#exercise-search').value);
  }

  refreshExerciseSearch(query = '') {
    const groups = this.app.exercises.groupedByMuscle(query);
    const el = $('#exercise-search-list');
    el.innerHTML = Object.entries(groups).map(([muscle, list]) => `
      <div style="margin-bottom:8px">
        <div style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;padding:4px 0 6px">${esc(muscle)}</div>
        ${list.map((e) => `
          <div class="exercise-item" style="cursor:pointer;padding:10px 8px;border-radius:8px"
            onclick="pickExercise('${esc(e.name).replace(/'/g, "\\'")}','${esc(e.muscle)}')">
            <div class="exercise-dot"></div>
            <div class="exercise-name">${esc(e.name)}</div>
          </div>`).join('')}
      </div>`).join('');
  }

  pickExercise(name, muscle) {
    const a = this.app;
    if (this._addingToRoutineId) {
      a.routines.update(this._addingToRoutineId, (r) =>
        r.addExercise({ name, muscle, sets: 3, reps: '8-12', rir: 2 }));
      a.toast.show(`${name} added`);
      this._afterPickExercise?.();
      this._afterPickExercise = null;
      this._addingToRoutineId = null;
    } else if (a.activeSession) {
      a.activeSession.addExercise({ name, muscle });
    }
    a.modals.close('modal-add-exercise');
  }

  addCustomExercise() {
    const a = this.app;
    const name = $('#custom-ex-name').value.trim();
    const muscle = $('#custom-ex-muscle').value;
    if (!name) { a.toast.show('Enter a name'); return; }
    a.exercises.addCustom({ name, muscle });
    a.modals.close('modal-custom-exercise');
    $('#custom-ex-name').value = '';
    this.pickExercise(name, muscle);
  }

  // ---- Weekly goal --------------------------------------------------------
  saveWeeklyGoal() {
    const a = this.app;
    const v = parseInt($('#weekly-goal-select').value);
    a.settings.setWeeklyGoal(v);
    a.modals.close('modal-weekly-goal');
    a.toast.show(`Goal updated to ${v} days/week`);
  }

  // ---- Workout history detail --------------------------------------------
  viewWorkoutDetail(id) {
    const w = this.app.workouts.findById(id);
    if (!w) return;
    this._pendingLogId = id;
    const dur = w.durationMinutes() ? w.durationMinutes() + ' min' : '—';
    const setsCount = w.totalSets();
    $('#workout-detail-content').innerHTML = `
      <div class="modal-title">${esc(w.routineName)}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:16px">${esc(w.date)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
        <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:600;font-family:'DM Mono',monospace">${dur}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">duration</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:600;font-family:'DM Mono',monospace;color:var(--red)">${w.avgHR || '—'}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">avg HR</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:600;font-family:'DM Mono',monospace;color:var(--red)">${w.maxHR || '—'}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">max HR</div>
        </div>
      </div>
      ${w.calBurned ? `<div style="background:var(--orange-dim);border:0.5px solid rgba(255,154,60,0.2);border-radius:10px;padding:12px;text-align:center;margin-bottom:16px">
        <div style="font-size:22px;font-weight:600;font-family:'DM Mono',monospace;color:var(--orange)">${w.calBurned} kcal</div>
        <div style="font-size:12px;color:var(--text2)">burned</div>
      </div>` : ''}
      ${w.exercises.length ? `
        <div style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px">${setsCount} sets logged</div>
        ${w.exercises.map((e) => `
          <div class="exercise-item">
            <div class="exercise-dot"></div>
            <div class="exercise-info">
              <div class="exercise-name">${esc(e.name)}</div>
              <div class="exercise-detail">${e.sets.map((s) => `${s.weight}kg×${s.reps}`).join(' · ') || '—'}</div>
            </div>
          </div>`).join('')}
      ` : `<div style="color:var(--text3);font-size:13px">No sets recorded</div>`}
    `;
    this.app.modals.open('modal-workout-detail');
  }

  deleteWorkoutLog() {
    if (!this._pendingLogId) return;
    this.app.workouts.removeById(this._pendingLogId);
    this._pendingLogId = null;
    this.app.modals.close('modal-workout-detail');
    this.app.toast.show('Workout deleted');
  }

  // ---- Nutrition ----------------------------------------------------------
  logMeal() {
    const a = this.app;
    const name = $('#meal-name').value.trim();
    if (!name) { a.toast.show('Enter a meal name'); return; }
    a.meals.add(new Meal({
      name,
      kcal: parseFloat($('#meal-kcal').value) || 0,
      prot: parseFloat($('#meal-prot').value) || 0,
      carb: parseFloat($('#meal-carb').value) || 0,
      fat:  parseFloat($('#meal-fat').value)  || 0,
    }));
    ['meal-name', 'meal-kcal', 'meal-prot', 'meal-carb', 'meal-fat']
      .forEach((id) => { $('#' + id).value = ''; });
    a.modals.close('modal-add-meal');
    a.toast.show('Meal logged');
  }

  fillFromRecipe() {
    const id = $('#meal-recipe-select').value;
    if (!id) return;
    const r = this.app.recipes.findById(id);
    if (!r) return;
    $('#meal-name').value = r.name;
    $('#meal-kcal').value = r.kcal;
    $('#meal-prot').value = r.prot;
    $('#meal-carb').value = r.carb;
    $('#meal-fat').value  = r.fat;
  }

  quickLogRecipe(id) {
    const r = this.app.recipes.findById(id);
    if (!r) return;
    this.app.meals.add(r.toMeal());
    this.app.toast.show(`${r.name} logged`);
  }

  saveRecipe() {
    const a = this.app;
    const name = $('#recipe-name').value.trim();
    if (!name) { a.toast.show('Enter a recipe name'); return; }
    a.recipes.add(new Recipe({
      name,
      kcal: parseFloat($('#recipe-kcal').value) || 0,
      prot: parseFloat($('#recipe-prot').value) || 0,
      carb: parseFloat($('#recipe-carb').value) || 0,
      fat:  parseFloat($('#recipe-fat').value)  || 0,
      notes: $('#recipe-notes').value,
    }));
    ['recipe-name', 'recipe-kcal', 'recipe-prot', 'recipe-carb', 'recipe-fat', 'recipe-notes']
      .forEach((id) => { $('#' + id).value = ''; });
    a.modals.close('modal-new-recipe');
    a.toast.show('Recipe saved');
  }

  saveTargets() {
    const a = this.app;
    a.settings.setTargets({
      kcal: parseFloat($('#t-kcal').value) || 2800,
      prot: parseFloat($('#t-prot').value) || 175,
      carb: parseFloat($('#t-carb').value) || 310,
      fat:  parseFloat($('#t-fat').value)  || 80,
    });
    a.modals.close('modal-set-targets');
    a.toast.show('Targets updated');
  }

  // ---- Body --------------------------------------------------------------
  logWeight() {
    const a = this.app;
    const v = parseFloat($('#weight-val').value);
    if (!v || v < 30) { a.toast.show('Enter a valid weight'); return; }
    a.weights.add(new WeightEntry({ val: v }));
    $('#weight-val').value = '';
    a.modals.close('modal-log-weight');
    a.toast.show('Weight logged');
  }

  logMeasurement() {
    const a = this.app;
    const raw = {};
    MEASUREMENT_FIELDS.forEach((f) => {
      const v = parseFloat($('#m-' + f).value);
      if (v) raw[f] = v;
    });
    const m = new Measurement(raw);
    if (!m.hasAny()) { a.toast.show('Enter at least one measurement'); return; }
    a.measurements.add(m);
    MEASUREMENT_FIELDS.forEach((f) => { $('#m-' + f).value = ''; });
    a.modals.close('modal-log-measurement');
    a.toast.show('Measurements saved');
  }

  // ---- Recovery -----------------------------------------------------------
  selectRecovery(type, val) {
    this._recoverySelections[type] = val;
    document.querySelectorAll(`#recovery-${type} .recovery-tile`).forEach((t) => {
      t.classList.toggle('selected', t.dataset.val === val);
    });
  }

  saveRecovery() {
    const a = this.app;
    if (!Object.keys(this._recoverySelections).length) {
      a.toast.show('Select at least one metric'); return;
    }
    a.recovery.add(new RecoveryEntry(this._recoverySelections));
    this._recoverySelections = {};
    document.querySelectorAll('.recovery-tile').forEach((t) => t.classList.remove('selected'));
    a.modals.close('modal-log-recovery');
    a.toast.show('Recovery logged');
  }

  // ---- Past workout (manual entry) ----------------------------------------
  savePastWorkout() {
    const a = this.app;
    const routineId = $('#past-routine-select').value;
    const date = $('#past-workout-date').value;
    if (!date) { a.toast.show('Select a date'); return; }
    const duration = (parseInt($('#past-duration').value) || 0) * 60;
    const r = routineId ? a.routines.findById(routineId) : null;
    a.workouts.add(new Workout({
      date, routineId: routineId || null,
      routineName: r ? r.name : 'Manual entry',
      duration,
      avgHR: parseInt($('#past-avg-hr').value) || null,
      maxHR: parseInt($('#past-max-hr').value) || null,
      calBurned: parseInt($('#past-calories').value) || null,
      exercises: [],
    }));
    a.modals.close('modal-log-past-workout');
    ['past-duration', 'past-avg-hr', 'past-max-hr', 'past-calories']
      .forEach((id) => { $('#' + id).value = ''; });
    a.toast.show('Workout logged');
  }
}
