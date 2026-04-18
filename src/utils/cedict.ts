import type { DictEntry } from '../types';

export function normalizeSingleHanzi(input: string): string | null {
  const trimmed = input.trim();
  const chars = Array.from(trimmed);
  if (chars.length !== 1) return null;
  const c = chars[0]!;
  if (!/^\p{Script=Han}$/u.test(c)) return null;
  return c;
}

export function getCedictShard(char: string): number | null {
  const c = normalizeSingleHanzi(char);
  if (!c) return null;
  const codePoint = c.codePointAt(0);
  if (codePoint == null) return null;
  return Math.floor(codePoint / 500);
}

export type CedictShard = Record<string, DictEntry>;
