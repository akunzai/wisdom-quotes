import { useI18n } from '@/i18n/useI18n';
import { displayAuthorName, UNKNOWN_AUTHOR } from '@/lib/unknown-author';
import type { Quote } from '@/types/quote';

interface QuoteCardProps {
  quote: Quote;
  baseUrl: string;
  onEdit: (quote: Quote) => void;
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
    </svg>
  );
}

export function QuoteCard({ quote, baseUrl, onEdit }: QuoteCardProps) {
  const { messages: m, t } = useI18n();
  const focusHref = `${baseUrl}focus/?id=${encodeURIComponent(quote.id)}`;

  return (
    <article className="quote-card">
      <a
        className="quote-card-hit"
        href={focusHref}
        aria-label={t(m.card.focusRead, { text: quote.text })}
      />
      <p className="quote-text">{quote.text}</p>
      <div className="quote-meta">
        <span className="quote-author">
          {displayAuthorName(quote.author || UNKNOWN_AUTHOR, m.unknown)}
        </span>
        <div className="quote-actions">
          {quote.sourceUrl && (
            <a
              className="quote-icon-btn"
              href={quote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={m.card.viewSource}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon />
            </a>
          )}
          <button
            type="button"
            className="quote-icon-btn"
            aria-label={m.card.edit}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(quote);
            }}
          >
            <EditIcon />
          </button>
        </div>
      </div>
    </article>
  );
}