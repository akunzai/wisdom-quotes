import { SUPPORTED_LOCALES, type Locale } from '@/i18n/index';
import { useI18n, setLocale } from '@/i18n/useI18n';

const LOCALE_LABELS = {
  'zh-Hant': 'zhHant',
  en: 'en',
  ja: 'ja',
} as const satisfies Record<Locale, 'zhHant' | 'en' | 'ja'>;

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, messages: m } = useI18n();

  return (
    <select
      className={compact ? 'locale-select locale-select-compact' : 'setting-select locale-select'}
      aria-label={m.settings.language}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {m.locale[LOCALE_LABELS[loc]]}
        </option>
      ))}
    </select>
  );
}