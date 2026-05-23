import { $$, $ } from '../../core/dom.js';

/**
 * Router — bottom-nav controller. Knows which page IDs are reachable
 * via the nav, and which one is the "current" tab. The Active Workout
 * page is reachable via the Workout tab; switchTab('workout') redirects
 * to it when a session exists.
 */
export class Router {
  constructor({ getActiveSession }) {
    this.getActiveSession = getActiveSession;
    this.current = 'home';
    this.NAV_TABS = ['home', 'workout', 'nutrition', 'progress'];
  }

  /**
   * @param {string} tab — one of NAV_TABS, or 'active' (active workout page).
   */
  switchTab(tab) {
    let target = tab;
    if (tab === 'workout' && this.getActiveSession()) target = 'active';
    if (tab !== 'active' && !this.NAV_TABS.includes(tab)) return;

    $$('.page').forEach((p) => p.classList.remove('active'));
    $$('.nav-btn').forEach((b) => b.classList.remove('active'));

    $(`#page-${target}`)?.classList.add('active');
    const navTarget = target === 'active' ? 'workout' : target;
    $(`#nav-${navTarget}`)?.classList.add('active');

    this.current = target;
  }
}
