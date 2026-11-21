/**
 * Lightweight reactive Observable primitive for MVVM ViewModel bindings.
 * Notifies subscribers only when the value changes (Object.is check) or via .notify().
 */
export class Observable {
  constructor(initialValue) {
    this._value = initialValue;
    this._subs = new Set();
  }

  get value() {
    return this._value;
  }

  set value(next) {
    if (Object.is(this._value, next)) return;
    this._value = next;
    this.notify();
  }

  subscribe(fn, { immediate = true } = {}) {
    this._subs.add(fn);
    if (immediate) fn(this._value);
    return () => this._subs.delete(fn);
  }

  notify() {
    for (const fn of this._subs) {
      fn(this._value);
    }
  }

  clear() {
    this._subs.clear();
  }
}
