/**
 * OTP Utilities — Supletivo
 * Pure functions for clean digit extraction, validation, and accessibility.
 */

export function cleanOtpInput(input: string, length = 6): string {
  if (!input) return "";
  return input.replace(/\D/g, "").slice(0, length);
}

export function splitOtpDigits(code: string, length = 6): string[] {
  const clean = cleanOtpInput(code, length);
  const digits: string[] = [];
  for (let i = 0; i < length; i++) {
    digits.push(clean[i] || "");
  }
  return digits;
}

export function isOtpComplete(code: string, length = 6): boolean {
  const clean = cleanOtpInput(code, length);
  return clean.length === length;
}

export function formatOtpAccessibleAnnouncement(code: string): string {
  const clean = cleanOtpInput(code);
  if (!clean) return "Nenhum dígito inserido";
  return `Código digitado: ${clean.split("").join(" ")}`;
}
