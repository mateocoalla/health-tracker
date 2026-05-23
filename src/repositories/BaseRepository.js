/**
 * BaseRepository — generic CRUD over a single Store key.
 * Subclasses provide `key`, `eventName`, and a `revive(json)` factory
 * for hydrating stored plain objects back into rich domain models.
 *
 * Emits "<eventName>:changed" on the EventBus after every mutation,
 * so UI components don't need to know which repo changed — they just
 * subscribe to the event they care about.
 */
export class BaseRepository {
  constructor({ store, bus, key, eventName, revive, seed }) {
    this.store = store;
    this.bus = bus;
    this.key = key;
    this.eventName = eventName;
    this.revive = revive;
    this._items = (this.store.get(key, null) || seed || []).map(revive);
  }

  all() { return [...this._items]; }
  findById(id) { return this._items.find((x) => String(x.id) === String(id)) || null; }

  _persist() {
    this.store.set(this.key, this._items.map((x) => x.toJSON()));
    this.bus.emit(`${this.eventName}:changed`);
  }

  add(item) {
    this._items.push(item);
    this._persist();
    return item;
  }

  removeById(id) {
    const before = this._items.length;
    this._items = this._items.filter((x) => String(x.id) !== String(id));
    if (this._items.length !== before) this._persist();
  }

  update(predicateOrId, mutator) {
    const item = typeof predicateOrId === 'function'
      ? this._items.find(predicateOrId)
      : this.findById(predicateOrId);
    if (!item) return null;
    mutator(item);
    this._persist();
    return item;
  }

  /** Replace the whole collection (used by import/restore). */
  replaceAll(rawItems) {
    this._items = rawItems.map(this.revive);
    this._persist();
  }
}
