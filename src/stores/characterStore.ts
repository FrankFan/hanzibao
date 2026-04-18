import { create } from 'zustand';
import type { CharacterStore } from '../types';
import { normalizeSingleHanzi } from '../utils/cedict';

export const useCharacterStore = create<CharacterStore>((set) => ({
  currentChar: '汉',
  animation: { isPlaying: false, speed: 1 },
  setChar: (char: string) =>
    set(() => ({
      currentChar: normalizeSingleHanzi(char) ?? '汉',
    })),
  setSpeed: (speed: number) =>
    set((s) => ({
      animation: { ...s.animation, speed },
    })),
  setPlaying: (playing: boolean) =>
    set((s) => ({
      animation: { ...s.animation, isPlaying: playing },
    })),
}));
