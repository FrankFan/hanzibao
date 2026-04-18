import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos() {
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function isStandalone() {
  const nav = navigator as unknown as { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || !!nav.standalone;
}

export function InstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  const show = useMemo(() => !dismissed && !isStandalone(), [dismissed]);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (!show) return null;

  const ios = isIos();
  const canPrompt = !!promptEvent;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold">添加到桌面</div>
          {ios ? (
            <div className="mt-1 text-sm text-slate-600">
              点击浏览器分享按钮，然后选择“添加到主屏幕”。
            </div>
          ) : canPrompt ? (
            <div className="mt-1 text-sm text-slate-600">安装后可像 App 一样从桌面打开。</div>
          ) : (
            <div className="mt-1 text-sm text-slate-600">
              你的浏览器暂不支持一键安装，可使用浏览器菜单里的“安装/添加到主屏幕”。
            </div>
          )}
        </div>
        <button
          type="button"
          className="shrink-0 text-sm font-semibold text-slate-500"
          onClick={() => setDismissed(true)}
          aria-label="关闭"
        >
          关闭
        </button>
      </div>

      {!ios && canPrompt ? (
        <button
          type="button"
          className="mt-3 h-10 w-full rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white"
          onClick={async () => {
            const ev = promptEvent;
            if (!ev) return;
            await ev.prompt();
            await ev.userChoice.catch(() => undefined);
            setPromptEvent(null);
            setDismissed(true);
          }}
        >
          安装
        </button>
      ) : null}
    </div>
  );
}

