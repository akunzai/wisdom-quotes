import { useCallback, useEffect, useRef, useState } from 'react';
import { PageCat } from '@/components/PageCat';
import { useI18n } from '@/i18n/useI18n';
import { getFocusAutoIntervalMinutes } from '@/lib/prefs';
import { getQuote, listQuotes } from '@/lib/storage/quotes';
import {
  displayAuthorName,
  UNKNOWN_AUTHOR,
} from '@/lib/unknown-author';
import type { Quote } from '@/types/quote';

interface FocusAppProps {
  baseUrl: string;
}

function focusPath(baseUrl: string, id: string): string {
  return `${baseUrl}focus/?id=${encodeURIComponent(id)}`;
}

export function FocusApp({ baseUrl }: FocusAppProps) {
  const { messages: m, t } = useI18n();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [autoInterval, setAutoInterval] = useState(getFocusAutoIntervalMinutes);

  const quotesRef = useRef(quotes);
  quotesRef.current = quotes;

  const quote = quotes[index];
  const canNavigate = quotes.length > 1;

  const goToIndex = useCallback(
    (nextIndex: number) => {
      const current = quotesRef.current;
      if (current.length === 0) return;
      const wrapped = ((nextIndex % current.length) + current.length) % current.length;
      setIndex(wrapped);
      history.replaceState(null, '', focusPath(baseUrl, current[wrapped].id));
    },
    [baseUrl],
  );

  const goPrev = useCallback(() => goToIndex(index - 1), [goToIndex, index]);
  const goNext = useCallback(() => goToIndex(index + 1), [goToIndex, index]);

  useEffect(() => {
    async function load() {
      const id = new URLSearchParams(window.location.search).get('id');
      const all = await listQuotes();

      if (all.length === 0) {
        if (id) {
          const orphan = await getQuote(id);
          if (orphan) {
            setQuotes([orphan]);
            setIndex(0);
          }
        }
        setReady(true);
        return;
      }

      let nextIndex = 0;
      if (id) {
        const found = all.findIndex((q) => q.id === id);
        if (found >= 0) {
          nextIndex = found;
        } else {
          const orphan = await getQuote(id);
          if (orphan) {
            setQuotes([orphan]);
            setIndex(0);
            setReady(true);
            return;
          }
        }
      }

      setQuotes(all);
      setIndex(nextIndex);
      if (!id || all[nextIndex]?.id !== id) {
        history.replaceState(null, '', focusPath(baseUrl, all[nextIndex].id));
      }
      setReady(true);
    }

    void load();
  }, [baseUrl]);

  useEffect(() => {
    function refreshInterval() {
      setAutoInterval(getFocusAutoIntervalMinutes());
    }
    function onStorage(event: StorageEvent) {
      if (event.key === 'wq-focus-auto-minutes') refreshInterval();
    }
    function onPrefsChange(event: Event) {
      const key = (event as CustomEvent<{ key: string }>).detail?.key;
      if (key === 'wq-focus-auto-minutes') refreshInterval();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('wq-prefs-change', onPrefsChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('wq-prefs-change', onPrefsChange);
    };
  }, []);

  useEffect(() => {
    if (!ready || !canNavigate || autoInterval <= 0) return;
    const timer = window.setTimeout(() => goNext(), autoInterval * 60_000);
    return () => window.clearTimeout(timer);
  }, [ready, canNavigate, autoInterval, index, goNext]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        window.location.assign(baseUrl);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [baseUrl, goPrev, goNext]);

  if (!ready) {
    return (
      <div className="focus-overlay">
        <p className="empty-state">{m.focus.loading}</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="focus-overlay">
        <p className="empty-state">{m.focus.notFound}</p>
        <a className="btn-secondary" href={baseUrl} data-astro-reload>
          {m.focus.backHome}
        </a>
      </div>
    );
  }

  const authorKey = quote.author || UNKNOWN_AUTHOR;
  const displayAuthor = displayAuthorName(authorKey, m.unknown);
  const authorHref = `${baseUrl}?author=${encodeURIComponent(authorKey)}`;

  return (
    <>
      <PageCat focusMode />
      <div className="focus-overlay">
        <a
          className="icon-btn focus-close"
          href={baseUrl}
          data-astro-reload
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
        >
          ✕
        </a>

        {canNavigate && (
          <>
            <button
              type="button"
              className="icon-btn focus-nav focus-nav-prev"
              aria-label={m.focus.prev}
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              type="button"
              className="icon-btn focus-nav focus-nav-next"
              aria-label={m.focus.next}
              onClick={goNext}
            >
              ›
            </button>
            <p className="focus-position" aria-live="polite">
              {index + 1} / {quotes.length}
            </p>
          </>
        )}

        <div className="focus-content">
          <blockquote className="focus-quote">{quote.text}</blockquote>
          <div className="focus-divider" />
          <p className="focus-author">
            —{' '}
            <a
              className="focus-author-link"
              href={authorHref}
              aria-label={t(m.focus.browseAuthor, { author: displayAuthor })}
            >
              {displayAuthor}
            </a>
          </p>
          {quote.sourceUrl && (
            <p className="focus-source" style={{ marginTop: '1.5rem' }}>
              <a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer">
                {m.focus.viewSource}
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  );
}