import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { GoogleDrive, DriveError, type BackupFile } from "@/lib/google-drive";
import { db } from "@/lib/storage/db";
import { useI18n } from "@/i18n/useI18n";
import type { QuoteCollection } from "@/types/quote";

export function GoogleDriveBackup({ clientId }: { clientId: string }) {
  const { messages, locale, t } = useI18n();
  const m = messages.drive;
  const [drive] = useState(() => new GoogleDrive(clientId));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<keyof typeof m>();
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [listed, setListed] = useState(false);
  const [selected, setSelected] = useState("");
  const [backup, setBackup] = useState<QuoteCollection>();
  const [recovery, setRecovery] = useState<QuoteCollection>();
  const [saved, setSaved] = useState(false);
  const count = useLiveQuery(() => db.quotes.count(), [], 0);

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    void drive.prepare().then(
      () => {
        if (active) setReady(true);
      },
      () => {
        if (active) setStatus("unavailable");
      },
    );
    return () => {
      active = false;
    };
  }, [clientId, drive]);

  function resetPreview() {
    setBackup(undefined);
    setRecovery(undefined);
    setSaved(false);
  }

  function reportFailure(error: unknown) {
    if (error instanceof DriveError) setStatus(error.code);
    else if (error instanceof Error && "code" in error && error.code === "changed") {
      setStatus("changed");
      setRecovery(undefined);
      setSaved(false);
    } else setStatus("restoreFailed");
  }

  async function retryPreparation() {
    setBusy(true);
    setStatus(undefined);
    try {
      await drive.prepare();
      setReady(true);
    } catch (error) {
      reportFailure(error);
    } finally {
      setBusy(false);
    }
  }

  async function createBackup() {
    setBusy(true);
    setStatus(undefined);
    resetPreview();
    setFiles([]);
    setListed(false);
    setSelected("");
    try {
      // Invoke authorization before awaiting imports to preserve the click gesture.
      await drive.authorize();
      const { exportQuotes, parseQuoteBackup } = await import("@/lib/import-export");
      await drive.createBackup(parseQuoteBackup(await exportQuotes()));
      setStatus("backedUp");
    } catch (error) {
      reportFailure(error);
    } finally {
      setBusy(false);
    }
  }

  async function listBackups() {
    setBusy(true);
    setStatus(undefined);
    resetPreview();
    setFiles([]);
    setSelected("");
    setListed(false);
    try {
      await drive.authorize();
      setFiles(await drive.listBackups());
      setListed(true);
    } catch (error) {
      reportFailure(error);
    } finally {
      setBusy(false);
    }
  }

  async function previewRestore() {
    setBusy(true);
    setStatus(undefined);
    resetPreview();
    try {
      await drive.authorize();
      const raw = await drive.downloadBackup(selected);
      const { parseQuoteBackup } = await import("@/lib/import-export");
      setBackup(parseQuoteBackup(raw));
    } catch (error) {
      if (error instanceof DriveError) reportFailure(error);
      else setStatus("invalid");
    } finally {
      setBusy(false);
    }
  }

  async function exportRecovery() {
    setBusy(true);
    setSaved(false);
    setRecovery(undefined);
    setStatus(undefined);
    try {
      const { exportQuotes, downloadJson } = await import("@/lib/import-export");
      const current = await exportQuotes();
      downloadJson(current, `wisdom-quotes-before-restore-${Date.now()}.json`);
      setRecovery(current);
    } catch (error) {
      reportFailure(error);
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!backup || !recovery || !saved) return;
    setBusy(true);
    setStatus(undefined);
    try {
      const { restoreQuoteBackup } = await import("@/lib/import-export");
      await restoreQuoteBackup(backup, recovery);
      resetPreview();
      setStatus("restored");
    } catch (error) {
      reportFailure(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="settings-group drive-backup"
      aria-labelledby="drive-heading"
      aria-busy={busy}
    >
      <h2 id="drive-heading" className="settings-group-title">
        {m.title}
      </h2>
      <div className="drive-content">
        <p className="setting-desc">{m.description}</p>
        {!clientId ? (
          <p className="setting-desc">{m.notConfigured}</p>
        ) : (
          <>
            {status ? (
              <p role="status" className="settings-feedback">
                {m[status]}
              </p>
            ) : null}
            {busy ? <p role="status">{m.working}</p> : null}
            {!ready ? (
              status ? (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void retryPreparation()}
                >
                  {m.retry}
                </button>
              ) : (
                <p role="status">{m.loading}</p>
              )
            ) : null}
            <fieldset disabled={busy || !ready} className="drive-controls">
              <legend className="sr-only">{m.title}</legend>
              <div className="drive-actions">
                <button type="button" className="btn-secondary" onClick={() => void createBackup()}>
                  {m.backup}
                </button>
                <button type="button" className="btn-secondary" onClick={() => void listBackups()}>
                  {m.list}
                </button>
              </div>
              {listed && files.length === 0 ? <p>{m.noBackups}</p> : null}
              {files.length > 0 ? (
                <div className="drive-actions">
                  <label htmlFor="drive-version">{m.select}</label>
                  <select
                    id="drive-version"
                    className="setting-select drive-select"
                    value={selected}
                    onChange={(event) => {
                      setSelected(event.target.value);
                      resetPreview();
                    }}
                  >
                    <option value="">{m.select}</option>
                    {files.map((file) => (
                      <option key={file.id} value={file.id}>
                        {new Date(file.createdTime).toLocaleString(locale)} — {file.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={!selected}
                    onClick={() => void previewRestore()}
                  >
                    {m.preview}
                  </button>
                </div>
              ) : null}
              {backup ? (
                <div className="drive-preview">
                  <p>
                    {t(m.backupTime, { time: new Date(backup.exportedAt).toLocaleString(locale) })}
                  </p>
                  <p>{t(m.counts, { backup: backup.quotes.length, local: count })}</p>
                  <p>{m.replaceWarning}</p>
                  {backup.quotes.length === 0 ? (
                    <p className="drive-warning">{m.emptyWarning}</p>
                  ) : null}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => void exportRecovery()}
                  >
                    {m.exportFirst}
                  </button>
                  <label className="drive-confirm">
                    <input
                      type="checkbox"
                      disabled={!recovery}
                      checked={saved}
                      onChange={(event) => setSaved(event.target.checked)}
                    />
                    {m.saved}
                  </label>
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={!recovery || !saved}
                    onClick={() => void restore()}
                  >
                    {m.restore}
                  </button>
                </div>
              ) : null}
            </fieldset>
          </>
        )}
      </div>
    </section>
  );
}
