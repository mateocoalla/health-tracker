/**
 * Store — typed wrapper around localStorage.
 * All keys are namespaced under a single prefix so the app can coexist
 * with other localStorage users on the same origin, and so we can
 * import/export or clear everything in one shot.
 */
export class Store {
  constructor(prefix = 'ht_') {
    this.prefix = prefix;
  }

  _k(key) { return this.prefix + key; }

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this._k(key));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[Store] failed to parse "${key}"`, err);
      return fallback;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this._k(key), JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[Store] failed to save "${key}"`, err);
      return false;
    }
  }

  remove(key) {
    localStorage.removeItem(this._k(key));
  }

  /** Dump all namespaced data — useful for export/backup. */
  exportAll() {
    const dump = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefix)) {
        dump[k.slice(this.prefix.length)] = this.get(k.slice(this.prefix.length));
      }
    }
    return dump;
  }

  /** Replace all namespaced data — useful for import/restore. */
  importAll(dump) {
    Object.entries(dump).forEach(([k, v]) => this.set(k, v));
  }

  clearAll() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }
}
