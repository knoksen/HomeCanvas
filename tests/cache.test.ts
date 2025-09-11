import { describe, it, expect } from 'vitest';
import { SimpleCache, hashString } from '../services/cache';

describe('SimpleCache', () => {
  it('stores and retrieves values', () => {
    const c = new SimpleCache<string>(3);
    c.set('a', '1');
    expect(c.get('a')).toBe('1');
  });

  it('evicts oldest when max exceeded', () => {
    const c = new SimpleCache<string>(2);
    c.set('a', '1');
    c.set('b', '2');
    c.set('c', '3'); // should evict a
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe('2');
    expect(c.get('c')).toBe('3');
  });

  it('hashString produces stable output', () => {
    const h1 = hashString('hello');
    const h2 = hashString('hello');
    expect(h1).toBe(h2);
    expect(typeof h1).toBe('string');
  });
});
