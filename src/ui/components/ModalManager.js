import { $$, on } from '../../core/dom.js';

/**
 * ModalManager — opens/closes overlay sheets by id.
 * Backdrop click closes; the per-modal logic stays in pages/modals.
 */
export class ModalManager {
  constructor() {
    this._hooks = new Map(); // id -> onOpen callback
    $$('.modal-overlay').forEach((overlay) => {
      on(overlay, 'click', (e) => { if (e.target === overlay) this.close(overlay.id); });
    });
  }

  /** Register a function to run every time a given modal opens. */
  onOpen(id, fn) {
    this._hooks.set(id, fn);
  }

  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    this._hooks.get(id)?.();
    el.classList.add('open');
  }

  close(id) {
    document.getElementById(id)?.classList.remove('open');
  }
}
