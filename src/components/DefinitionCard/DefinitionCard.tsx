import type { DictEntry } from '../../types';

export function DefinitionCard(props: {
  status: 'idle' | 'loading' | 'ready' | 'error';
  entry: DictEntry | null;
}) {
  const content =
    props.status === 'loading'
      ? '加载中…'
      : props.status === 'error'
        ? '词典加载失败'
        : props.entry
          ? null
          : '暂无释义';

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold">释义</h2>
      {content ? <div className="mt-2 text-sm text-slate-600">{content}</div> : null}
      {props.entry ? (
        <div className="mt-3 space-y-4">
          <div>
            <div className="text-xs text-slate-500">简释</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
              {props.entry.definitions.slice(0, 4).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          {props.entry.examples.length ? (
            <div>
              <div className="text-xs text-slate-500">词组</div>
              <div className="mt-2 space-y-2">
                {props.entry.examples.slice(0, 3).map((ex) => (
                  <div key={ex.word} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-base font-semibold">{ex.word}</div>
                      <div className="text-xs text-slate-500">{ex.pinyin}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">{ex.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
