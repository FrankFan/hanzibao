import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeSingleHanzi } from '../utils/cedict';

type Writer = {
  animateCharacter: () => Promise<unknown> | unknown;
  pauseAnimation: () => Promise<unknown> | unknown;
  resumeAnimation: () => Promise<unknown> | unknown;
  setCharacter: (char: string) => Promise<void>;
  updateDimensions: (dims: { width: number; height: number; padding: number }) => void;
};

export function useHanziWriter(char: string, speed: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<Writer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  const charDataUrl = useCallback((ch: string) => {
    const encoded = encodeURIComponent(ch);
    if (import.meta.env.PROD) return `/hw-data/${encoded}.json`;
    return `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encoded}.json`;
  }, []);

  const getSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { width: 280, height: 280, padding: 18 };
    const rect = el.getBoundingClientRect();
    const size = Math.max(200, Math.floor(Math.min(rect.width, rect.height)));
    const padding = Math.max(12, Math.round(size * 0.07));
    return { width: size, height: size, padding };
  }, []);

  useEffect(() => {
    const c = normalizeSingleHanzi(char);
    if (!containerRef.current || !c) {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      writerRef.current = null;
      setReady(false);
      return;
    }

    let alive = true;
    setReady(false);

    import('hanzi-writer')
      .then((m) => {
        if (!alive || !containerRef.current) return;
        containerRef.current.innerHTML = '';

        const HanziWriter = (m as unknown as { default?: unknown }).default ?? m;
        const { width, height, padding } = getSize();

        const writer = (HanziWriter as any).create(containerRef.current, c, {
          width,
          height,
          padding,
          showOutline: true,
          strokeAnimationSpeed: speed,
          delayBetweenStrokes: 250,
          charDataLoader: (ch: string) =>
            fetch(charDataUrl(ch)).then((r) => r.json()),
        }) as Writer;

        writerRef.current = writer;
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = new ResizeObserver(() => {
          const w = writerRef.current;
          if (!w) return;
          const next = getSize();
          w.updateDimensions(next);
        });
        resizeObserverRef.current.observe(containerRef.current);
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setReady(false);
      });

    return () => {
      alive = false;
      void writerRef.current?.pauseAnimation();
      if (containerRef.current) containerRef.current.innerHTML = '';
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      writerRef.current = null;
    };
  }, [char, speed, charDataUrl, getSize]);

  const animateCharacter = useCallback(() => writerRef.current?.animateCharacter(), []);
  const pauseAnimation = useCallback(() => writerRef.current?.pauseAnimation(), []);
  const resumeAnimation = useCallback(() => writerRef.current?.resumeAnimation(), []);
  const resetCharacter = useCallback((c: string) => writerRef.current?.setCharacter(c), []);

  return {
    containerRef,
    ready,
    animateCharacter,
    pauseAnimation,
    resumeAnimation,
    resetCharacter,
  };
}
