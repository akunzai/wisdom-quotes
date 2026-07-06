async (page) => {
  const base = '__E2E_BASE__';

  await page.goto(base);
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.__wq = {
      sessionId: `sess-${Math.random().toString(36).slice(2)}`,
      swapCount: 0,
      headerNode: document.querySelector('.site-header'),
    };
    document.addEventListener('astro:after-swap', () => {
      window.__wq.swapCount += 1;
    });
  });

  const beforeClick = await page.evaluate(() => ({
    sessionId: window.__wq?.sessionId ?? null,
    swapCount: window.__wq?.swapCount ?? 0,
    navEntries: performance.getEntriesByType('navigation').length,
    hasClientRouter: !!document.querySelector('meta[name="astro-view-transitions-enabled"]'),
    swController: !!navigator.serviceWorker?.controller,
  }));

  await page.locator('.site-nav a[data-nav-id="authors"]').click();
  await page.waitForURL(/\/authors\/?/);
  await page.waitForFunction(
    () => (window.__wq?.swapCount ?? 0) >= 1,
    undefined,
    { timeout: 5000 },
  );

  const afterAuthors = await page.evaluate(() => ({
    sessionId: window.__wq?.sessionId ?? null,
    swapCount: window.__wq?.swapCount ?? 0,
    navEntries: performance.getEntriesByType('navigation').length,
    sameHeaderNode: document.querySelector('.site-header') === window.__wq?.headerNode,
    pathname: window.location.pathname,
    activeNav: document.querySelector('.site-nav a.nav-link.active')?.getAttribute('data-nav-id') ?? null,
  }));

  await page.locator('.site-nav a[data-nav-id="settings"]').click();
  await page.waitForURL(/\/settings\/?/);
  await page.waitForFunction(
    () => (window.__wq?.swapCount ?? 0) >= 2,
    undefined,
    { timeout: 5000 },
  );

  const afterSettings = await page.evaluate(() => ({
    sessionId: window.__wq?.sessionId ?? null,
    swapCount: window.__wq?.swapCount ?? 0,
    navEntries: performance.getEntriesByType('navigation').length,
    sameHeaderNode: document.querySelector('.site-header') === window.__wq?.headerNode,
    pathname: window.location.pathname,
    activeNav: document.querySelector('.site-nav a.nav-link.active')?.getAttribute('data-nav-id') ?? null,
  }));

  const checks = {
    clientRouterPresent: beforeClick.hasClientRouter,
    sessionPersists:
      afterAuthors.sessionId === beforeClick.sessionId &&
      afterSettings.sessionId === beforeClick.sessionId,
    swapEventsFire: afterSettings.swapCount >= 2,
    noFullReload:
      afterAuthors.navEntries === beforeClick.navEntries &&
      afterSettings.navEntries === beforeClick.navEntries,
    headerPersisted:
      afterAuthors.sameHeaderNode && afterSettings.sameHeaderNode,
    activeNavAuthors: afterAuthors.activeNav === 'authors',
    activeNavSettings: afterSettings.activeNav === 'settings',
  };

  const ok = Object.values(checks).every(Boolean);

  return { ok, checks, beforeClick, afterAuthors, afterSettings };
}