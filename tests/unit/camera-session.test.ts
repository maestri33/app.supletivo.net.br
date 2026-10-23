import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bounded } from '../../src/lib/camera-session.ts';

test('permission without an answer times out and releases a stream granted later', async () => {
  let grant!: (value: string) => void;
  let released = '';
  const pending = new Promise<string>(resolve => { grant = resolve; });
  await assert.rejects(bounded(pending, new AbortController().signal, 10, value => { released = value; }), { name: 'TimeoutError' });
  grant('late-stream'); await Promise.resolve();
  assert.equal(released, 'late-stream');
});
test('cancelled permission cannot install a late stream', async () => {
  let grant!: (value: string) => void;
  const controller = new AbortController();
  let released = false;
  const result = bounded(new Promise<string>(resolve => { grant = resolve; }), controller.signal, 1000, () => { released = true; });
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
  grant('late'); await Promise.resolve(); assert.equal(released, true);
});
test('permission denial propagates immediately and success is not discarded', async () => {
  await assert.rejects(bounded(Promise.reject(new DOMException('Denied','NotAllowedError')), new AbortController().signal, 100), { name: 'NotAllowedError' });
  assert.equal(await bounded(Promise.resolve('ready'), new AbortController().signal, 100), 'ready');
});
