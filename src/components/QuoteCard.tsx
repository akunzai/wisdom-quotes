import type { Quote } from '@/types/quote';

interface QuoteCardProps {
  quote: Quote;
  baseUrl: string;
  onEdit: (quote: Quote) => void;
}

export function QuoteCard({ quote, baseUrl, onEdit }: QuoteCardProps) {
  return (
    <article className="quote-card">
      <p className="quote-text">{quote.text}</p>
      <div className="quote-meta">
        <span className="quote-author">{quote.author || '未知'}</span>
        <div className="quote-actions">
          <a className="quote-action-btn" href={`${baseUrl}focus/?id=${encodeURIComponent(quote.id)}`}>
            專注
          </a>
          <button
            type="button"
            className="quote-action-btn"
            onClick={() => onEdit(quote)}
          >
            編輯
          </button>
        </div>
      </div>
    </article>
  );
}