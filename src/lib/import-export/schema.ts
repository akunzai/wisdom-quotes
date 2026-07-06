import { z } from 'zod';

export const quoteSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  author: z.string().optional(),
  sourceUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  visibility: z.enum(['private', 'public']).default('private'),
});

export const quoteCollectionSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  quotes: z.array(quoteSchema),
});

export type QuoteCollectionParsed = z.infer<typeof quoteCollectionSchema>;