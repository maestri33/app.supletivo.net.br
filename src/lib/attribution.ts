/**
 * Captura, persistência e propagação de atribuição (UTMs, Click IDs e Ref de Consultor).
 * Alinhado com o contrato canônico entre Landing Page e Portal (Issue #3).
 */

export const ATTR_KEYS = [
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

export type AttrKey = (typeof ATTR_KEYS)[number];
export type AttributionData = Partial<Record<AttrKey, string>> & { ts?: number };

const STORAGE_KEY = "supletivo.attr";
const COOKIE_ATTR = "supletivo.attr";
const COOKIE_REF = "sb_ref";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function readStoredAttribution(): AttributionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveAttribution(data: AttributionData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function initAttribution(searchStr: string = typeof location !== "undefined" ? location.search : ""): AttributionData {
  const current: AttributionData = {};
  if (searchStr) {
    const params = new URLSearchParams(searchStr);
    for (const key of ATTR_KEYS) {
      const val = params.get(key);
      if (val && val.trim().length > 0) {
        current[key] = val.trim();
      }
    }
  }

  let stored = readStoredAttribution() || {};

  // Redundância de cookies first-party (.supletivo.net.br)
  if (!current.ref && !stored.ref) {
    const cookieRef = readCookie(COOKIE_REF);
    if (cookieRef) current.ref = cookieRef;
  }

  const merged: AttributionData = {
    ...stored,
    ...current,
    ts: Date.now(),
  };

  if (Object.keys(current).length > 0 || !stored.ts) {
    saveAttribution(merged);
  }

  return merged;
}

export function getAttribution(): AttributionData {
  return readStoredAttribution() || initAttribution();
}

export function hasAffiliateRef(): boolean {
  const attr = getAttribution();
  return Boolean(attr.ref && attr.ref.trim().length > 0);
}
