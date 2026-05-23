import { Page } from './Page.js';
import { $, esc } from '../../core/dom.js';
import { todayISO } from '../../core/dateUtils.js';
import { sumMacros } from '../../services/calculators.js';

/**
 * NutritionPage — daily targets bar, today's meal log, saved recipes.
 */
export class NutritionPage extends Page {
  mount() {
    const { bus } = this.ctx;
    ['meals:changed', 'recipes:changed', 'targets:changed']
      .forEach((e) => bus.on(e, () => this.render()));

    Object.assign(window, {
      htDeleteMeal: (id) => this.ctx.meals.removeById(id),
      htDeleteRecipe: (id) => this.ctx.recipes.removeById(id),
      htQuickLogRecipe: (id) => this.ctx.flows.quickLogRecipe(id),
    });

    this.render();
  }

  render() {
    this._renderTargets();
    this._renderMeals();
    this._renderRecipes();
  }

  _renderTargets() {
    const { meals, settings } = this.ctx;
    const totals = sumMacros(meals.forDate(todayISO()));
    const t = settings.targets();
    const pct = t.percentOf(totals);
    $('#target-kcal').textContent = t.kcal;
    $('#target-prot').textContent = t.prot;
    $('#target-carb').textContent = t.carb;
    $('#target-fat').textContent  = t.fat;
    $('#nut-kcal').textContent = Math.round(totals.kcal);
    $('#nut-prot').textContent = Math.round(totals.prot);
    $('#nut-carb').textContent = Math.round(totals.carb);
    $('#nut-fat').textContent  = Math.round(totals.fat);
    $('#nbar-kcal').style.width = pct.kcal + '%';
    $('#nbar-prot').style.width = pct.prot + '%';
    $('#nbar-carb').style.width = pct.carb + '%';
    $('#nbar-fat').style.width  = pct.fat  + '%';
  }

  _renderMeals() {
    const meals = this.ctx.meals.forDate(todayISO());
    const el = $('#meals-list');
    if (!meals.length) {
      el.innerHTML = `<div class="empty-state"><p>No meals logged today</p></div>`;
    } else {
      el.innerHTML = meals.map((m) => `
        <div class="log-entry">
          <div class="log-icon" style="background:var(--accent-dim)"></div>
          <div class="log-info">
            <div class="log-name">${esc(m.name)}</div>
            <div class="log-detail">${esc(m.time)} · P:${m.prot}g C:${m.carb}g F:${m.fat}g</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <div class="log-cals">${Math.round(m.kcal)}</div>
            <button onclick="htDeleteMeal(${m.id})"
              style="font-size:11px;color:var(--text3);background:none;border:none;cursor:pointer">remove</button>
          </div>
        </div>`).join('');
    }
    // Refresh recipe select inside the Add Meal modal.
    const sel = $('#meal-recipe-select');
    if (sel) {
      sel.innerHTML = '<option value="">— Select recipe —</option>' +
        this.ctx.recipes.all().map((r) =>
          `<option value="${r.id}">${esc(r.name)}</option>`).join('');
    }
  }

  _renderRecipes() {
    const el = $('#recipes-list');
    const recipes = this.ctx.recipes.all();
    if (!recipes.length) {
      el.innerHTML = `<div class="card"><div class="empty-state"><p>No saved recipes yet</p></div></div>`;
      return;
    }
    el.innerHTML = recipes.map((r) => `
      <div class="card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:15px;font-weight:600">${esc(r.name)}</div>
          <div style="font-size:18px;font-weight:600;font-family:'DM Mono',monospace;color:var(--accent)">${r.kcal} kcal</div>
        </div>
        <div style="display:flex;gap:12px;font-size:12px;color:var(--text2)">
          <span style="color:var(--blue)">P ${r.prot}g</span>
          <span style="color:var(--orange)">C ${r.carb}g</span>
          <span style="color:var(--purple)">F ${r.fat}g</span>
        </div>
        ${r.notes ? `<div style="font-size:12px;color:var(--text3);margin-top:8px">${esc(r.notes)}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-ghost btn-sm" onclick="htQuickLogRecipe(${r.id})">Quick log</button>
          <button class="btn btn-danger btn-sm" onclick="htDeleteRecipe(${r.id})">Delete</button>
        </div>
      </div>`).join('');
  }
}
