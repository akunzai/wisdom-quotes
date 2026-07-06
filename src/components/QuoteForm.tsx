import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import type { Quote, QuoteInput } from '@/types/quote';

interface QuoteFormProps {
  open: boolean;
  initial?: Quote;
  authorOptions?: string[];
  onClose: () => void;
  onSave: (input: QuoteInput, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const AUTHOR_LIST_ID = 'wq-author-list';

export function QuoteForm({
  open,
  initial,
  authorOptions = [],
  onClose,
  onSave,
  onDelete,
}: QuoteFormProps) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText(initial?.text ?? '');
    setAuthor(initial?.author ?? '');
    setSourceUrl(initial?.sourceUrl ?? '');
  }, [open, initial]);

  const authorMatches = useMemo(() => {
    const query = author.trim().toLowerCase();
    const filtered = query
      ? authorOptions.filter((name) => name.toLowerCase().includes(query))
      : authorOptions;
    return filtered.filter((name) => name !== author.trim()).slice(0, 10);
  }, [author, authorOptions]);

  if (!open) return null;

  async function handleDelete() {
    if (!initial || !onDelete) return;
    if (!confirm('確定要刪除這則名言？此操作無法復原。')) return;
    setSaving(true);
    try {
      await onDelete(initial.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          text,
          author: author || undefined,
          sourceUrl: sourceUrl || undefined,
        },
        initial?.id,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="名言表單">
      <form className="modal-card" onSubmit={handleSubmit}>
        <h2 className="modal-title">{initial ? '編輯名言' : '新增名言'}</h2>
        <label className="field">
          <span>名言內容 *</span>
          <textarea
            required
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="輸入名言…"
          />
        </label>
        <label className="field">
          <span>作者</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            list={authorOptions.length > 0 ? AUTHOR_LIST_ID : undefined}
            placeholder="選填或選擇既有作者"
            autoComplete="off"
          />
          {authorOptions.length > 0 && (
            <datalist id={AUTHOR_LIST_ID}>
              {authorOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
          {authorMatches.length > 0 && (
            <div className="author-suggestions" role="listbox" aria-label="既有作者">
              {authorMatches.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="author-chip"
                  role="option"
                  onClick={() => setAuthor(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="field">
          <span>原文連結</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://"
          />
        </label>
        <div className="modal-actions">
          {initial && onDelete && (
            <button
              type="button"
              className="btn-danger"
              disabled={saving}
              onClick={() => void handleDelete()}
            >
              刪除
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>
      </form>
    </div>
  );
}