/**
 * API base URL for client requests. Empty string = same-origin (`/api/*`),
 * which is handled by Astro SSR and Cloudflare Worker proxying to backend services.
 */
export const API_BASE_URL =
  (typeof process !== "undefined" && (process.env?.PUBLIC_API_BASE_URL || process.env?.NEXT_PUBLIC_API_BASE_URL)) ||
  (import.meta.env && (import.meta.env.PUBLIC_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL)) ||
  "";

export const API_TIMEOUT_MS = 12_000;

/**
 * Official support WhatsApp number in E.164 format without '+' (e.g. "5542984321915").
 * Formatted: (42) 9 8432-1915.
 */
export const SUPPORT_WHATSAPP_NUMBER =
  (typeof process !== "undefined" && process.env?.PUBLIC_SUPPORT_WHATSAPP) ||
  (import.meta.env && (import.meta.env.PUBLIC_SUPPORT_WHATSAPP || import.meta.env.NEXT_PUBLIC_SUPPORT_WHATSAPP)) ||
  "5542984321915";

export const SUPPORT_WHATSAPP_PHONE = "(42) 9 8432-1915";
