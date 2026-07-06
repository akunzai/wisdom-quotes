import { useEffect, useMemo, useState, type SubmitEvent } from 'react';
import { useI18n } from '@/i18n/useI18n';
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
  const { messages: m } = useI18n();
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
    if (!confirm(m.form.confirmDelete)) return;
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
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={m.form.dialogLabel}>
      <form className="modal-card" onSubmit={handleSubmit}>
        <h2 className="modal-title">{initial ? m.form.editTitle : m.form.addTitle}</h2>
        <label className="field">
          <span>{m.form.text}</span>
          <textarea
            required
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={m.form.textPlaceholder}
          />
        </label>
        <label className="field">
          <span>{m.form.author}</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            list={authorOptions.length > 0 ? AUTHOR_LIST_ID : undefined}
            placeholder={m.form.authorPlaceholder}
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
            <div className="author-suggestions" role="listbox" aria-label={m.form.existingAuthors}>
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
          <span>{m.form.sourceUrl}</span>
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
              {m.form.delete}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            {m.form.cancel}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? m.form.saving : m.form.save}
          </button>
        </div>
      </form>
    </div>
  );
}