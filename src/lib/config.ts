/**
 * API base URL for client requests. Empty string = same-origin (`/api/*`),
 * which is handled by Astro SSR and Cloudflare Worker proxying to api.supletivo.net.br.
 */
export const API_BASE_URL =
  (typeof process !== "undefined" && (process.env?.PUBLIC_API_BASE_URL || process.env?.NEXT_PUBLIC_API_BASE_URL)) ||
  (import.meta.env && (import.meta.env.PUBLIC_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL)) ||
  "";

export const API_TIMEOUT_MS = 12_000;

export const INSTITUTIONAL_EMAIL = "contato@supletivo.net.br";

export interface InstitutionalContact {
  organization: string;
  cnpj: string;
  email: string;
  whatsapp_number: string | null;
  whatsapp_display: string | null;
  whatsapp_url: string | null;
}

export const DEFAULT_INSTITUTIONAL_CONTACT: InstitutionalContact = {
  organization: "Supletivo Brasil",
  cnpj: "48.811.016/0001-00",
  email: INSTITUTIONAL_EMAIL,
  whatsapp_number: null,
  whatsapp_display: null,
  whatsapp_url: null,
};

export function resolveSupportHref(contact?: InstitutionalContact | null): string {
  if (contact?.whatsapp_url && /^https:\/\/wa\.me\/\d+/.test(contact.whatsapp_url)) {
    return contact.whatsapp_url;
  }
  const email = contact?.email?.trim() || INSTITUTIONAL_EMAIL;
  return `mailto:${email}`;
}
