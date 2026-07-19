import { useState, useEffect } from 'react';
import { apiFetch } from './api.js';

// Loads the admin-managed classes & subjects so every page's dropdowns stay in
// sync with what the director configures. Falls back to sensible defaults while
// loading or if the request fails.
const FALLBACK = {
  classes: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
  subjects: ['Mathematics', 'Science', 'English'],
  months: ['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'],
};

export function useConfig() {
  const [config, setConfig] = useState(FALLBACK);

  useEffect(() => {
    let active = true;
    apiFetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setConfig({
          classes: data.classes?.length ? data.classes : FALLBACK.classes,
          subjects: data.subjects?.length ? data.subjects : FALLBACK.subjects,
          months: data.months?.length ? data.months : FALLBACK.months,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return config;
}
