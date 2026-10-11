import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const transpile = (source) => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
const sessionUrl = moduleUrl(transpile(fs.readFileSync(new URL('../src/lib/session.ts', import.meta.url), 'utf8')));
const configUrl = moduleUrl('export const API_BASE_URL=""; export const API_TIMEOUT_MS=1000;');
const apiSource = fs.readFileSync(new URL('../src/lib/api.ts', import.meta.url), 'utf8')
  .replace('"@/lib/config"', JSON.stringify(configUrl)).replace('"@/lib/session"', JSON.stringify(sessionUrl));
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
  await assert.rejects(api.setLeadCheckout('pix'), TypeError);
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
