import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { listAuthors, seedDemoQuotesIfEmpty } from '@/lib/storage/quotes';

interface AuthorsAppProps {
  baseUrl: string;
}

export function AuthorsApp({ baseUrl }: AuthorsAppProps) {
  useEffect(() => {
    void seedDemoQuotesIfEmpty();
  }, []);

  const authors = useLiveQuery(async () => listAuthors(), []);

  return (
    <>
      <div className="quotes-header" style={{ marginBottom: '1.5rem' }}>
        <h2 className="quotes-title">作者一覽</h2>
        <span className="quotes-count">{authors?.length ?? 0} 位作者</span>
      </div>
      <div className="authors-grid">
        {(authors ?? []).map((author) => (
          <a
            key={author.name}
            className="author-card"
            href={`${baseUrl}?author=${encodeURIComponent(author.name)}`}
          >
            <p className="author-card-name">{author.name}</p>
            <p className="author-card-count">{author.count} 則名言</p>
            <p className="author-card-preview">{author.preview}</p>
          </a>
        ))}
      </div>
    </>
  );
}