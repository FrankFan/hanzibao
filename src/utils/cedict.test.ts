import { describe, expect, it } from 'vitest';
import { getCedictShard, normalizeSingleHanzi } from './cedict';

describe('cedict utils', () => {
  it('normalizeSingleHanzi', () => {
    expect(normalizeSingleHanzi(' 汉 ')).toBe('汉');
    expect(normalizeSingleHanzi('')).toBeNull();
    expect(normalizeSingleHanzi('abc')).toBeNull();
    expect(normalizeSingleHanzi('汉字')).toBeNull();
  });

  it('getCedictShard', () => {
    expect(getCedictShard('汉')).toBe(55);
    expect(getCedictShard('字')).toBe(46);
    expect(getCedictShard('abc')).toBeNull();
  });
});
