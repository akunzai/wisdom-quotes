import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { QuoteCard } from '@/components/QuoteCard';
import { QuoteForm } from '@/components/QuoteForm';
import { useI18n } from '@/i18n/useI18n';
import { pickDailyItem } from '@/lib/daily-quote';
import { db } from '@/lib/storage/db';
import { createQuote, deleteQuote, updateQuote } from '@/lib/storage/quotes';
import {
  displayAuthorName,
  isUnknownAuthor,
  UNKNOWN_AUTHOR,
} from '@/lib/unknown-author';
import type { Quote, QuoteInput } from '@/types/quote';

interface QuotesAppProps {
  baseUrl: string;
  authorFilter?: string;
}

export function QuotesApp({ baseUrl, authorFilter }: QuotesAppProps) {
  const { locale, messages: m, t } = useI18n();
  const [query, setQuery] = useState('');
  const [sidebarAuthor, setSidebarAuthor] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const author = params.get('author');
    if (author) setSidebarAuthor(decodeURIComponent(author));
  }, []);

  const quotes = useLiveQuery(() => db.quotes.orderBy('updatedAt').reverse().toArray(), []);

  const authors = useMemo(() => {
    const map = new Map<string, number>();
    for (const quote of quotes ?? []) {
      const name = quote.author || UNKNOWN_AUTHOR;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], locale));
  }, [quotes, locale]);

  const authorOptions = useMemo(
    () => authors.map(([name]) => name).filter((name) => !isUnknownAuthor(name)),
    [authors],
  );

  const hero = useMemo(() => pickDailyItem(quotes ?? []), [quotes]);
  const activeAuthor =
    authorFilter ?? (sidebarAuthor === 'all' ? undefined : sidebarAuthor);

  const filtered = useMemo(() => {
    if (!quotes) return [];
    const q = query.trim().toLowerCase();
    const author = activeAuthor;

    return quotes.filter((quote) => {
      const matchAuthor =
        !author ||
        (isUnknownAuthor(author) ? !quote.author : quote.author === author);
      const matchSearch =
        !q ||
        quote.text.toLowerCase().includes(q) ||
        (quote.author?.toLowerCase().includes(q) ?? false);
      return matchAuthor && matchSearch;
    });
  }, [quotes, query, activeAuthor]);

  async function handleSave(input: QuoteInput, id?: string) {
    if (id) {
      await updateQuote(id, input);
      return;
    }
    await createQuote(input);
  }

  async function handleDelete(id: string) {
    await deleteQuote(id);
  }

  const activeAuthorLabel = activeAuthor
    ? displayAuthorName(activeAuthor, m.unknown)
    : undefined;

  return (
    <>
      {hero && !authorFilter && (
        <section className="hero">
          <p className="hero-eyebrow">{m.hero.eyebrow}</p>
          <blockquote className="hero-quote">{hero.text}</blockquote>
          <p className="hero-author">
            — <em>{displayAuthorName(hero.author || UNKNOWN_AUTHOR, m.unknown)}</em>
          </p>
        </section>
      )}

      <div className="search-bar">
        <div className="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="search-input"
            type="search"
            placeholder={m.search.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={m.search.label}
          />
        </div>
        <button type="button" className="btn-primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          {m.quotes.add}
        </button>
      </div>

      <div className="main-layout">
        {!authorFilter && (
          <aside className="sidebar">
            <p className="sidebar-label">{m.sidebar.browseByAuthor}</p>
            <ul className="author-list">
              <li>
                <a
                  className={`author-item ${sidebarAuthor === 'all' ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); setSidebarAuthor('all'); }}
                >
                  <span>{m.sidebar.all}</span>
                  <span>{quotes?.length ?? 0}</span>
                </a>
              </li>
              {authors.map(([name, count]) => (
                <li key={name}>
                  <a
                    className={`author-item ${sidebarAuthor === name ? 'active' : ''}`}
                    href={`${baseUrl}?author=${encodeURIComponent(name)}`}
                  >
                    <span>{displayAuthorName(name, m.unknown)}</span>
                    <span>{count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <section>
          <div className="quotes-header">
            <h2 className="quotes-title">
              {activeAuthorLabel
                ? t(m.quotes.byAuthor, { author: activeAuthorLabel })
                : m.quotes.my}
            </h2>
            <span className="quotes-count">{t(m.quotes.count, { count: filtered.length })}</span>
          </div>

          {filtered.length === 0 ? (
            <p className="empty-state">
              {quotes?.length === 0 ? m.quotes.empty : m.quotes.emptyFiltered}
            </p>
          ) : (
            <div className="quote-grid">
              {filtered.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  baseUrl={baseUrl}
                  onEdit={(q) => { setEditing(q); setFormOpen(true); }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <QuoteForm
        open={formOpen}
        initial={editing}
        authorOptions={authorOptions}
        onClose={() => { setFormOpen(false); setEditing(undefined); }}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </>
  );
}