import test from 'node:test';
import assert from 'node:assert/strict';
import { withDeadline } from '../../src/lib/deadline.ts';

test('unresponsive transport releases action and allows unrelated interaction', async () => {
  let busy = true, cancelled = false, navigationWorked = false;
  const action = withDeadline(() => new Promise(() => {}), 30, () => { cancelled = true; }).finally(() => { busy = false; });
  setTimeout(() => { navigationWorked = true; }, 5);
  await assert.rejects(action, { name: 'AbortError' });
  assert.equal(busy, false);
  assert.equal(cancelled, true);
  assert.equal(navigationWorked, true);
});

test('late success cannot overwrite the timed-out outcome', async () => {
  let resolveLate;
  const action = withDeadline(() => new Promise(resolve => { resolveLate = resolve; }), 15);
  await assert.rejects(action, { name: 'AbortError' });
  resolveLate('late');
  await assert.rejects(action, { name: 'AbortError' });
});

test('successful and failed operations preserve their outcomes', async () => {
  assert.equal(await withDeadline(async () => 'ok', 100), 'ok');
  await assert.rejects(withDeadline(async () => { throw new Error('failed'); }, 100), /failed/);
});

test('headers received but unfinished JSON body cannot hold the UI', async (t) => {
  const { fetchJsonWithDeadline } = await import('../../src/lib/deadline.ts');
  let streamController;
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ start(c) { streamController = c; } })));
  await assert.rejects(fetchJsonWithDeadline('https://example.test', {}, 25), { name: 'AbortError' });
  streamController.close();
});

test('fetch that ignores abort still has a bounded UI wait', async (t) => {
  const { fetchJsonWithDeadline } = await import('../../src/lib/deadline.ts');
  t.mock.method(globalThis, 'fetch', async () => new Promise(() => {}));
  await assert.rejects(fetchJsonWithDeadline('https://example.test', {}, 25), { name: 'AbortError' });
});
