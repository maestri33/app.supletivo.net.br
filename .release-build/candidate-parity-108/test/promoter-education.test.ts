import { test } from "node:test";
import assert from "node:assert/strict";
import { candidateEducationPayload } from "../src/lib/promoter-education.ts";

test("finishing an intermediate grade does not claim the entire level is completed", () => {
  assert.deepEqual(candidateEducationPayload("medio", true, 2, 1, "graduacao"), { level: "medio", completed: false, grade: 2, last_completed_grade: 2, education_status: "completed" });
  assert.equal(candidateEducationPayload("medio", true, 3, 2, "graduacao").completed, true);
});

test("incomplete school attendance keeps the previous completed grade and rejects conflicting history", () => {
  assert.deepEqual(candidateEducationPayload("fundamental", false, 7, 5, "graduacao"), { level: "fundamental", completed: false, grade: 7, last_completed_grade: 5, education_status: "stopped" });
  assert.throws(() => candidateEducationPayload("medio", false, 2, 2, "graduacao"));
  assert.throws(() => candidateEducationPayload("medio", true, 9, 8, "graduacao"));
});
