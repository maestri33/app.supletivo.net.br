import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commissionTotal } from '../src/lib/promoter.ts';

test('outstanding amounts exclude cancelled and failed commissions and preserve cents', () => {
  const ledger = [
    { status: 'pending', amount: '25.10' }, { status: 'processed', amount: '50.01' },
    { status: 'paid', amount: '80.00' }, { status: 'cancelled', amount: '90.00' },
    { status: 'failed', amount: '100.00' },
  ].map((item, index) => ({ ...item, external_id: String(index), source: 'lead', created_at: '2026-10-09' }));
  assert.equal(commissionTotal(ledger, ['pending', 'processed']), '75.11');
  assert.equal(commissionTotal(ledger, ['paid']), '80.00');
  assert.equal(commissionTotal([], ['pending']), '0.00');
});

test('refund debt is deducted exactly and negative cents remain visible', () => {
  const ledger = [
    { status: 'pending', amount: '100.00', source: 'lead' },
    { status: 'pending', amount: '-100.01', source: 'reversal' },
  ].map((item, index) => ({ ...item, external_id: String(index), created_at: '2026-10-10' }));
  assert.equal(commissionTotal(ledger, ['pending']), '-0.01');
  assert.equal(commissionTotal(ledger.slice(1), ['pending']), '-100.01');
});
