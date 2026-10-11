import { withBase } from "@/lib/base-url";
import { db } from "@/lib/storage/db";
import { quoteCollectionSchema } from "@/lib/import-export/schema";
import type { Quote, QuoteCollection } from "@/types/quote";

export async function exportQuotes(): Promise<QuoteCollection> {
  const quotes = await db.quotes.toArray();
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    quotes,
  };
}

export function downloadJson(data: QuoteCollection, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
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
    throw new Error("匯入檔案格式不正確");
  }

  let imported = 0;
  let updated = 0;

  await db.transaction("rw", db.quotes, async () => {
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

export class BackupError extends Error {
  code: "invalid" | "changed";

  constructor(code: "invalid" | "changed") {
    super(code);
    this.code = code;
  }
}

export function parseQuoteBackup(raw: unknown): QuoteCollection {
  const parsed = quoteCollectionSchema.safeParse(raw);
  if (!parsed.success || parsed.data.version !== "1.0") throw new BackupError("invalid");
  const ids = new Set(parsed.data.quotes.map((quote) => quote.id));
  if (ids.size !== parsed.data.quotes.length) throw new BackupError("invalid");
  return parsed.data;
}

function collectionContent(collection: QuoteCollection): string {
  return JSON.stringify([...collection.quotes].sort((a, b) => a.id.localeCompare(b.id)));
}

export async function restoreQuoteBackup(raw: unknown, current: QuoteCollection): Promise<void> {
  const parsed = parseQuoteBackup(raw);
  const expected = collectionContent(parseQuoteBackup(current));
  await db.transaction("rw", db.quotes, async () => {
    const latest = await exportQuotes();
    if (collectionContent(parseQuoteBackup(latest)) !== expected) throw new BackupError("changed");
    await db.quotes.clear();
    await db.quotes.bulkAdd(parsed.quotes);
  });
}

export async function importDemoQuotes(): Promise<{ imported: number; updated: number }> {
  const response = await fetch(withBase("demo-quotes.json"));
  if (!response.ok) {
    throw new Error("無法載入範例語錄");
  }
  const raw: unknown = await response.json();
  return importQuotesFromJson(raw);
}
