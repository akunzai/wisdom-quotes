import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  catalogs,
  DEFAULT_LOCALE,
  formatPageTitle,
  interpolate,
  resolvePageId,
  type Locale,
  type PageId,
} from '@/i18n/index';
import { getLocale, setLocale as persistLocale } from '@/lib/prefs';

type Vars = Record<string, string | number>;

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Locale {
  return getLocale();
}

function notifyLocaleChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setLocale(locale: Locale): void {
  persistLocale(locale);
  document.documentElement.lang = locale;
  document.title = formatPageTitle(resolvePageId(window.location.pathname), locale);
  notifyLocaleChange();
  window.dispatchEvent(new CustomEvent('wq-locale-change', { detail: { locale } }));
}

export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LOCALE);
  const messages = catalogs[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = formatPageTitle(resolvePageId(window.location.pathname), locale);
  }, [locale]);

  const t = useCallback(
    (template: string, vars?: Vars) => (vars ? interpolate(template, vars) : template),
    [],
  );

  const pageTitle = useCallback((page: PageId) => formatPageTitle(page, locale), [locale]);

  return useMemo(
    () => ({
      locale,
      messages,
      t,
      pageTitle,
      setLocale,
    }),
    [locale, messages, t, pageTitle],
  );
}