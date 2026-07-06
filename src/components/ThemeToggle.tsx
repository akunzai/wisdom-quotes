import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { applyTheme, getStoredTheme, toggleTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const { messages: m } = useI18n();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={m.theme.toggle}
      title={m.theme.toggle}
      onClick={() => setTheme(toggleTheme())}
    >
      {theme === 'light' ? '☀' : '☾'}
    </button>
  );
}

export function ThemeSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (dark: boolean) => void;
}) {
  const { messages: m } = useI18n();

  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      aria-label={m.theme.dark}
      onClick={() => {
        const next = !checked;
        applyTheme(next ? 'dark' : 'light');
        onChange(next);
      }}
    />
  );
}