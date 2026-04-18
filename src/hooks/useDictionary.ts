import { useEffect, useMemo, useState } from 'react';
import type { DictEntry } from '../types';
import type { CedictShard } from '../utils/cedict';
import { getCedictShard, normalizeSingleHanzi } from '../utils/cedict';

type DictionaryState =
  | { status: 'idle'; entry: null; missingShard: false }
  | { status: 'loading'; entry: null; missingShard: false }
  | { status: 'ready'; entry: DictEntry | null; missingShard: boolean }
  | { status: 'error'; entry: null; missingShard: false };

const shardCache = new Map<number, CedictShard | null>();
const inflight = new Map<number, Promise<CedictShard | null>>();

async function loadShard(shard: number, signal: AbortSignal): Promise<CedictShard | null> {
  if (shardCache.has(shard)) return shardCache.get(shard)!;

  const current = inflight.get(shard);
  if (current) return current;

  const p = fetch(`/data/cedict-${shard}.json`, { signal })
    .then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(String(r.status));
      const contentType = r.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) return null;
      return r.json() as Promise<CedictShard>;
    })
    .then((data) => {
      shardCache.set(shard, data);
      inflight.delete(shard);
      return data;
    })
    .catch((e) => {
      inflight.delete(shard);
      throw e;
    });

  inflight.set(shard, p);
  return p;
}

export function useDictionary(char: string) {
  const normalized = useMemo(() => normalizeSingleHanzi(char), [char]);
  const shard = useMemo(() => (normalized ? getCedictShard(normalized) : null), [normalized]);
  const [state, setState] = useState<DictionaryState>({
    status: 'idle',
    entry: null,
    missingShard: false,
  });

  useEffect(() => {
    if (!normalized || shard == null) {
      setState({ status: 'idle', entry: null, missingShard: false });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading', entry: null, missingShard: false });

    loadShard(shard, controller.signal)
      .then((data) => {
        if (!data) {
          setState({ status: 'ready', entry: null, missingShard: true });
          return;
        }
        setState({ status: 'ready', entry: data[normalized] ?? null, missingShard: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', entry: null, missingShard: false });
      });

    return () => controller.abort();
  }, [normalized, shard]);

  return state;
}
