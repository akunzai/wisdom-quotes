const PETS_KEY = 'wq-pets';
const FOCUS_AUTO_INTERVAL_KEY = 'wq-focus-auto-minutes';
const DEFAULT_FOCUS_AUTO_INTERVAL_MINUTES = 5;

export function getPetsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return localStorage.getItem(PETS_KEY) !== 'off';
}

export function setPetsEnabled(enabled: boolean): void {
  localStorage.setItem(PETS_KEY, enabled ? 'on' : 'off');
}

/** Minutes between auto-advancing quotes in focus mode; 0 disables auto-advance. */
export function getFocusAutoIntervalMinutes(): number {
  if (typeof window === 'undefined') return DEFAULT_FOCUS_AUTO_INTERVAL_MINUTES;
  const raw = localStorage.getItem(FOCUS_AUTO_INTERVAL_KEY);
  if (raw === null) return DEFAULT_FOCUS_AUTO_INTERVAL_MINUTES;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_FOCUS_AUTO_INTERVAL_MINUTES;
  return parsed;
}

export function setFocusAutoIntervalMinutes(minutes: number): void {
  const clamped = Math.max(0, Math.min(120, Math.round(minutes)));
  localStorage.setItem(FOCUS_AUTO_INTERVAL_KEY, String(clamped));
  window.dispatchEvent(
    new CustomEvent('wq-prefs-change', { detail: { key: FOCUS_AUTO_INTERVAL_KEY } }),
  );
}

export const FOCUS_AUTO_INTERVAL_OPTIONS = [
  { value: 0, label: '關閉' },
  { value: 1, label: '1 分鐘' },
  { value: 2, label: '2 分鐘' },
  { value: 3, label: '3 分鐘' },
  { value: 5, label: '5 分鐘' },
  { value: 10, label: '10 分鐘' },
  { value: 15, label: '15 分鐘' },
  { value: 30, label: '30 分鐘' },
] as const;