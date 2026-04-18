import { formatPinyin } from '../../utils/pinyin';
import { useTTS } from '../../hooks/useTTS';

export function PinyinBadge(props: { char: string; pinyin: string | null }) {
  const { speak } = useTTS();
  const text = props.pinyin ? formatPinyin(props.pinyin) : '暂无拼音';

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="min-w-0">
        <div className="text-xs text-slate-500">拼音</div>
        <div className="truncate text-lg font-semibold text-slate-900">{text}</div>
      </div>
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white disabled:opacity-50"
        onClick={() => speak(props.char)}
        disabled={!props.char}
        aria-label="播放发音"
        title="播放发音"
      >
        🔊
      </button>
    </div>
  );
}
