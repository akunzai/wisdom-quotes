import { useEffect, useState } from 'react';
import type { Quote, QuoteInput } from '@/types/quote';

interface QuoteFormProps {
  open: boolean;
  initial?: Quote;
  onClose: () => void;
  onSave: (input: QuoteInput, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function QuoteForm({ open, initial, onClose, onSave, onDelete }: QuoteFormProps) {
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

  async function handleSubmit(e: React.FormEvent) {
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
            placeholder="選填"
          />
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