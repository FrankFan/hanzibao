import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { normalizeSingleHanzi } from '../../utils/cedict';

export function SearchBar(props: {
  defaultValue?: string;
  onSubmit: (char: string) => void;
}) {
  const [value, setValue] = useState(props.defaultValue ?? '');

  useEffect(() => {
    setValue(props.defaultValue ?? '');
  }, [props.defaultValue]);

  const normalized = useMemo(() => normalizeSingleHanzi(value), [value]);

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (normalized) props.onSubmit(normalized);
      }}
    >
      <input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        inputMode="text"
        enterKeyHint="search"
        placeholder="输入一个汉字"
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base shadow-sm outline-none ring-sky-300 focus:ring-2"
        aria-label="输入汉字"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
        disabled={!normalized}
      >
        查询
      </button>
    </form>
  );
}
