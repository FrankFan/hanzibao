import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CharacterGrid } from '../components/CharacterGrid/CharacterGrid';
import { DefinitionCard } from '../components/DefinitionCard/DefinitionCard';
import { PinyinBadge } from '../components/PinyinBadge/PinyinBadge';
import { StrokeControls } from '../components/StrokeControls/StrokeControls';
import { useDictionary } from '../hooks/useDictionary';
import { useHanziWriter } from '../hooks/useHanziWriter';
import { useCharacterStore } from '../stores/characterStore';
import { normalizeSingleHanzi } from '../utils/cedict';

export function Character() {
  const params = useParams();
  const navigate = useNavigate();

  const decoded = useMemo(() => {
    if (!params.char) return '';
    try {
      return decodeURIComponent(params.char);
    } catch {
      return params.char;
    }
  }, [params.char]);

  const normalized = useMemo(() => normalizeSingleHanzi(decoded), [decoded]);

  const currentChar = useCharacterStore((s) => s.currentChar);
  const setChar = useCharacterStore((s) => s.setChar);
  const speed = useCharacterStore((s) => s.animation.speed);
  const isPlaying = useCharacterStore((s) => s.animation.isPlaying);
  const setSpeed = useCharacterStore((s) => s.setSpeed);
  const setPlaying = useCharacterStore((s) => s.setPlaying);

  useEffect(() => {
    if (!normalized) {
      navigate('/', { replace: true });
      return;
    }
    setChar(normalized);
  }, [navigate, normalized, setChar]);

  const char = normalized ?? currentChar;
  const dict = useDictionary(char);
  const pinyin = dict.status === 'ready' && dict.entry ? dict.entry.pinyin : null;

  const writer = useHanziWriter(char, speed);

  useEffect(() => {
    setPlaying(false);
  }, [char, setPlaying]);

  useEffect(() => {
    if (!writer.ready) return;
    let canceled = false;
    setPlaying(true);
    Promise.resolve(writer.resetCharacter(char))
      .then(() => {
        if (canceled) return;
        return writer.animateCharacter();
      })
      .finally(() => {
        if (canceled) return;
        setPlaying(false);
      });
    return () => {
      canceled = true;
      void writer.pauseAnimation();
      setPlaying(false);
    };
  }, [char, writer.ready]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div className="text-5xl font-semibold leading-none">{char}</div>
          <div className="text-xs text-slate-500">田字格笔顺演示</div>
        </div>
      </section>

      <PinyinBadge char={char} pinyin={pinyin} />

      <CharacterGrid containerRef={writer.containerRef} ariaLabel={`汉字 ${char} 笔顺`} />

      <StrokeControls
        ready={writer.ready}
        isPlaying={isPlaying}
        speed={speed}
        onSpeedChange={(s) => setSpeed(s)}
        onPlay={() => {
          if (!writer.ready) return;
          setPlaying(true);
          Promise.resolve(writer.resetCharacter(char))
            .then(() => writer.animateCharacter())
            .finally(() => setPlaying(false));
        }}
        onPause={() => {
          if (!writer.ready) return;
          writer.pauseAnimation();
          setPlaying(false);
        }}
        onReplay={() => {
          if (!writer.ready) return;
          setPlaying(true);
          Promise.resolve(writer.resetCharacter(char))
            .then(() => writer.animateCharacter())
            .finally(() => setPlaying(false));
        }}
      />

      <DefinitionCard
        status={dict.status}
        entry={dict.status === 'ready' ? dict.entry : null}
        missingShard={dict.status === 'ready' ? dict.missingShard : false}
      />
    </div>
  );
}
