/**
 * Page — base class for tab pages.
 * Subclasses receive the shared `ctx` (repos, services, UI singletons)
 * and implement `mount()` (one-time wiring) and `render()` (re-paint).
 *
 * `mount()` is called once at app start; pages then subscribe to repo
 * events on the EventBus so they re-render only when their data changes.
 */
export class Page {
  constructor(ctx) {
    /** @type {import('../../core/App.js').AppContext} */
    this.ctx = ctx;
  }
  mount() {}
  render() {}
}
