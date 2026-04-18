export interface WordExample {
  word: string;
  pinyin: string;
  meaning: string;
}

export interface DictEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
  examples: WordExample[];
}

export interface AnimationState {
  isPlaying: boolean;
  speed: number;
}

export interface CharacterStore {
  currentChar: string;
  animation: AnimationState;
  setChar: (char: string) => void;
  setSpeed: (speed: number) => void;
  setPlaying: (playing: boolean) => void;
}
