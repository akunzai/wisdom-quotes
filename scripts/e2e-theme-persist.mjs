async (page) => {
  const base = '__E2E_BASE__';
  const checks = [];

  const pass = (name, ok, detail = '') => {
    checks.push({ name, ok, detail: detail || undefined });
  };

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
  }

  function readTheme() {
    return page.evaluate(() => ({
      html: document.documentElement.dataset.theme ?? '',
      storage: localStorage.getItem('wq-theme') ?? '',
    }));
  }

  await page.goto(base);
  await page.waitForSelector('.site-header', { timeout: 10000 });
  await page.evaluate(() => {
    localStorage.setItem('wq-theme', 'light');
    document.documentElement.dataset.theme = 'light';
  });

  // Header toggle → dark, then client-nav across all tabs
  await page.locator('#theme-toggle').click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  let theme = await readTheme();
  pass('頂欄切換深色', theme.html === 'dark' && theme.storage === 'dark', JSON.stringify(theme));

  for (const tab of ['authors', 'settings', 'quotes', 'authors']) {
    await navTo(tab);
    theme = await readTheme();
    pass(`深色模式保留：${tab}`, theme.html === 'dark' && theme.storage === 'dark', JSON.stringify(theme));
  }

  // Settings toggle → light, then navigate away
  await navTo('settings');
  await page.waitForSelector('[data-settings-ready]', { timeout: 10000 });
  await page.locator('.setting-row').filter({ hasText: '深色模式' }).locator('button.toggle').click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  theme = await readTheme();
  pass('設定頁切換淺色', theme.html === 'light' && theme.storage === 'light', JSON.stringify(theme));

  await navTo('quotes');
  theme = await readTheme();
  pass('淺色模式保留：quotes', theme.html === 'light' && theme.storage === 'light', JSON.stringify(theme));

  await navTo('authors');
  theme = await readTheme();
  pass('淺色模式保留：authors', theme.html === 'light' && theme.storage === 'light', JSON.stringify(theme));

  return { ok: checks.every((c) => c.ok), checks };
}