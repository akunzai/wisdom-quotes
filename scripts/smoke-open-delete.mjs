async (page) => {
  const base = '__SMOKE_BASE__';
  const tag = '__SMOKE_TAG__';
  await page.goto(base);
  await page.waitForTimeout(1500);
  const card = page.locator('article').filter({ hasText: tag });
  if ((await card.count()) === 0) return JSON.stringify({ found: false });
  await card.first().getByRole('button', { name: '編輯' }).click();
  await page.waitForTimeout(500);
  return JSON.stringify({ found: true });
}