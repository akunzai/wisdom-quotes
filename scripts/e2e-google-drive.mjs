async (page) => {
  const checks = [];
  const check = (name, ok) => { if (!ok) throw new Error(name); checks.push(name); };
  const sameQuotes = (actual, expected) => actual.length === expected.length && actual.every((quote, index) => Object.keys(quote).length === Object.keys(expected[index]).length && Object.entries(expected[index]).every(([key, value]) => JSON.stringify(quote[key]) === JSON.stringify(value)));
  const stamp = '2026-10-09T00:00:00.000Z';
  let backup = { version: '1.0', exportedAt: stamp, quotes: [] };
  const uploads = [];
  await page.context().addInitScript(() => { localStorage.setItem('wq-locale', 'zh-Hant'); });
  await page.route('https://accounts.google.com/gsi/client', async (route) => {
    await route.fulfill({ contentType: 'application/javascript', body: `window.google = { accounts: { oauth2: { initTokenClient: (config) => ({ requestAccessToken: () => window.__denyAuth ? config.error_callback({ type: 'popup_closed' }) : config.callback({ access_token: 'test-access-token', expires_in: 3600, scope: 'https://www.googleapis.com/auth/drive.appdata' }) }) } } };` });
  });
  await page.route('https://www.googleapis.com/upload/drive/v3/files**', async (route) => {
    const body = route.request().postData();
    const match = body.match(/Content-Type: application\/json\r\n\r\n([^\r]+)\r\n--/);
    if (!match) throw new Error('Upload omitted quote JSON');
    uploads.push(JSON.parse(match[1]));
    await route.fulfill({ json: { id: `created-${uploads.length}`, name: 'backup.json', createdTime: stamp } });
  });
  await page.route('https://www.googleapis.com/drive/v3/files**', async (route) => {
    await route.fulfill({ json: route.request().url().includes('alt=media') ? backup : { files: [{ id: 'empty-backup', name: 'empty.json', createdTime: stamp }] } });
  });
  await page.goto('http://127.0.0.1:4323/wisdom-quotes/settings/');
  await page.getByRole('button', { name: '列出備份', exact: true }).click({ timeout: 3000 });
  await page.getByLabel('選擇備份版本').selectOption('empty-backup');
  await page.getByRole('button', { name: '預覽還原', exact: true }).click();
  await page.getByText('此備份沒有語錄，還原會清空本機所有語錄。', { exact: true }).waitFor();
  check('empty restore warns before replacement', true);
  const restore = page.getByRole('button', { name: '替換本機語錄', exact: true });
  check('restore disabled before recovery export', await restore.isDisabled());
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '先匯出目前資料', exact: true }).click();
  await download;
  check('download alone does not enable restore', await restore.isDisabled());
  await page.getByLabel('我已保存目前資料的 JSON 檔案').check();
  check('explicit saved-file confirmation enables restore', await restore.isEnabled());
  await restore.click();
  await page.getByText('還原完成，本機語錄已替換。', { exact: true }).waitFor();

  const a = { id: '00000000-0000-4000-8000-000000000001', text: 'A', author: 'Test author', tags: ['test'], sourceUrl: 'https://example.com/quote', createdAt: stamp, updatedAt: stamp, visibility: 'private' };
  const b = { ...a, id: '00000000-0000-4000-8000-000000000002', text: 'B' };
  const c = { ...a, id: '00000000-0000-4000-8000-000000000003', text: 'C', visibility: 'public' };
  await page.evaluate(async (quotes) => {
    const { importQuotesFromJson } = await import('/wisdom-quotes/src/lib/import-export/index.ts');
    await importQuotesFromJson({ version: '1.0', exportedAt: '2026-10-09T00:00:00.000Z', quotes });
  }, [a, b]);
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: '建立備份', exact: true }).click();
    await page.getByText('備份已建立，先前版本仍保留。', { exact: true }).waitFor();
  }
  check('manual backups upload all quote fields without preferences', uploads.length === 2 && sameQuotes(uploads[0].quotes, [a, b]) && Object.keys(uploads[0]).sort().join(',') === 'exportedAt,quotes,version');
  backup = { version: '1.0', exportedAt: stamp, quotes: [a, c] };
  await page.getByRole('button', { name: '列出備份', exact: true }).click();
  await page.getByLabel('選擇備份版本').selectOption('empty-backup');
  await page.getByRole('button', { name: '預覽還原', exact: true }).click();
  await page.getByText('備份有 2 筆語錄，本機目前有 2 筆。', { exact: true }).waitFor();
  check('preview includes backup time and both counts', await page.getByText('備份時間：', { exact: false }).isVisible());
  let nextDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '先匯出目前資料', exact: true }).click();
  await nextDownload;
  await page.getByLabel('我已保存目前資料的 JSON 檔案').check();
  await page.evaluate(async () => {
    const { createQuote } = await import('/wisdom-quotes/src/lib/storage/quotes.ts');
    await createQuote({ text: 'Concurrent edit' });
  });
  await restore.click();
  await page.getByText('本機資料已在匯出後變更。請重新匯出並確認保存，再進行還原。', { exact: true }).waitFor();
  check('concurrent changes require a new recovery export', await restore.isDisabled());
  nextDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '先匯出目前資料', exact: true }).click();
  await nextDownload;
  await page.getByLabel('我已保存目前資料的 JSON 檔案').check();
  await restore.click();
  await page.getByText('還原完成，本機語錄已替換。', { exact: true }).waitFor();
  const quotes = await page.evaluate(async () => {
    const { exportQuotes } = await import('/wisdom-quotes/src/lib/import-export/index.ts');
    return (await exportQuotes()).quotes;
  });
  check('UI restore exactly replaces A/B with A/C', sameQuotes(quotes, [a, c]));

  backup = { invalid: true };
  await page.getByRole('button', { name: '列出備份', exact: true }).click();
  await page.getByLabel('選擇備份版本').selectOption('empty-backup');
  await page.getByRole('button', { name: '預覽還原', exact: true }).click();
  await page.getByText('備份資料或 Drive 回應格式不正確。請選擇其他備份或重新列出備份。', { exact: true }).waitFor();
  check('invalid download exposes no restore controls', await restore.count() === 0);

  for (const [locale, listName, title] of [['en', 'List backups', 'Google Drive backup'], ['ja', 'バックアップ一覧', 'Google Drive バックアップ']]) {
    await page.locator('.settings-section .locale-select').selectOption(locale);
    check(`${locale} backup controls are translated`, await page.getByRole('button', { name: listName, exact: true }).isVisible() && await page.getByRole('heading', { name: title, exact: true }).isVisible());
  }
  await page.reload();
  await page.evaluate(() => { window.__denyAuth = true; });
  await page.getByRole('button', { name: '列出備份', exact: true }).click();
  await page.getByText('Google 授權未完成或已到期。請再次點擊備份或列出備份，完成授權後重試。', { exact: true }).waitFor();
  const afterCancel = await page.evaluate(async () => {
    const { exportQuotes } = await import('/wisdom-quotes/src/lib/import-export/index.ts');
    return (await exportQuotes()).quotes;
  });
  check('popup cancellation after a new session preserves local data', sameQuotes(afterCancel, [a, c]));
  const persisted = await page.evaluate(() => [localStorage, sessionStorage].flatMap((storage) => Object.values(storage)));
  check('access token is not persisted in browser storage', !persisted.some((value) => value.includes('test-access-token')));
  await page.unroute('https://accounts.google.com/gsi/client');
  await page.unroute('https://www.googleapis.com/drive/v3/files**');
  await page.unroute('https://www.googleapis.com/upload/drive/v3/files**');
  return { ok: true, checks };
}
