import { useEffect, useMemo, useState } from 'react';
import type { DictEntry } from '../types';
import type { CedictShard } from '../utils/cedict';
import { getCedictShard, normalizeSingleHanzi } from '../utils/cedict';

type DictionaryState =
  | { status: 'idle'; entry: null }
  | { status: 'loading'; entry: null }
  | { status: 'ready'; entry: DictEntry | null }
  | { status: 'error'; entry: null };

const shardCache = new Map<number, CedictShard>();
const inflight = new Map<number, Promise<CedictShard>>();

async function loadShard(shard: number, signal: AbortSignal): Promise<CedictShard> {
  const cached = shardCache.get(shard);
  if (cached) return cached;

  const current = inflight.get(shard);
  if (current) return current;

  const p = fetch(`/data/cedict-${shard}.json`, { signal })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
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
  const [state, setState] = useState<DictionaryState>({ status: 'idle', entry: null });

  useEffect(() => {
    if (!normalized || shard == null) {
      setState({ status: 'idle', entry: null });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading', entry: null });

    loadShard(shard, controller.signal)
      .then((data) => {
        setState({ status: 'ready', entry: data[normalized] ?? null });
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', entry: null });
      });

    return () => controller.abort();
  }, [normalized, shard]);

  return state;
}
