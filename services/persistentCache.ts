/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersistentCacheOptions {
  namespace?: string;
  ttlMs?: number; // time to live for entries
  maxEntries?: number;
}

interface StoredEntry<T> { v: T; e: number; t: number; }

export class PersistentCache<T = unknown> {
  private ns: string;
  private ttl: number;
  private max: number;

  constructor(opts: PersistentCacheOptions = {}) {
    this.ns = opts.namespace || 'hc';
    this.ttl = opts.ttlMs ?? 1000 * 60 * 60; // 1h default
    this.max = opts.maxEntries ?? 100;
  }

  private safeStorage(): Storage | null {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch {}
    return null;
  }

  private key(k: string) { return `${this.ns}:${k}`; }

  get(key: string): T | undefined {
    const store = this.safeStorage();
    if (!store) return undefined;
    try {
      const raw = store.getItem(this.key(key));
      if (!raw) return undefined;
      const parsed: StoredEntry<T> = JSON.parse(raw);
      const now = Date.now();
      if (parsed.e && parsed.e < now) {
        store.removeItem(this.key(key));
        return undefined;
      }
      return parsed.v;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: T) {
    const store = this.safeStorage();
    if (!store) return;
    try {
      const entry: StoredEntry<T> = { v: value, e: Date.now() + this.ttl, t: Date.now() };
      store.setItem(this.key(key), JSON.stringify(entry));
      this.enforceLimit(store);
    } catch {
      // ignore quota errors
    }
  }

  private enforceLimit(store: Storage) {
    const prefix = `${this.ns}:`;
    const entries: { k: string; t: number }[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(prefix)) {
        try {
          const raw = store.getItem(k);
          if (!raw) continue;
            const parsed: StoredEntry<T> = JSON.parse(raw);
            entries.push({ k, t: parsed.t });
        } catch { /* ignore */ }
      }
    }
    if (entries.length <= this.max) return;
    entries.sort((a,b) => a.t - b.t); // oldest first
    const remove = entries.slice(0, entries.length - this.max);
    remove.forEach(r => store.removeItem(r.k));
  }
}

export const persistentDescriptionCache = new PersistentCache<string>({ namespace: 'hc-desc', ttlMs: 1000 * 60 * 60 * 12, maxEntries: 200 });
