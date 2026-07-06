export type QuoteVisibility = 'private' | 'public';

export interface Quote {
  id: string;
  text: string;
  author?: string;
  sourceUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  visibility: QuoteVisibility;
}

export interface QuoteCollection {
  version: string;
  exportedAt: string;
  quotes: Quote[];
}

export interface QuoteInput {
  text: string;
  author?: string;
  sourceUrl?: string;
  tags?: string[];
  visibility?: QuoteVisibility;
}