/**
 * Toast — singleton toast banner. Mount once, then call .show(msg).
 */
export class Toast {
  constructor(el) {
    this.el = el;
    this._timeout = null;
  }
  show(msg, ms = 2200) {
    this.el.textContent = msg;
    this.el.classList.add('show');
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => this.el.classList.remove('show'), ms);
  }
}
