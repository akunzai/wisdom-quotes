import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GoogleDrive } from '../src/lib/google-drive.ts';

const scope = 'https://www.googleapis.com/auth/drive.appdata';
const collection = { version: '1.0', exportedAt: '2026-10-09T00:00:00.000Z', quotes: [] };

async function authorizedDrive(t, response = {}) {
  globalThis.window = { google: { accounts: { oauth2: {
    initTokenClient(config) {
      return { requestAccessToken() { config.callback({ access_token: 'test-access-token', expires_in: 3600, scope, ...response }); } };
    },
  } } } };
  t.after(() => { delete globalThis.window; });
  const drive = new GoogleDrive('test-client-id');
  await drive.prepare();
  await drive.authorize();
  return drive;
}

test('manual backups create independent app-data versions and remain downloadable', async (t) => {
  let config;
  const files = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-access-token');
    if (String(url).includes('/upload/')) {
      assert.equal(options.method, 'POST');
      assert.match(options.headers['Content-Type'], /^multipart\/related; boundary=/);
      const body = String(options.body);
      assert.match(body, /"parents":\["appDataFolder"\]/);
      assert.match(body, /"exportedAt":"2026-10-09T00:00:00.000Z"/);
      const file = { id: `backup-${files.length + 1}`, name: 'backup.json', createdTime: collection.exportedAt };
      files.push(file);
      return Response.json(file);
    }
    if (String(url).includes('alt=media')) return Response.json(collection);
    assert.equal(new URL(url).searchParams.get('spaces'), 'appDataFolder');
    return Response.json({ files });
  });
  globalThis.window = { google: { accounts: { oauth2: {
    initTokenClient(value) {
      config = value;
      return { requestAccessToken() { config.callback({ access_token: 'test-access-token', expires_in: 3600, scope }); } };
    },
  } } } };
  t.after(() => { delete globalThis.window; });
  const drive = new GoogleDrive('test-client-id');
  await drive.prepare();
  await drive.authorize();
  assert.equal(config.scope, scope);
  assert.equal(config.include_granted_scopes, false);
  const first = await drive.createBackup(collection);
  const second = await drive.createBackup(collection);
  assert.notEqual(first.id, second.id);
  assert.equal((await drive.listBackups()).length, 2);
  assert.deepEqual(await drive.downloadBackup(first.id), collection);
});

test('all backup pages are listed, including a page with no files', async (t) => {
  const file = { id: 'old-backup', name: 'old.json', createdTime: collection.exportedAt };
  t.mock.method(globalThis, 'fetch', async (url) => {
    const params = new URL(url).searchParams;
    assert.match(params.get('q'), /wisdom-quotes-backup/);
    return Response.json(params.get('pageToken') === 'page-2' ? { files: [file] } : { files: [], nextPageToken: 'page-2' });
  });
  const drive = await authorizedDrive(t);
  assert.deepEqual(await drive.listBackups(), [file]);
});

test('cancelled authorization and missing scope cannot access Drive', async (t) => {
  for (const response of [{ error: 'access_denied' }, { scope: 'openid' }]) {
    await assert.rejects(authorizedDrive(t, response), { code: 'authorization' });
  }
});

test('expired tokens require a new user action and a 401 is not silently retried', async (t) => {
  let now = 1000;
  let requests = 0;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async () => { requests++; return new Response('', { status: 401 }); });
  const drive = await authorizedDrive(t, { expires_in: 60 });
  now += 61_000;
  await assert.rejects(drive.listBackups(), { code: 'authorization' });
  assert.equal(requests, 0);
  await drive.authorize();
  await assert.rejects(drive.listBackups(), { code: 'authorization' });
  await assert.rejects(drive.listBackups(), { code: 'authorization' });
  assert.equal(requests, 1);
});

test('failed uploads and malformed confirmations never report a created backup', async (t) => {
  const drive = await authorizedDrive(t);
  for (const response of [new Response('', { status: 429 }), Response.json({})]) {
    t.mock.method(globalThis, 'fetch', async () => response);
    await assert.rejects(drive.createBackup(collection));
  }
});

test('a non-finite token lifetime is rejected', async (t) => {
  await assert.rejects(authorizedDrive(t, { expires_in: Infinity }), { code: 'authorization' });
});

test('a Google script that never loads becomes a retryable preparation failure', async (t) => {
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({ remove() {} }),
    head: { append() {} },
  };
  t.after(() => { delete globalThis.window; delete globalThis.document; });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const drive = new GoogleDrive('test-client-id');
  const result = assert.rejects(drive.prepare(), { code: 'unavailable' });
  t.mock.timers.tick(30_000);
  await result;
});
