import type { RefObject } from 'react';

export function CharacterGrid(props: {
  containerRef: RefObject<HTMLDivElement | null>;
  ariaLabel: string;
}) {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 100% 100%, 50% 50%, 50% 50%',
        backgroundPosition: '0 0, 0 0, 0 0, 0 0',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={props.containerRef}
          className="h-full w-full"
          aria-label={props.ariaLabel}
        />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-full w-px bg-slate-200/60" />
        <div className="absolute top-1/2 left-0 h-px w-full bg-slate-200/60" />
        <div className="absolute left-0 top-0 h-px w-full bg-slate-200/60" />
        <div className="absolute left-0 bottom-0 h-px w-full bg-slate-200/60" />
        <div className="absolute left-0 top-0 h-full w-px bg-slate-200/60" />
        <div className="absolute right-0 top-0 h-full w-px bg-slate-200/60" />
      </div>
    </div>
  );
}
