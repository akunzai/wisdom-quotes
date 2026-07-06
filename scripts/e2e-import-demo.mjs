async (page) => {
  const base = '__E2E_BASE__';

  await page.goto(base);
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(
        (db) =>
          db.name &&
          new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(db.name);
            req.onsuccess = () => resolve(undefined);
            req.onerror = () => resolve(undefined);
            req.onblocked = () => resolve(undefined);
          }),
      ),
    );
  });
  await page.reload();
  await page.waitForSelector('.site-header', { timeout: 10000 });

  const quotesBefore = await page.locator('article').count();

  // Client-side navigation (reproduces user flow after View Transitions)
  await page.locator('.site-nav a[data-nav-id="settings"]').click();
  await page.waitForURL(/\/settings\/?/);
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-astro-transition'),
    { timeout: 5000 },
  );
  await page.waitForSelector('[data-settings-ready]', { timeout: 10000 });

  await page.getByRole('button', { name: '匯入範例' }).click();
  await page.waitForSelector('.settings-feedback', { timeout: 10000 });

  const feedback = ((await page.locator('.settings-feedback').textContent()) || '').trim();
  const failed = feedback.includes('無法') || feedback.includes('Could not');
  const alreadyLoaded = feedback.includes('已在收藏') || feedback.includes('already in your collection');
  const importedMatch = feedback.match(/新增\s*(\d+)|(\d+)\s*added|(\d+)\s*件追加/);
  const imported = Number(importedMatch?.[1] || importedMatch?.[2] || importedMatch?.[3] || 0);

  await page.locator('.site-nav a[data-nav-id="quotes"]').click();
  await page.waitForURL(/\/wisdom-quotes\/?$/);
  await page.waitForFunction(
    () => document.querySelectorAll('article').length >= 50,
    { timeout: 15000 },
  );

  const quotesAfter = await page.locator('article').count();

  return {
    ok: !failed && !alreadyLoaded && imported >= 50 && quotesAfter >= 50 && quotesBefore < 50,
    quotesBefore,
    quotesAfter,
    feedback,
    imported,
    failed,
    alreadyLoaded,
  };
}