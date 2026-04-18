import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : '发生了未知错误';

  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
      <div className="text-lg font-semibold text-rose-700">页面出错了</div>
      <div className="mt-2 text-sm text-slate-700">{message}</div>
      <a
        href="/"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white"
      >
        返回首页
      </a>
    </div>
  );
}
