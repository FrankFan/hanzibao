import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { useCharacterStore } from '../stores/characterStore';

const suggestions = ['汉', '字', '学', '习', '人', '中'];

export function Home() {
  const navigate = useNavigate();
  const setChar = useCharacterStore((s) => s.setChar);

  useEffect(() => {
    document.title = '汉字宝 - 汉字笔顺学习工具（田字格动画 / 拼音 / 释义）';
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">输入一个汉字，学习笔顺</h1>
        <p className="mt-2 text-sm text-slate-600">
          田字格里会按正确顺序逐笔动画展示，支持暂停、重播与速度调节。
        </p>
        <div className="mt-4">
          <SearchBar
            onSubmit={(c) => {
              setChar(c);
              navigate(`/char/${encodeURIComponent(c)}`);
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">常用示例</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((c) => (
            <button
              key={c}
              type="button"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-900 active:bg-slate-100"
              onClick={() => {
                setChar(c);
                navigate(`/char/${encodeURIComponent(c)}`);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
