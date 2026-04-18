import { useCallback, useMemo } from 'react';

export function useTTS() {
  const supported = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window, []);

  const speak = useCallback((text: string) => {
    const content = text.trim();
    if (!content) return;

    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(content);
      utt.lang = 'zh-CN';
      utt.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
      return;
    }

    const audio = new Audio(`/data/audio/${encodeURIComponent(content)}.mp3`);
    void audio.play();
  }, []);

  return { supported, speak };
}
