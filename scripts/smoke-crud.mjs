async (page) => {
  const base = '__SMOKE_BASE__';
  const tag = '__SMOKE_TAG__';
  await page.goto(base);
  await page.waitForTimeout(1500);

  const before = await page.locator('article').count();

  await page.getByRole('button', { name: '新增名言' }).click();
  await page.getByLabel('名言內容 *').fill(tag);
  await page.getByLabel('作者').fill('測試作者');
  await page.getByRole('button', { name: '儲存' }).click();
  await page.waitForTimeout(1500);
  const afterAdd = await page.locator('article').count();

  const card = page.locator('article').filter({ hasText: tag });
  await card.getByRole('button', { name: '編輯' }).click();
  await page.waitForTimeout(500);
  const hasDelete = await page.getByRole('button', { name: '刪除' }).isVisible();
  const editedText = tag + ' 已編輯';
  await page.getByLabel('名言內容 *').fill(editedText);
  await page.getByRole('button', { name: '儲存' }).click();
  await page.waitForTimeout(1500);
  const edited = (await page.locator('article').filter({ hasText: editedText }).count()) > 0;

  const editedCard = page.locator('article').filter({ hasText: editedText });
  const focusHref = await editedCard.locator('a.quote-card-hit').getAttribute('href');
  let focusOk = false;
  if (focusHref) {
    const origin = base.match(/^https?:\/\/[^/]+/)?.[0] || '';
    const focusUrl = focusHref.startsWith('http') ? focusHref : origin + focusHref;
    await page.goto(focusUrl);
    await page.waitForTimeout(1500);
    const title = await page.title();
    const quote = await page.locator('.focus-quote').textContent();
    focusOk = title.includes('專注模式') && (quote || '').includes(editedText);
  }

  return JSON.stringify({ before, afterAdd, hasDelete, edited, focusHref, focusOk, tag, editedText });
}