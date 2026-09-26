// Central API base URL.
//   - Local dev:      leave VITE_API_BASE unset -> '' -> requests hit the Vite proxy (/api -> localhost:5001)
//   - Vercel / prod:  set VITE_API_BASE to the backend's public URL (e.g. your ngrok host)
//                     so the hosted frontend calls the tunneled backend directly.
//
// Normalization keeps it working no matter how the env var was entered:
//   "host.ngrok-free.dev"     -> "https://host.ngrok-free.dev"   (adds missing scheme)
//   "https://host/"           -> "https://host"                  (strips trailing slash)
//   ""/undefined              -> ""                              (same-origin / Vite proxy)
const normalizeBase = (raw) => {
  let base = (raw || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  // If the user pasted a bare host (no scheme), assume https.
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
};

export const API_BASE = normalizeBase(import.meta.env.VITE_API_BASE);

// Status codes worth a silent retry — the free tunnel backing the API proxy
// occasionally drops a request (timeout/relay hiccup) even though the
// backend itself is healthy, so one blip shouldn't surface as a user error.
const RETRYABLE_STATUSES = new Set([408, 502, 503, 504]);
const RETRY_DELAYS_MS = [400, 900];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Drop-in replacement for fetch() that prefixes API paths with API_BASE.
// Also sends `ngrok-skip-browser-warning` so ngrok's free-tier interstitial
// page never replaces the JSON response (harmless when not using ngrok).
// Retries transient tunnel failures a couple of times before giving up.
export const apiFetch = async (path, options = {}) => {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(options.headers || {}),
      },
    });

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await doFetch();
      if (RETRYABLE_STATUSES.has(response.status) && attempt < RETRY_DELAYS_MS.length) {
        await wait(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < RETRY_DELAYS_MS.length) {
        await wait(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw err;
    }
  }
};

// Like apiFetch, but also guards against a tunnel hiccup that corrupts the
// response body while still reporting HTTP 200 (so apiFetch's status-based
// retry never kicks in) — that shows up as a JSON.parse failure. Retries the
// whole request in that case too, and returns `{ response, data }` so callers
// don't need their own try/catch around response.json().
export const apiFetchJson = async (path, options = {}) => {
  for (let attempt = 0; ; attempt++) {
    const response = await apiFetch(path, options);
    const text = await response.text();
    try {
      const data = text ? JSON.parse(text) : {};
      return { response, data };
    } catch (err) {
      if (attempt < RETRY_DELAYS_MS.length) {
        await wait(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw new Error('Server returned an invalid response — please try again.');
    }
  }
};
