import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/pages/api/v1/auth/recovery/contact.ts';

const request = () => new Request('http://local/api/v1/auth/recovery/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: '12345678909', new_phone: '11999999999', method: 'secretaria' }) });

test('offline recovery does not fabricate success or a protocol', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline'); };
  try {
    const response = await POST({ request: request() } as any);
    assert.equal(response.status, 502);
    const result = await response.json();
    assert.equal(result.success, false);
    assert.equal(result.protocol, undefined);
  } finally { globalThis.fetch = originalFetch; }
});

test('provider failure cannot report a sent email or an opened case', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('unavailable', { status: 504 });
  try {
    const response = await POST({ request: request() } as any);
    assert.equal(response.status, 502);
    const result = await response.json();
    assert.equal(result.success, false);
    assert.equal(result.protocol, undefined);
    assert.equal(result.instructions, undefined);
  } finally { globalThis.fetch = originalFetch; }
});
