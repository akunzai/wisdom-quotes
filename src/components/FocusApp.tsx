import { useEffect, useState } from 'react';
import { PageCat } from '@/components/PageCat';
import { getQuote } from '@/lib/storage/quotes';
import type { Quote } from '@/types/quote';

interface FocusAppProps {
  baseUrl: string;
}

export function FocusApp({ baseUrl }: FocusAppProps) {
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      setQuote(null);
      return;
    }
    void getQuote(id).then((q) => setQuote(q ?? null));
  }, []);

  if (quote === undefined) {
    return <div className="focus-overlay"><p className="empty-state">載入中…</p></div>;
  }

  if (!quote) {
    return (
      <div className="focus-overlay">
        <p className="empty-state">找不到這則名言</p>
        <a className="btn-secondary" href={baseUrl}>
          返回首頁
        </a>
      </div>
    );
  }

  return (
    <>
      <PageCat focusMode />
      <div className="focus-overlay">
        <a className="icon-btn focus-close" href={baseUrl} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
          ✕
        </a>
        <div className="focus-content">
          <blockquote className="focus-quote">{quote.text}</blockquote>
          <div className="focus-divider" />
          <p className="focus-author">— {quote.author || '未知'}</p>
          {quote.sourceUrl && (
            <p className="focus-source" style={{ marginTop: '1.5rem' }}>
              <a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer">
                查看原文
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  );
}