export function initCfWebAnalytics() {
  if (!import.meta.env.PROD) return;
  const token = import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN?.trim();
  if (!token) return;

  const existing = document.querySelector('script[data-cf-beacon]');
  if (existing) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token });
  document.head.appendChild(script);
}
