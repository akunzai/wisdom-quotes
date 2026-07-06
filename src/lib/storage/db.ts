import Dexie, { type Table } from 'dexie';
import type { Quote } from '@/types/quote';

export class QuoteDatabase extends Dexie {
  quotes!: Table<Quote, string>;

  constructor() {
    super('WisdomQuotesDB');
    this.version(1).stores({
      quotes: 'id, author, createdAt, updatedAt, visibility, *tags',
    });
  }
}

export const db = new QuoteDatabase();