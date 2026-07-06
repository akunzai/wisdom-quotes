import { useLiveQuery } from 'dexie-react-hooks';
import { listAuthors } from '@/lib/storage/quotes';

interface AuthorsAppProps {
  baseUrl: string;
}

export function AuthorsApp({ baseUrl }: AuthorsAppProps) {
  const authors = useLiveQuery(async () => listAuthors(), []);

  return (
    <>
      <div className="quotes-header" style={{ marginBottom: '1.5rem' }}>
        <h2 className="quotes-title">作者一覽</h2>
        <span className="quotes-count">{authors?.length ?? 0} 位作者</span>
      </div>
      {(authors ?? []).length === 0 ? (
        <p className="empty-state">尚無作者，可至設定匯入範例語錄</p>
      ) : (
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
      )}
    </>
  );
}