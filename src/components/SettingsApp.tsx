import { useEffect, useState } from 'react';
import { ThemeSwitch } from '@/components/ThemeToggle';
import {
  downloadJson,
  exportQuotes,
  importDemoQuotes,
  importQuotesFromJson,
} from '@/lib/import-export';
import {
  FOCUS_AUTO_INTERVAL_OPTIONS,
  getFocusAutoIntervalMinutes,
  getPetsEnabled,
  setFocusAutoIntervalMinutes,
  setPetsEnabled,
} from '@/lib/prefs';
import { clearAllQuotes } from '@/lib/storage/quotes';
import { getStoredTheme } from '@/lib/theme';

export function SettingsApp() {
  const [dark, setDark] = useState(false);
  const [pets, setPets] = useState(true);
  const [focusAutoMinutes, setFocusAutoMinutes] = useState(5);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDark(getStoredTheme() === 'dark');
    setPets(getPetsEnabled());
    setFocusAutoMinutes(getFocusAutoIntervalMinutes());
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

  async function handleImportDemo() {
    try {
      const result = await importDemoQuotes();
      setMessage(`範例語錄：新增 ${result.imported} 則、更新 ${result.updated} 則`);
    } catch {
      setMessage('無法載入範例語錄');
    }
  }

  async function handleClearAll() {
    if (
      !window.confirm('確定要刪除所有本地名言？此動作無法復原，建議先匯出備份。')
    ) {
      return;
    }
    const removed = await clearAllQuotes();
    setMessage(removed > 0 ? `已清空 ${removed} 則名言` : '目前沒有名言可清空');
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
        <p className="settings-group-title">專注模式</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">自動切換名言</p>
            <p className="setting-desc">專注模式下每隔一段時間自動顯示下一則名言</p>
          </div>
          <select
            className="setting-select"
            aria-label="自動切換名言間隔"
            value={focusAutoMinutes}
            onChange={(e) => {
              const minutes = Number.parseInt(e.target.value, 10);
              setFocusAutoMinutes(minutes);
              setFocusAutoIntervalMinutes(minutes);
            }}
          >
            {FOCUS_AUTO_INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <p className="settings-group-title">資料</p>
        <div className="setting-row">
          <div>
            <p className="setting-label">匯入範例語錄</p>
            <p className="setting-desc">載入 50 則精選智慧語錄，方便初次體驗</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => void handleImportDemo()}>
            匯入範例
          </button>
        </div>
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
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="setting-row">
          <div>
            <p className="setting-label">清空本地語錄</p>
            <p className="setting-desc">刪除瀏覽器內所有名言，無法復原</p>
          </div>
          <button type="button" className="btn-danger" onClick={() => void handleClearAll()}>
            清空
          </button>
        </div>
      </div>
    </div>
  );
}