// Central API base URL.
//   - Local dev:      leave VITE_API_BASE unset -> '' -> requests hit the Vite proxy (/api -> localhost:5001)
//   - Vercel / prod:  set VITE_API_BASE to the backend's public URL (e.g. your ngrok https URL)
//                     so the hosted frontend calls the tunneled backend directly.
export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

// Drop-in replacement for fetch() that prefixes API paths with API_BASE.
// Also sends `ngrok-skip-browser-warning` so ngrok's free-tier interstitial
// page never replaces the JSON response (harmless when not using ngrok).
export const apiFetch = (path, options = {}) =>
  fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
    },
  });
