import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const transpile = (source) => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
const sessionUrl = moduleUrl(transpile(fs.readFileSync(new URL('../../src/lib/session.ts', import.meta.url), 'utf8')));
const deadlineUrl = moduleUrl(transpile(fs.readFileSync(new URL('../../src/lib/deadline.ts', import.meta.url), 'utf8')));
const configUrl = moduleUrl('export const API_BASE_URL=""; export const API_TIMEOUT_MS=1000;');
const apiSource = fs.readFileSync(new URL('../../src/lib/api.ts', import.meta.url), 'utf8')
  .replace('"@/lib/config"', JSON.stringify(configUrl))
  .replace('"@/lib/session"', JSON.stringify(sessionUrl))
  .replace('"./deadline"', JSON.stringify(deadlineUrl));
const session = await import(sessionUrl);
const api = await import(moduleUrl(transpile(apiSource)));
const originalFetch = globalThis.fetch;

beforeEach(() => {
  const storage = new Map();
  globalThis.window = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } };
  session.clearSession();
  session.saveLogin({ access_token: 'fixture', refresh_token: 'fixture-refresh', roles: ['student'], role_statuses: { student: 'lead' } });
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.window; });

test('a lost checkout response is surfaced without creating a second request', async () => {
  let attempts = 0;
  globalThis.fetch = async () => { attempts += 1; throw new TypeError('Connection closed after response'); };
  await assert.rejects(api.createCheckout('pix', 'stable-idemp-key'), TypeError);
  assert.equal(attempts, 1);
});

test('a transport failure on a read can recover without replaying a mutation', async () => {
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) throw new TypeError('Connection closed');
    return new Response(JSON.stringify({ roles: ['student'], role_statuses: { student: 'lead' } }));
  };
  assert.deepEqual((await api.whoami()).role_statuses, { student: 'lead' });
  assert.equal(attempts, 2);
});

test('requestAuth restores session via HttpOnly cookie refresh when localStorage is empty', async () => {
  session.clearSession();
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init?.method, credentials: init?.credentials, auth: init?.headers?.Authorization });
    if (String(url).endsWith('/api/v1/auth/refresh')) {
      return new Response(
        JSON.stringify({
          access_token: 'restored-access',
          refresh_token: 'restored-refresh',
          token_type: 'Bearer',
          roles: ['client'],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ authenticated: true, roles: ['client'], role_statuses: { client: 'pre_enrolled' } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const who = await api.whoami();
  assert.equal(who.authenticated, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, '/api/v1/auth/refresh');
  assert.equal(calls[0].credentials, 'include');
  assert.equal(calls[1].url, '/api/v1/auth/whoami');
  assert.equal(calls[1].auth, 'Bearer restored-access');
});

test('getUnifiedCheckout, exchangeSessionLink and logoutSession call canonical endpoints with credentials', async () => {
  const seen = [];
  globalThis.fetch = async (url, init) => {
    seen.push({ url, method: init?.method, credentials: init?.credentials });
    return new Response(JSON.stringify({ success: true, mode: 'pending', access_token: 'tok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await api.getUnifiedCheckout();
  await api.exchangeSessionLink('magic_token_1234567890');
  await api.logoutSession();

  assert.deepEqual(seen, [
    { url: '/api/v1/checkout', method: 'GET', credentials: 'include' },
    { url: '/api/v1/auth/session-link/exchange', method: 'POST', credentials: 'include' },
    { url: '/api/v1/auth/logout', method: 'POST', credentials: 'include' },
  ]);
});
