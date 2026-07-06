async (page) => {
  const base = '__E2E_BASE__';

  await page.goto(base);
  await page.waitForTimeout(1500);

  async function activeNavId() {
    return page.evaluate(() => {
      const active = document.querySelector('.site-nav a.nav-link.active');
      return active?.getAttribute('data-nav-id') ?? null;
    });
  }

  async function waitForActiveNav(expected) {
    await page.waitForFunction(
      (id) => {
        const active = document.querySelector('.site-nav a.nav-link.active');
        return active?.getAttribute('data-nav-id') === id;
      },
      expected,
      { timeout: 5000 },
    );
  }

  const steps = [];

  steps.push({
    step: 'initial',
    expected: 'quotes',
    actual: await activeNavId(),
    title: await page.title(),
  });

  await page.locator('.site-nav a[data-nav-id="authors"]').click();
  await page.waitForURL(/\/authors\/?/);
  await waitForActiveNav('authors');
  steps.push({
    step: 'click-authors',
    expected: 'authors',
    actual: await activeNavId(),
    title: await page.title(),
  });

  await page.locator('.site-nav a[data-nav-id="settings"]').click();
  await page.waitForURL(/\/settings\/?/);
  await waitForActiveNav('settings');
  steps.push({
    step: 'click-settings',
    expected: 'settings',
    actual: await activeNavId(),
    title: await page.title(),
  });

  await page.locator('.site-nav a[data-nav-id="quotes"]').click();
  await page.waitForURL(/\/wisdom-quotes\/?$/);
  await waitForActiveNav('quotes');
  steps.push({
    step: 'click-quotes',
    expected: 'quotes',
    actual: await activeNavId(),
    title: await page.title(),
  });

  // Reverse order — catches stale persist state from earlier tabs
  await page.locator('.site-nav a[data-nav-id="settings"]').click();
  await waitForActiveNav('settings');
  steps.push({
    step: 'click-settings-again',
    expected: 'settings',
    actual: await activeNavId(),
  });

  await page.locator('.site-nav a[data-nav-id="authors"]').click();
  await waitForActiveNav('authors');
  steps.push({
    step: 'click-authors-again',
    expected: 'authors',
    actual: await activeNavId(),
  });

  const ok = steps.every((s) => s.actual === s.expected);
  return { steps, ok };
}