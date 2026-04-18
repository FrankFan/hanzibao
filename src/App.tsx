import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { InstallBanner } from './components/InstallBanner/InstallBanner';
import { SearchBar } from './components/SearchBar/SearchBar';
import { useCharacterStore } from './stores/characterStore';

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentChar = useCharacterStore((s) => s.currentChar);
  const setChar = useCharacterStore((s) => s.setChar);

  const showSearch = location.pathname !== '/';

  return (
    <div className="min-h-dvh bg-sky-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            className="text-lg font-semibold tracking-wide"
            onClick={() => navigate('/')}
            aria-label="返回首页"
          >
            汉字宝
          </button>
          {showSearch ? (
            <div className="flex-1">
              <SearchBar
                defaultValue={currentChar}
                onSubmit={(c) => {
                  setChar(c);
                  navigate(`/char/${encodeURIComponent(c)}`);
                }}
              />
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-4">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              加载中…
            </div>
          }
        >
          <Outlet />
          {location.pathname === '/' ? (
          <div className="mt-4">
            <InstallBanner />
          </div>
        ) : null}
        </Suspense>
      </main>
    </div>
  );
}
