async (page) => {
  await page.reload();
  const results = await page.evaluate(async () => {
    const { exportQuotes, importQuotesFromJson, restoreQuoteBackup } = await import('/wisdom-quotes/src/lib/import-export/index.ts');
    const { clearAllQuotes, createQuote } = await import('/wisdom-quotes/src/lib/storage/quotes.ts');
    const stamp = '2026-10-09T00:00:00.000Z';
    const a = { id: '00000000-0000-4000-8000-000000000001', text: 'A', author: 'Test author', sourceUrl: 'https://example.com/quote', tags: ['test'], createdAt: stamp, updatedAt: stamp, visibility: 'private' };
    const b = { ...a, id: '00000000-0000-4000-8000-000000000002', text: 'B' };
    const c = { ...a, id: '00000000-0000-4000-8000-000000000003', text: 'C', visibility: 'public' };
    const collection = (quotes) => ({ version: '1.0', exportedAt: stamp, quotes });
    await clearAllQuotes();
    await importQuotesFromJson(collection([a, b]));
    const current = await exportQuotes();
    await restoreQuoteBackup(collection([a, c]), current);
    const restored = await exportQuotes();
    if (JSON.stringify(restored.quotes) !== JSON.stringify([a, c])) throw new Error('Restore did not exactly preserve the selected collection');
    await importQuotesFromJson(collection([b]));
    let rejected = false;
    try { await restoreQuoteBackup(collection([a]), restored); } catch { rejected = true; }
    if (!rejected || (await exportQuotes()).quotes.length !== 3) throw new Error('Concurrent local changes were overwritten after recovery export');
    const beforeFailure = await exportQuotes();
    for (const invalid of [{}, collection([a, a]), { ...collection([a]), version: '99' }]) {
      rejected = false;
      try { await restoreQuoteBackup(invalid, beforeFailure); } catch { rejected = true; }
      if (!rejected || JSON.stringify((await exportQuotes()).quotes) !== JSON.stringify(beforeFailure.quotes)) throw new Error('Invalid backup changed local data');
    }
    const originalAdd = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function () { throw new DOMException('Injected storage failure', 'QuotaExceededError'); };
    rejected = false;
    try { await restoreQuoteBackup(collection([a]), beforeFailure); } catch { rejected = true; }
    finally { IDBObjectStore.prototype.add = originalAdd; }
    if (!rejected || JSON.stringify((await exportQuotes()).quotes) !== JSON.stringify(beforeFailure.quotes)) throw new Error('Failed transaction did not roll back');
    await createQuote({ text: 'Created through quote form interface', tags: ['test'] });
    await restoreQuoteBackup(collection([]), await exportQuotes());
    if ((await exportQuotes()).quotes.length !== 0) throw new Error('Empty backup restore failed');
    await importQuotesFromJson(collection([a, b]));
    await importQuotesFromJson(collection([c]));
    if ((await exportQuotes()).quotes.length !== 3) throw new Error('Existing JSON merge changed');
    return { ok: true, checks: ['exact replacement preserves all fields, IDs and timestamps', 'changed local collection prevents stale restore', 'invalid/duplicate/unsupported backup is non-destructive', 'IndexedDB failure rolls back', 'empty backup clears collection', 'JSON import still merges'] };
  });
  return results;
}
