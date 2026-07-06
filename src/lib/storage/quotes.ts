import { db } from '@/lib/storage/db';
import type { Quote, QuoteInput } from '@/types/quote';

function nowIso(): string {
  return new Date().toISOString();
}

export async function listQuotes(): Promise<Quote[]> {
  return db.quotes.orderBy('updatedAt').reverse().toArray();
}

export async function getQuote(id: string): Promise<Quote | undefined> {
  return db.quotes.get(id);
}

export async function createQuote(input: QuoteInput): Promise<Quote> {
  const timestamp = nowIso();
  const quote: Quote = {
    id: crypto.randomUUID(),
    text: input.text.trim(),
    author: input.author?.trim() || undefined,
    sourceUrl: input.sourceUrl?.trim() || undefined,
    tags: input.tags,
    createdAt: timestamp,
    updatedAt: timestamp,
    visibility: input.visibility ?? 'private',
  };
  await db.quotes.add(quote);
  return quote;
}

export async function updateQuote(
  id: string,
  input: Partial<QuoteInput>,
): Promise<Quote | undefined> {
  const existing = await db.quotes.get(id);
  if (!existing) return undefined;

  const updated: Quote = {
    ...existing,
    text: input.text !== undefined ? input.text.trim() : existing.text,
    author:
      input.author !== undefined
        ? input.author.trim() || undefined
        : existing.author,
    sourceUrl:
      input.sourceUrl !== undefined
        ? input.sourceUrl.trim() || undefined
        : existing.sourceUrl,
    tags: input.tags ?? existing.tags,
    visibility: input.visibility ?? existing.visibility,
    updatedAt: nowIso(),
  };

  await db.quotes.put(updated);
  return updated;
}

export async function deleteQuote(id: string): Promise<void> {
  await db.quotes.delete(id);
}

export async function searchQuotes(query: string): Promise<Quote[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listQuotes();

  const all = await listQuotes();
  return all.filter(
    (quote) =>
      quote.text.toLowerCase().includes(q) ||
      (quote.author?.toLowerCase().includes(q) ?? false),
  );
}

export async function listQuotesByAuthor(author: string): Promise<Quote[]> {
  const all = await listQuotes();
  if (author === '未知') {
    return all.filter((quote) => !quote.author);
  }
  return all.filter((quote) => quote.author === author);
}

export async function listAuthors(): Promise<
  { name: string; count: number; preview: string }[]
> {
  const all = await listQuotes();
  const map = new Map<string, Quote[]>();

  for (const quote of all) {
    const name = quote.author || '未知';
    const list = map.get(name) ?? [];
    list.push(quote);
    map.set(name, list);
  }

  return [...map.entries()]
    .map(([name, quotes]) => ({
      name,
      count: quotes.length,
      preview: quotes[0]?.text ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

export async function seedDemoQuotesIfEmpty(): Promise<void> {
  const count = await db.quotes.count();
  if (count > 0) return;

  const demos: QuoteInput[] = [
    { text: '未經審視的人生不值得過。', author: '蘇格拉底' },
    { text: '上善若水，水善利萬物而不爭。', author: '老子' },
    { text: '想像力比知識更重要。', author: '愛因斯坦' },
    { text: '每個人都有陰暗面，關鍵在於你是否願意面對它。', author: '村上春樹' },
    { text: '知之者不如好之者，好之者不如樂之者。' },
    { text: '我思故我在。' },
  ];

  for (const demo of demos) {
    await createQuote(demo);
  }
}