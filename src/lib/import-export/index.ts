import { db } from '@/lib/storage/db';
import { quoteCollectionSchema } from '@/lib/import-export/schema';
import type { Quote, QuoteCollection } from '@/types/quote';

export async function exportQuotes(): Promise<QuoteCollection> {
  const quotes = await db.quotes.toArray();
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    quotes,
  };
}

export function downloadJson(data: QuoteCollection, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importQuotesFromJson(
  raw: unknown,
): Promise<{ imported: number; updated: number }> {
  const parsed = quoteCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('匯入檔案格式不正確');
  }

  let imported = 0;
  let updated = 0;

  await db.transaction('rw', db.quotes, async () => {
    for (const quote of parsed.data.quotes) {
      const existing = await db.quotes.get(quote.id);
      if (!existing) {
        await db.quotes.add(quote as Quote);
        imported += 1;
        continue;
      }

      if (new Date(quote.updatedAt) > new Date(existing.updatedAt)) {
        await db.quotes.put(quote as Quote);
        updated += 1;
      }
    }
  });

  return { imported, updated };
}