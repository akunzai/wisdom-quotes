import { useEffect, useState } from 'react';
import { ThemeSwitch } from '@/components/ThemeToggle';
import { downloadJson, exportQuotes, importQuotesFromJson } from '@/lib/import-export';
import { getPetsEnabled, setPetsEnabled } from '@/lib/prefs';
import { getStoredTheme } from '@/lib/theme';

export function SettingsApp() {
  const [dark, setDark] = useState(false);
  const [pets, setPets] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDark(getStoredTheme() === 'dark');
    setPets(getPetsEnabled());
  }, []);

  async function handleExport() {
    const data = await exportQuotes();
    downloadJson(data, `wisdom-quotes-${new Date().toISOString().slice(0, 10)}.json`);
    setMessage('已匯出 JSON 備份');
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const result = await importQuotesFromJson(raw);
      setMessage(`匯入完成：新增 ${result.imported} 則、更新 ${result.updated} 則`);
    } catch {
      setMessage('匯入失敗，請確認檔案格式');
    }
  }

  return (
    <div className="settings-section">
      {message && <p className="setting-desc" style={{ marginBottom: '1rem' }}>{message}</p>}

      <div className="settings-group">
        <p className="settings-group-title">外觀</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">深色模式</p>
            <p className="setting-desc">切換明暗主題</p>
          </div>
          <ThemeSwitch checked={dark} onChange={setDark} />
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">網頁小夥伴</p>
            <p className="setting-desc">在頁面陪伴的小貓，會偶爾停在名言旁閱讀</p>
          </div>
          <button
            type="button"
            className={`toggle ${pets ? 'on' : ''}`}
            aria-label="網頁小夥伴"
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
        <p className="settings-group-title">資料</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">匯出 JSON</p>
            <p className="setting-desc">下載所有名言為備份檔</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void handleExport()}>
            匯出
          </button>
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">匯入 JSON</p>
            <p className="setting-desc">從備份檔還原名言</p>
          </div>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            匯入
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">Google Drive 同步</p>
            <p className="setting-desc">Phase 2 — 尚未實作</p>
          </div>
          <button type="button" className="btn-secondary" disabled style={{ opacity: 0.4 }}>
            連結
          </button>
        </div>
      </div>
    </div>
  );
}