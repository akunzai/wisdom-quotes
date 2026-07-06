import { useLiveQuery } from 'dexie-react-hooks';
import { useI18n } from '@/i18n/useI18n';
import { listAuthors } from '@/lib/storage/quotes';
import { displayAuthorName } from '@/lib/unknown-author';

interface AuthorsAppProps {
  baseUrl: string;
}

export function AuthorsApp({ baseUrl }: AuthorsAppProps) {
  const { locale, messages: m, t } = useI18n();
  const authors = useLiveQuery(async () => listAuthors(locale), [locale]);

  return (
    <>
      <div className="quotes-header" style={{ marginBottom: '1.5rem' }}>
        <h2 className="quotes-title">{m.authors.title}</h2>
        <span className="quotes-count">
          {t(m.authors.count, { count: authors?.length ?? 0 })}
        </span>
      </div>
      {(authors ?? []).length === 0 ? (
        <p className="empty-state">{m.authors.empty}</p>
      ) : (
        <div className="authors-grid">
          {(authors ?? []).map((author) => (
            <a
              key={author.name}
              className="author-card"
              href={`${baseUrl}?author=${encodeURIComponent(author.name)}`}
            >
              <p className="author-card-name">
                {displayAuthorName(author.name, m.unknown)}
              </p>
              <p className="author-card-count">
                {t(m.authors.quotesCount, { count: author.count })}
              </p>
              <p className="author-card-preview">{author.preview}</p>
            </a>
          ))}
        </div>
      )}
    </>
  );
}