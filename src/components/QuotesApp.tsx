import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { QuoteCard } from '@/components/QuoteCard';
import { QuoteForm } from '@/components/QuoteForm';
import { db } from '@/lib/storage/db';
import {
  createQuote,
  deleteQuote,
  seedDemoQuotesIfEmpty,
  updateQuote,
} from '@/lib/storage/quotes';
import type { Quote, QuoteInput } from '@/types/quote';

interface QuotesAppProps {
  baseUrl: string;
  authorFilter?: string;
}

export function QuotesApp({ baseUrl, authorFilter }: QuotesAppProps) {
  const [query, setQuery] = useState('');
  const [sidebarAuthor, setSidebarAuthor] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | undefined>();

  useEffect(() => {
    void seedDemoQuotesIfEmpty();
    const params = new URLSearchParams(window.location.search);
    const author = params.get('author');
    if (author) setSidebarAuthor(decodeURIComponent(author));
  }, []);

  const quotes = useLiveQuery(() => db.quotes.orderBy('updatedAt').reverse().toArray(), []);

  const authors = useMemo(() => {
    const map = new Map<string, number>();
    for (const quote of quotes ?? []) {
      const name = quote.author || '未知';
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-Hant'));
  }, [quotes]);

  const hero = quotes?.[0];

  const filtered = useMemo(() => {
    if (!quotes) return [];
    const q = query.trim().toLowerCase();
    const author = authorFilter ?? (sidebarAuthor === 'all' ? undefined : sidebarAuthor);

    return quotes.filter((quote) => {
      const matchAuthor =
        !author ||
        (author === '未知' ? !quote.author : quote.author === author);
      const matchSearch =
        !q ||
        quote.text.toLowerCase().includes(q) ||
        (quote.author?.toLowerCase().includes(q) ?? false);
      return matchAuthor && matchSearch;
    });
  }, [quotes, query, sidebarAuthor, authorFilter]);

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

  return (
    <>
      {hero && !authorFilter && (
        <section className="hero">
          <p className="hero-eyebrow">每日一思</p>
          <blockquote className="hero-quote">{hero.text}</blockquote>
          <p className="hero-author">
            — <em>{hero.author || '未知'}</em>
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
            placeholder="搜尋名言或作者…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜尋名言"
          />
        </div>
        <button type="button" className="btn-primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          新增名言
        </button>
      </div>

      <div className="main-layout">
        {!authorFilter && (
          <aside className="sidebar">
            <p className="sidebar-label">依作者瀏覽</p>
            <ul className="author-list">
              <li>
                <a
                  className={`author-item ${sidebarAuthor === 'all' ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => { e.preventDefault(); setSidebarAuthor('all'); }}
                >
                  <span>全部</span>
                  <span>{quotes?.length ?? 0}</span>
                </a>
              </li>
              {authors.map(([name, count]) => (
                <li key={name}>
                  <a
                    className={`author-item ${sidebarAuthor === name ? 'active' : ''}`}
                    href={`${baseUrl}?author=${encodeURIComponent(name)}`}
                  >
                    <span>{name}</span>
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
              {authorFilter ? `${authorFilter} 的名言` : '我的名言'}
            </h2>
            <span className="quotes-count">{filtered.length} 則</span>
          </div>

          {filtered.length === 0 ? (
            <p className="empty-state">尚無符合條件的名言</p>
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
        onClose={() => { setFormOpen(false); setEditing(undefined); }}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </>
  );
}