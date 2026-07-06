import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/index';

const PETS_KEY = 'wq-pets';
const LOCALE_KEY = 'wq-locale';
const FOCUS_AUTO_INTERVAL_KEY = 'wq-focus-auto-minutes';
const DEFAULT_FOCUS_AUTO_INTERVAL_MINUTES = 5;

export function getLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(new CustomEvent('wq-prefs-change', { detail: { key: LOCALE_KEY } }));
}

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

