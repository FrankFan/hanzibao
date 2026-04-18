import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeSingleHanzi } from '../utils/cedict';

type Writer = {
  animateCharacter: () => Promise<unknown> | unknown;
  pauseAnimation: () => Promise<unknown> | unknown;
  resumeAnimation: () => Promise<unknown> | unknown;
  setCharacter: (char: string) => Promise<void>;
};

export function useHanziWriter(char: string, speed: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<Writer | null>(null);
  const [ready, setReady] = useState(false);

  const charDataUrl = useCallback((ch: string) => {
    const encoded = encodeURIComponent(ch);
    if (import.meta.env.PROD) return `/hw-data/${encoded}.json`;
    return `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encoded}.json`;
  }, []);

  useEffect(() => {
    const c = normalizeSingleHanzi(char);
    if (!containerRef.current || !c) {
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

        const writer = (HanziWriter as any).create(containerRef.current, c, {
          width: 280,
          height: 280,
          padding: 18,
          showOutline: true,
          strokeAnimationSpeed: speed,
          delayBetweenStrokes: 250,
          charDataLoader: (ch: string) =>
            fetch(charDataUrl(ch)).then((r) => r.json()),
        }) as Writer;

        writerRef.current = writer;
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
      writerRef.current = null;
    };
  }, [char, speed, charDataUrl]);

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
