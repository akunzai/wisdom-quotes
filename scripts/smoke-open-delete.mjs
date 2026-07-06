async (page) => {
  const base = '__SMOKE_BASE__';
  const tag = '__SMOKE_TAG__';
  await page.goto(base);
  await page.waitForSelector('.site-header', { timeout: 10000 });
  const card = page.locator('article').filter({ hasText: tag });
  if ((await card.count()) === 0) return JSON.stringify({ found: false });
  await card.first().hover();
  await card.first().getByRole('button', { name: '編輯' }).click({ force: true });
  await page.getByRole('button', { name: '刪除' }).waitFor({ state: 'visible', timeout: 5000 });
  return JSON.stringify({ found: true });
}