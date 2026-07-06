import { useEffect, useState } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeSwitch } from '@/components/ThemeToggle';
import { FOCUS_AUTO_INTERVAL_VALUES, focusIntervalLabel } from '@/i18n/index';
import { useI18n } from '@/i18n/useI18n';
import {
  getFocusAutoIntervalMinutes,
  getPetsEnabled,
  setFocusAutoIntervalMinutes,
  setPetsEnabled,
} from '@/lib/prefs';
import { getStoredTheme } from '@/lib/theme';

export function SettingsApp() {
  const { locale, messages: m, t } = useI18n();
  const [dark, setDark] = useState(false);
  const [pets, setPets] = useState(true);
  const [focusAutoMinutes, setFocusAutoMinutes] = useState(5);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [importingDemo, setImportingDemo] = useState(false);

  useEffect(() => {
    setDark(getStoredTheme() === 'dark');
    setPets(getPetsEnabled());
    setFocusAutoMinutes(getFocusAutoIntervalMinutes());
    setReady(true);
  }, []);

  async function handleExport() {
    const { exportQuotes, downloadJson } = await import('@/lib/import-export');
    const data = await exportQuotes();
    downloadJson(data, `wisdom-quotes-${new Date().toISOString().slice(0, 10)}.json`);
    setMessage(m.settings.exported);
  }

  async function handleImport(file: File) {
    try {
      const { importQuotesFromJson } = await import('@/lib/import-export');
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const result = await importQuotesFromJson(raw);
      setMessage(t(m.settings.importDone, { imported: result.imported, updated: result.updated }));
    } catch {
      setMessage(m.settings.importFailed);
    }
  }

  async function handleImportDemo() {
    if (!ready || importingDemo) return;
    setImportingDemo(true);
    try {
      const { importDemoQuotes } = await import('@/lib/import-export');
      const result = await importDemoQuotes();
      if (result.imported === 0 && result.updated === 0) {
        setMessage(m.settings.demoAlreadyLoaded);
      } else {
        setMessage(t(m.settings.demoDone, { imported: result.imported, updated: result.updated }));
      }
    } catch {
      setMessage(m.settings.demoFailed);
    } finally {
      setImportingDemo(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm(m.settings.clearConfirm)) {
      return;
    }
    const { clearAllQuotes } = await import('@/lib/storage/quotes');
    const removed = await clearAllQuotes();
    setMessage(
      removed > 0
        ? t(m.settings.cleared, { count: removed })
        : m.settings.nothingToClear,
    );
  }

  return (
    <div className="settings-section" data-settings-ready={ready || undefined}>
      {message && (
        <p className="settings-feedback setting-desc" style={{ marginBottom: '1rem' }}>
          {message}
        </p>
      )}

      <div className="settings-group">
        <p className="settings-group-title">{m.settings.appearance}</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.language}</p>
            <p className="setting-desc">{m.settings.languageDesc}</p>
          </div>
          <LocaleSwitcher />
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.darkMode}</p>
            <p className="setting-desc">{m.settings.darkModeDesc}</p>
          </div>
          <ThemeSwitch checked={dark} onChange={setDark} />
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.pets}</p>
            <p className="setting-desc">{m.settings.petsDesc}</p>
          </div>
          <button
            type="button"
            className={`toggle ${pets ? 'on' : ''}`}
            aria-label={m.settings.pets}
            onClick={() => {
              const next = !pets;
              setPets(next);
              setPetsEnabled(next);
              window.location.reload();
            }}
          />
        </div>
      </div>

      <div className="settings-group">
        <p className="settings-group-title">{m.settings.focusGroup}</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.focusAuto}</p>
            <p className="setting-desc">{m.settings.focusAutoDesc}</p>
          </div>
          <select
            className="setting-select"
            aria-label={m.settings.focusAutoLabel}
            value={focusAutoMinutes}
            onChange={(e) => {
              const minutes = Number.parseInt(e.target.value, 10);
              setFocusAutoMinutes(minutes);
              setFocusAutoIntervalMinutes(minutes);
            }}
          >
            {FOCUS_AUTO_INTERVAL_VALUES.map((value) => (
              <option key={value} value={value}>
                {focusIntervalLabel(locale, value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <p className="settings-group-title">{m.settings.data}</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.importDemo}</p>
            <p className="setting-desc">{m.settings.importDemoDesc}</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            disabled={!ready || importingDemo}
            aria-busy={importingDemo || undefined}
            onClick={() => void handleImportDemo()}
          >
            {m.settings.importDemoBtn}
          </button>
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.export}</p>
            <p className="setting-desc">{m.settings.exportDesc}</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void handleExport()}>
            {m.settings.exportBtn}
          </button>
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.import}</p>
            <p className="setting-desc">{m.settings.importDesc}</p>
          </div>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            {m.settings.importBtn}
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">{m.settings.clear}</p>
            <p className="setting-desc">{m.settings.clearDesc}</p>
          </div>
          <button type="button" className="btn-danger" onClick={() => void handleClearAll()}>
            {m.settings.clearBtn}
          </button>
        </div>
      </div>
    </div>
  );
}