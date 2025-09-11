import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistentCache } from '../services/persistentCache';

// Mock localStorage
class MemoryStorage {
  private data = new Map<string,string>();
  getItem(k:string){ return this.data.get(k) ?? null; }
  setItem(k:string,v:string){ this.data.set(k,v); }
  removeItem(k:string){ this.data.delete(k); }
  key(i:number){ return Array.from(this.data.keys())[i] ?? null; }
  get length(){ return this.data.size; }
  clear(){ this.data.clear(); }
}

// @ts-ignore
global.localStorage = new MemoryStorage();

describe('PersistentCache', () => {
  beforeEach(() => {
    (global.localStorage as any).clear();
    vi.setSystemTime(0);
  });

  it('persists and retrieves within ttl', () => {
    const pc = new PersistentCache<string>({ ttlMs: 1000 });
    pc.set('k','v');
    expect(pc.get('k')).toBe('v');
  });

  it('expires after ttl', () => {
    const pc = new PersistentCache<string>({ ttlMs: 1000 });
    pc.set('k','v');
    vi.setSystemTime(1001);
    expect(pc.get('k')).toBeUndefined();
  });

  it('enforces max entries', () => {
    const pc = new PersistentCache<string>({ maxEntries: 2, ttlMs: 1000 });
    pc.set('a','1');
    pc.set('b','2');
    pc.set('c','3');
    const values = ['a','b','c'].map(k => pc.get(k));
    expect(values.filter(v => v !== undefined).length).toBe(2);
  });
});
