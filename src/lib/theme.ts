export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'wq-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}