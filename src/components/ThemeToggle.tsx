import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, toggleTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="切換主題"
      title="切換主題"
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
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'on' : ''}`}
      aria-label="深色模式"
      onClick={() => {
        const next = !checked;
        applyTheme(next ? 'dark' : 'light');
        onChange(next);
      }}
    />
  );
}