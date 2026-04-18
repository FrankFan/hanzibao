import type { ChangeEvent } from 'react';

export function StrokeControls(props: {
  ready: boolean;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onSpeedChange: (speed: number) => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={props.onPlay}
            disabled={!props.ready || props.isPlaying}
          >
            播放
          </button>
          <button
            type="button"
            className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={props.onPause}
            disabled={!props.ready || !props.isPlaying}
          >
            暂停
          </button>
          <button
            type="button"
            className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={props.onReplay}
            disabled={!props.ready}
          >
            重播
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="shrink-0">速度</span>
          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm outline-none ring-sky-300 focus:ring-2"
            value={String(props.speed)}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              props.onSpeedChange(Number(e.target.value))
            }
            disabled={!props.ready}
            aria-label="动画速度"
          >
            <option value="0.6">慢</option>
            <option value="1">标准</option>
            <option value="1.6">快</option>
          </select>
        </label>
      </div>
    </div>
  );
}
