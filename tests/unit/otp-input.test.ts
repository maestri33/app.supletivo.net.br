import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanOtpInput,
  splitOtpDigits,
  isOtpComplete,
  formatOtpAccessibleAnnouncement,
} from "../../src/lib/otp.ts";

test("cleanOtpInput extracts only digits up to specified length", () => {
  assert.equal(cleanOtpInput("123-456"), "123456");
  assert.equal(cleanOtpInput("abc 45 67 89 xyz"), "456789");
  assert.equal(cleanOtpInput("1234567890"), "123456");
  assert.equal(cleanOtpInput(""), "");
  assert.equal(cleanOtpInput("   "), "");
});

test("splitOtpDigits pads with empty strings to expected length", () => {
  const digits = splitOtpDigits("123", 6);
  assert.deepEqual(digits, ["1", "2", "3", "", "", ""]);

  const full = splitOtpDigits("987654", 6);
  assert.deepEqual(full, ["9", "8", "7", "6", "5", "4"]);

  const empty = splitOtpDigits("", 6);
  assert.deepEqual(empty, ["", "", "", "", "", ""]);
});

test("isOtpComplete verifies 6 complete digits", () => {
  assert.equal(isOtpComplete("123456"), true);
  assert.equal(isOtpComplete("12345"), false);
  assert.equal(isOtpComplete("1234567"), true); // gets clamped to 6
  assert.equal(isOtpComplete(""), false);
  assert.equal(isOtpComplete("abc"), false);
});

test("formatOtpAccessibleAnnouncement builds clear screen-reader message", () => {
  assert.equal(formatOtpAccessibleAnnouncement("123456"), "Código digitado: 1 2 3 4 5 6");
  assert.equal(formatOtpAccessibleAnnouncement(""), "Nenhum dígito inserido");
});
