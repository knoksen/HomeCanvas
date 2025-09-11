/**
 * Simple in-memory LRU-ish cache (bounded by maxEntries) for browser runtime.
 */
export interface CacheEntry<T> { value: T; ts: number; }

export class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  constructor(private maxEntries = 50) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    // refresh recency
    this.store.delete(key);
    this.store.set(key, { value: hit.value, ts: Date.now() });
    return hit.value;
  }

  set(key: string, value: T) {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, ts: Date.now() });
    if (this.store.size > this.maxEntries) {
      // remove oldest
      let oldestKey: string | undefined;
      let oldestTs = Infinity;
      for (const [k, v] of this.store.entries()) {
        if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
      }
      if (oldestKey) this.store.delete(oldestKey);
    }
  }
}

export const descriptionCache = new SimpleCache<string>(40);

export function hashString(input: string): string {
  // DJB2 hash
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
