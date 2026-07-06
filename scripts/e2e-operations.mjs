async (page) => {
  const base = '__E2E_BASE__';
  const tag = '__E2E_TAG__';
  const importFile = '__E2E_IMPORT_FILE__';
  const importQuoteText = '__E2E_IMPORT_TEXT__';
  const checks = [];

  const pass = (name, ok, detail = '') => {
    checks.push({ name, ok, detail: detail || undefined });
  };

  async function installTestHooks() {
    await page.evaluate(() => {
      window.confirm = () => true;
    });
  }

  async function waitForAppShell() {
    await page.waitForSelector('.site-header', { timeout: 10000 });
    await page.waitForFunction(
      () =>
        document.querySelector('.search-bar') ||
        document.querySelector('.settings-section') ||
        document.querySelector('.authors-grid'),
      { timeout: 15000 },
    );
  }

  async function waitForQuotesReady(min = 0) {
    await waitForAppShell();
    await page.waitForFunction(
      (n) => document.querySelectorAll('article').length >= n,
      min,
      { timeout: 20000 },
    );
  }

  async function waitForTransitionIdle() {
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute('data-astro-transition'),
      { timeout: 5000 },
    );
  }

  async function navTo(pageId) {
    await page.locator(`.site-nav a[data-nav-id="${pageId}"]`).click();
    if (pageId === 'quotes') {
      await page.waitForURL(/\/wisdom-quotes\/?(\?.*)?$/);
    } else {
      await page.waitForURL(new RegExp(`/${pageId}/?`));
    }
    await waitForTransitionIdle();
    await page.waitForSelector('.site-header');
  }

  async function openSettings() {
    await navTo('settings');
    await page.waitForSelector('[data-settings-ready]', { timeout: 10000 });
  }

  // Ensure zh-Hant for stable selectors; auto-accept native confirm() dialogs
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem('wq-locale', 'zh-Hant'));
  await page.reload();
  await waitForAppShell();
  await installTestHooks();

  await page.waitForFunction(
    () => {
      const count = document.querySelectorAll('article').length;
      return count >= 50 || document.querySelector('.empty-state');
    },
    { timeout: 20000 },
  );

  let quoteCount = await page.locator('article').count();
  if (quoteCount < 50) {
    await openSettings();
    await page.getByRole('button', { name: '匯入範例' }).click();
    await page.waitForSelector('.settings-feedback', { timeout: 10000 });
    await navTo('quotes');
    await waitForQuotesReady(50);
    quoteCount = await page.locator('article').count();
  }

  // ── Home ──────────────────────────────────────────────────────────────
  pass('首頁標題', (await page.title()) === '智慧語錄 — 名言', await page.title());
  const navHrefs = await page.locator('nav a').evaluateAll((els) =>
    els.map((a) => a.getAttribute('href')),
  );
  pass('導覽：作者連結', JSON.stringify(navHrefs).includes('/authors/'));
  pass('導覽：設定連結', JSON.stringify(navHrefs).includes('/settings/'));
  pass('首頁載入名言', quoteCount >= 50, String(quoteCount));
  pass('每日一思 hero', (await page.locator('.hero-quote').count()) > 0);

  // ── Search ────────────────────────────────────────────────────────────
  const search = page.locator('input[type=search]');
  await search.fill('千里之行');
  await page.waitForFunction(() => document.querySelectorAll('article').length === 1);
  pass('搜尋「千里之行」', (await page.locator('article').count()) === 1);
  await search.fill('');
  await page.waitForFunction(() => document.querySelectorAll('article').length >= 50);

  // ── CRUD ──────────────────────────────────────────────────────────────
  const before = await page.locator('article').count();

  await page.getByRole('button', { name: '新增名言' }).click();
  await page.getByRole('textbox', { name: '名言內容 *' }).fill(tag);
  await page.getByPlaceholder('選填或選擇既有作者').fill('測試作者');
  await page.getByRole('button', { name: '儲存' }).click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('article').length === n,
    before + 1,
  );
  pass('新增名言', (await page.locator('article').count()) === before + 1);

  const card = page.locator('article').filter({ hasText: tag });
  await card.hover();
  await card.getByRole('button', { name: '編輯' }).click({ force: true });
  await page.getByRole('button', { name: '刪除' }).waitFor({ state: 'visible' });
  pass('編輯表單刪除按鈕', await page.getByRole('button', { name: '刪除' }).isVisible());

  const editedText = `${tag} 已編輯`;
  await page.getByRole('textbox', { name: '名言內容 *' }).fill(editedText);
  await page.getByRole('button', { name: '儲存' }).click();
  await page.locator('article').filter({ hasText: editedText }).waitFor({ state: 'visible' });
  pass('編輯儲存', (await page.locator('article').filter({ hasText: editedText }).count()) > 0);

  const editedCard = page.locator('article').filter({ hasText: editedText });
  const focusHref = await editedCard.locator('a.quote-card-hit').getAttribute('href');
  pass('專注連結格式', !!focusHref && focusHref.includes('/focus/'), focusHref || '');

  // ── Author URL filter ─────────────────────────────────────────────────
  await page.goto(`${base}?author=%E8%98%87%E6%A0%BC%E6%8B%89%E5%BA%95`);
  await page.waitForSelector('.quotes-title', { timeout: 10000 });
  const filterTitle = (await page.locator('.quotes-title').textContent()) || '';
  pass('作者篩選標題', filterTitle.includes('蘇格拉底'), filterTitle);
  pass('作者篩選數量', (await page.locator('article').count()) === 1);

  // ── Sidebar author filter ─────────────────────────────────────────────
  await page.goto(base);
  await waitForQuotesReady(50);
  const sidebarAuthor = page.locator('.author-list a.author-item').filter({ hasText: '蘇格拉底' });
  await sidebarAuthor.first().click();
  await page.waitForURL(/author=%E8%98%87%E6%A0%BC%E6%8B%89%E5%BA%95/);
  await page.waitForFunction(() => {
    const active = document.querySelector('.author-list a.author-item.active');
    return active?.textContent?.includes('蘇格拉底');
  });
  const sidebarFiltered = await page.locator('article').count();
  pass('側欄作者篩選', sidebarFiltered === 1, String(sidebarFiltered));

  await page.locator('.author-list a.author-item').filter({ hasText: '全部' }).first().click();
  await page.waitForFunction(() => document.querySelectorAll('article').length >= 50);

  // ── Authors page ──────────────────────────────────────────────────────
  await navTo('authors');
  await page.waitForFunction(
    () => document.querySelectorAll('.author-card').length > 0,
    { timeout: 15000 },
  );
  pass('作者頁標題', (await page.title()) === '智慧語錄 — 作者', await page.title());
  const authorCards = await page.locator('.author-card').count();
  pass('作者卡片', authorCards > 0, String(authorCards));

  const socratesCard = page.locator('.author-card').filter({ hasText: '蘇格拉底' }).first();
  await socratesCard.click();
  await page.waitForURL(/author=%E8%98%87%E6%A0%BC%E6%8B%89%E5%BA%95/);
  await page.waitForFunction(
    () => document.querySelectorAll('article').length === 1,
    { timeout: 10000 },
  );
  pass('作者卡片導向篩選', (await page.locator('article').count()) === 1);

  // ── Focus mode ────────────────────────────────────────────────────────
  await page.goto(base);
  await waitForQuotesReady(50);
  const focusCard = page.locator('article').filter({ hasText: editedText });
  if (focusHref) {
    const origin = base.match(/^https?:\/\/[^/]+/)?.[0] || '';
    const focusUrl = focusHref.startsWith('http') ? focusHref : origin + focusHref;
    await page.goto(focusUrl);
    await page.waitForSelector('.focus-quote', { timeout: 10000 });
    const quote = (await page.locator('.focus-quote').textContent()) || '';
    pass('專注模式內容', quote.includes(editedText), quote.slice(0, 80));

    const posBefore = (await page.locator('.focus-position').textContent()) || '';
    await page.getByRole('button', { name: '下一則名言' }).click();
    await page.waitForFunction(
      (prev) => {
        const el = document.querySelector('.focus-position');
        return el && el.textContent !== prev;
      },
      posBefore,
      { timeout: 5000 },
    );
    pass('專注模式下一則', true);

    await page.locator('a.focus-close').click();
    await page.waitForURL(/\/wisdom-quotes\/?(\?.*)?$/);
    pass('專注模式返回首頁', (await page.locator('.search-bar').count()) > 0);
  } else {
    pass('專注模式內容', false, 'missing focus href');
    pass('專注模式下一則', false, 'skipped');
    pass('專注模式返回首頁', false, 'skipped');
  }

  // Delete via edit form
  await installTestHooks();
  await focusCard.hover();
  await focusCard.getByRole('button', { name: '編輯' }).click({ force: true });
  await page.getByRole('button', { name: '刪除' }).click();
  await page.waitForFunction(
    (text) => ![...document.querySelectorAll('article')].some((c) => c.textContent.includes(text)),
    editedText,
    { timeout: 5000 },
  );
  pass('刪除名言', (await page.locator('article').filter({ hasText: editedText }).count()) === 0);

  const countBeforeImport = await page.locator('article').count();

  // ── Settings ──────────────────────────────────────────────────────────
  await openSettings();
  pass('設定頁標題', (await page.title()) === '智慧語錄 — 設定', await page.title());
  pass('匯入範例按鈕', await page.getByRole('button', { name: '匯入範例' }).isVisible());
  pass('匯出按鈕', await page.getByRole('button', { name: /匯出/ }).isVisible());
  pass('匯入按鈕', (await page.locator('label').filter({ hasText: '匯入' }).count()) > 0);
  pass('清空按鈕', await page.getByRole('button', { name: '清空' }).isVisible());
  const hasDrive = await page.evaluate(() => document.body.textContent.includes('Google Drive'));
  pass('隱藏 Google Drive', !hasDrive);

  // Focus auto interval
  const focusIntervalSelect = page.getByLabel('自動切換名言間隔');
  await focusIntervalSelect.selectOption('0');
  const focusInterval = await page.evaluate(() => localStorage.getItem('wq-focus-auto-minutes'));
  pass('專注自動切換間隔', focusInterval === '0', focusInterval || '');
  await focusIntervalSelect.selectOption('5');

  // Export
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('button', { name: /^匯出/ }).click(),
  ]);
  const exportName = download.suggestedFilename();
  pass('匯出檔名', exportName.endsWith('.json'), exportName);
  await page.waitForSelector('.settings-feedback', { timeout: 5000 });
  const exportFeedback = ((await page.locator('.settings-feedback').textContent()) || '').trim();
  pass('匯出回饋', exportFeedback.includes('匯出'), exportFeedback);

  // Import JSON
  await page.locator('input[type=file]').setInputFiles(importFile);
  await page.waitForSelector('.settings-feedback', { timeout: 10000 });
  const importFeedback = ((await page.locator('.settings-feedback').textContent()) || '').trim();
  pass('匯入 JSON 回饋', importFeedback.includes('匯入完成') || importFeedback.includes('新增'), importFeedback);

  await navTo('quotes');
  await page.waitForFunction(
    (n) => document.querySelectorAll('article').length >= n,
    countBeforeImport + 1,
    { timeout: 15000 },
  );
  const countAfterImport = await page.locator('article').count();
  const importVisible = (await page.locator('article').filter({ hasText: importQuoteText }).count()) > 0;
  pass('匯入 JSON 顯示名言', importVisible && countAfterImport === countBeforeImport + 1, `${countBeforeImport} → ${countAfterImport}`);

  // Pets toggle (causes full reload)
  await openSettings();
  const petsToggle = page.locator('.setting-row').filter({ hasText: '網頁小夥伴' }).locator('button.toggle');
  const petsBefore = await page.evaluate(() => localStorage.getItem('wq-pets') ?? 'on');
  await petsToggle.click();
  await page.waitForSelector('[data-settings-ready]', { timeout: 15000 });
  await installTestHooks();
  const petsAfter = await page.evaluate(() => localStorage.getItem('wq-pets') ?? 'on');
  pass('小夥伴開關', petsBefore !== petsAfter, `${petsBefore} → ${petsAfter}`);

  if (petsAfter === 'off') {
    await navTo('quotes');
    await page.waitForTimeout(500);
    pass('關閉小夥伴後無貓', (await page.locator('.pet.cat').count()) === 0);
    await openSettings();
    await petsToggle.click();
    await page.waitForSelector('[data-settings-ready]', { timeout: 15000 });
    await installTestHooks();
  }

  // Settings theme toggle
  const themeBeforeSettings = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('.setting-row').filter({ hasText: '深色模式' }).locator('button.toggle').click();
  await page.waitForFunction(
    (prev) => document.documentElement.dataset.theme !== prev,
    themeBeforeSettings,
  );
  const themeAfterSettings = await page.evaluate(() => document.documentElement.dataset.theme);
  pass('設定頁主題切換', themeBeforeSettings !== themeAfterSettings, `${themeBeforeSettings} → ${themeAfterSettings}`);

  // Header theme toggle
  await navTo('quotes');
  const themeBeforeHeader = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('#theme-toggle, .header-actions button').first().click();
  await page.waitForFunction(
    (prev) => document.documentElement.dataset.theme !== prev,
    themeBeforeHeader,
  );
  const themeAfterHeader = await page.evaluate(() => document.documentElement.dataset.theme);
  pass('頂欄主題切換', themeBeforeHeader !== themeAfterHeader, `${themeBeforeHeader} → ${themeAfterHeader}`);

  // Page cat
  await page.waitForSelector('.pet.cat', { timeout: 8000 });
  pass('頁面小貓', (await page.locator('.pet.cat').count()) > 0);

  // Clear all (last destructive data op)
  await openSettings();
  await installTestHooks();
  const quotesBeforeClear = await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    const dbName = dbs.find((d) => d.name === 'WisdomQuotesDB')?.name;
    if (!dbName) return -1;
    return new Promise((resolve) => {
      const req = indexedDB.open(dbName);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('quotes', 'readonly');
        const countReq = tx.objectStore('quotes').count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => resolve(-1);
      };
      req.onerror = () => resolve(-1);
    });
  });
  await page.getByRole('button', { name: '清空' }).click();
  await page.waitForSelector('.settings-feedback', { timeout: 10000 });
  const clearFeedback = ((await page.locator('.settings-feedback').textContent()) || '').trim();
  pass('清空回饋', clearFeedback.includes('清空'), clearFeedback);

  await navTo('quotes');
  await page.waitForSelector('.empty-state', { timeout: 10000 });
  pass('清空後空狀態', (await page.locator('article').count()) === 0);
  pass('清空前有資料', quotesBeforeClear > 0, String(quotesBeforeClear));

  // Locale switch (en) — after data cleared
  await openSettings();
  await page.selectOption('select.locale-select', 'en');
  await page.waitForFunction(() => document.title === 'Wisdom Quotes — Settings');
  pass('英文設定頁標題', (await page.title()) === 'Wisdom Quotes — Settings', await page.title());

  await navTo('quotes');
  const navEn = await page.locator('nav a').evaluateAll((els) =>
    els.map((a) => a.textContent.trim()),
  );
  pass('英文導覽：Quotes', navEn.some((t) => t.includes('Quotes')), JSON.stringify(navEn));

  return {
    ok: checks.every((c) => c.ok),
    checks,
    tag,
    editedText,
  };
}