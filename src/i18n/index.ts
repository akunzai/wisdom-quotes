import { en } from '@/i18n/en';
import { ja } from '@/i18n/ja';
import { zhHant } from '@/i18n/zh-Hant';
import type { Locale, Messages, PageId } from '@/i18n/types';

export type { Locale, Messages, PageId };

export const DEFAULT_LOCALE: Locale = 'zh-Hant';

export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-Hant', 'en', 'ja'] as const;

export const catalogs: Record<Locale, Messages> = {
  'zh-Hant': zhHant,
  en,
  ja,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'zh-Hant' || value === 'en' || value === 'ja';
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function formatPageTitle(page: PageId, locale: Locale): string {
  const m = catalogs[locale];
  return `${m.app.name} — ${m.page[page]}`;
}

export function resolvePageId(pathname: string): PageId {
  if (pathname.includes('/focus')) return 'focus';
  if (pathname.includes('/authors')) return 'authors';
  if (pathname.includes('/settings')) return 'settings';
  return 'quotes';
}

export function focusIntervalLabel(locale: Locale, minutes: number): string {
  const m = catalogs[locale].focusInterval;
  if (minutes === 0) return m.off;
  return interpolate(m.minutes, { n: minutes });
}

export const FOCUS_AUTO_INTERVAL_VALUES = [0, 1, 2, 3, 5, 10, 15, 30] as const;

/** Serializable title/description payload for Layout boot script. */
export function getTitleBootPayload(): Record<
  Locale,
  { app: string; page: Record<PageId, string>; description: string }
> {
  return {
    'zh-Hant': {
      app: zhHant.app.name,
      page: zhHant.page,
      description: zhHant.app.description,
    },
    en: {
      app: en.app.name,
      page: en.page,
      description: en.app.description,
    },
    ja: {
      app: ja.app.name,
      page: ja.page,
      description: ja.app.description,
    },
  };
}