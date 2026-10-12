import assert from "node:assert/strict";
import test from "node:test";
import { addressClassificationError, addressPollDelay } from "../../src/lib/address-proof.ts";

test("Only pending received address proofs schedule another read", () => {
  assert.equal(addressPollDelay(null), null);
  for (const status of ["approved", "rejected", "review", "needs_kinship"]) {
    assert.equal(addressPollDelay({ exists: true, status }), null);
  }
  assert.equal(addressPollDelay({ exists: true, status: "pending", poll_after_ms: 4500 }), 4500);
  assert.equal(addressPollDelay({ exists: false, status: "pending" }), null);
});

test("Address classification requires identified legible address proof", () => {
  for (const result of [{}, { is_document: null }, { is_document: false },
    { is_document: true, doc_type: "rg", is_legible: true },
    { is_document: true, doc_type: "address_proof", is_legible: false },
    { is_document: true, doc_type: "address_proof", is_legible: null }]) {
    assert.ok(addressClassificationError(result));
  }
  assert.equal(addressClassificationError({ is_document: true, doc_type: "address_proof", is_legible: true }), null);
});

test("Protected PDFs keep their actionable decoder feedback", () => {
  assert.match(addressClassificationError({ error_code: "PDF_PASSWORD_REQUIRED" })!, /senha/);
  assert.match(addressClassificationError({ error_code: "PDF_TOO_MANY_PAGES" })!, /duas páginas/);
});
