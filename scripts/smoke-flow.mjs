async (page) => {
  const base = '__SMOKE_BASE__';
  const tag = '__SMOKE_TAG__';
  const checks = [];

  const pass = (name, ok, detail = '') => {
    checks.push({ name, ok, detail: detail || undefined });
  };

  page.on('dialog', (dialog) => void dialog.accept());

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

  async function navTo(pageId) {
    await page.locator(`.site-nav a[data-nav-id="${pageId}"]`).click();
    if (pageId === 'quotes') {
      await page.waitForURL(/\/wisdom-quotes\/?$/);
    } else {
      await page.waitForURL(new RegExp(`/${pageId}/?`));
    }
    await page.waitForSelector('.site-header');
  }

  // 0. Seed demo quotes when needed
  await page.goto(base);
  await waitForAppShell();
  await page.waitForFunction(
    () => {
      const count = document.querySelectorAll('article').length;
      return count >= 50 || document.querySelector('.empty-state');
    },
    { timeout: 20000 },
  );

  let quoteCount = await page.locator('article').count();
  if (quoteCount < 50) {
    await page.goto(`${base}settings/`);
    await waitForAppShell();
    await page.waitForSelector('[data-settings-ready]', { timeout: 10000 });
    await page.getByRole('button', { name: '匯入範例' }).click();
    await page.waitForSelector('.settings-feedback', { timeout: 10000 });
    await page.goto(base);
    await waitForQuotesReady(50);
    quoteCount = await page.locator('article').count();
  }

  // 1. Home
  pass('首頁標題', (await page.title()) === '智慧語錄 — 名言', await page.title());
  const navHrefs = await page.locator('nav a').evaluateAll((els) =>
    els.map((a) => a.getAttribute('href')),
  );
  const navJson = JSON.stringify(navHrefs);
  pass('導覽：作者連結', navJson.includes('/wisdom-quotes/authors/'));
  pass('導覽：設定連結', navJson.includes('/wisdom-quotes/settings/'));
  pass('首頁載入名言', quoteCount >= 50, String(quoteCount));
  pass('每日一思 hero', (await page.locator('.hero-quote').count()) > 0);

  // 2. Search
  const search = page.locator('input[type=search]');
  await search.fill('千里之行');
  await page.waitForFunction(() => document.querySelectorAll('article').length === 1);
  pass('搜尋「千里之行」', (await page.locator('article').count()) === 1);
  await search.fill('');
  await page.waitForFunction(() => document.querySelectorAll('article').length >= 50);

  // 3. Authors
  await navTo('authors');
  await page.waitForFunction(
    () => document.querySelectorAll('.author-card').length > 0,
    { timeout: 15000 },
  );
  pass('作者頁標題', (await page.title()) === '智慧語錄 — 作者', await page.title());
  const authorCards = await page.locator('.author-card').count();
  pass('作者卡片', authorCards > 0, String(authorCards));

  // 4. Settings
  await navTo('settings');
  pass('設定頁標題', (await page.title()) === '智慧語錄 — 設定', await page.title());
  pass('匯入範例按鈕', await page.getByRole('button', { name: '匯入範例' }).isVisible());
  pass('匯出按鈕', await page.getByRole('button', { name: /匯出/ }).isVisible());
  pass('匯入按鈕', await page.locator('label').filter({ hasText: '匯入' }).count() > 0);
  pass('清空按鈕', await page.getByRole('button', { name: '清空' }).isVisible());
  const hasDrive = await page.evaluate(() => document.body.textContent.includes('Google Drive'));
  pass('隱藏 Google Drive', !hasDrive);

  // 5. Theme toggle
  await navTo('quotes');
  const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('.header-actions button').click();
  await page.waitForFunction(
    (prev) => document.documentElement.dataset.theme !== prev,
    themeBefore,
  );
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
  pass('主題切換', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);

  // 6–9. CRUD + Focus + Delete
  const before = await page.locator('article').count();

  await page.getByRole('button', { name: '新增名言' }).click();
  await page.getByRole('textbox', { name: '名言內容 *' }).fill(tag);
  await page.getByPlaceholder('選填或選擇既有作者').fill('測試作者');
  await page.getByRole('button', { name: '儲存' }).click();
  await page.waitForFunction(
    (n) => document.querySelectorAll('article').length === n,
    before + 1,
  );
  const afterAdd = await page.locator('article').count();
  pass('新增名言', afterAdd === before + 1, `${before} → ${afterAdd}`);

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

  let focusOk = false;
  if (focusHref) {
    const origin = base.match(/^https?:\/\/[^/]+/)?.[0] || '';
    const focusUrl = focusHref.startsWith('http') ? focusHref : origin + focusHref;
    await page.goto(focusUrl);
    await page.waitForSelector('.focus-quote', { timeout: 10000 });
    const focusTitle = await page.title();
    const quote = (await page.locator('.focus-quote').textContent()) || '';
    focusOk = focusTitle.includes('專注模式') && quote.includes(editedText);
  }
  pass('專注模式內容', focusOk);

  // Delete is handled outside run-code — playwright-cli cannot auto-dismiss confirm dialogs.

  // 10. Author filter
  await page.goto(`${base}?author=%E8%98%87%E6%A0%BC%E6%8B%89%E5%BA%95`);
  await page.waitForSelector('.quotes-title', { timeout: 10000 });
  const filterTitle = (await page.locator('.quotes-title').textContent()) || '';
  pass('作者篩選標題', filterTitle.includes('蘇格拉底'), filterTitle);
  pass('作者篩選數量', (await page.locator('article').count()) === 1);

  // 11. Locale switch (en)
  await page.goto(`${base}settings/`);
  await page.waitForSelector('select.locale-select', { timeout: 10000 });
  await page.selectOption('select.locale-select', 'en');
  await page.waitForFunction(() => document.title === 'Wisdom Quotes — Settings');
  pass('英文設定頁標題', (await page.title()) === 'Wisdom Quotes — Settings', await page.title());

  await navTo('quotes');
  const navEn = await page.locator('nav a').evaluateAll((els) =>
    els.map((a) => a.textContent.trim()),
  );
  pass('英文導覽：Quotes', navEn.some((t) => t.includes('Quotes')), JSON.stringify(navEn));

  // 12. Page cat (client:idle — allow brief delay)
  await page.waitForSelector('.pet.cat', { timeout: 8000 });
  pass('頁面小貓', (await page.locator('.pet.cat').count()) > 0);

  return {
    ok: checks.every((c) => c.ok),
    checks,
    tag,
    editedText,
  };
}