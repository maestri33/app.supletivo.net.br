/**
 * Lightweight client-side session cache (low sensitivity).
 * Uses localStorage; all calls are safe to run before hydration (guarded).
 */
export interface SessionCache {
  phone: string;
  externalId: string | null;
  ref?: string | null;
  role?: string | null;
  cpf?: string | null;
  email?: string | null;
}

const KEY = "supletivo.session";

export function saveSession(session: SessionCache): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): SessionCache | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    try {
      const match = document.cookie.match(/(?:^|;\s*)supletivo\.session=([^;]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded) as SessionCache;
        if (parsed && typeof parsed === "object" && typeof parsed.phone === "string") {
          window.localStorage.setItem(KEY, decoded);
          return parsed;
        }
      }
    } catch {
      return null;
    }
    return null;
  }
  try {
    return JSON.parse(raw) as SessionCache;
  } catch {
    return null;
  }
}

const AUTH_COOKIE = "supletivo.auth";
const AUTH_COOKIE_MAX_AGE = 2592000; // 30 days in seconds

export function clearLogin(): void {
  if (typeof window === "undefined") return;
  refreshTokenMemory = null;
  window.localStorage.removeItem(LOGIN_KEY);
  try {
    const secureFlag = typeof location !== "undefined" && location.protocol === "https:" ? ";Secure" : "";
    document.cookie = `${AUTH_COOKIE}=;path=/;domain=.supletivo.net.br;max-age=0;SameSite=Lax${secureFlag}`;
    document.cookie = `${AUTH_COOKIE}=;path=/;max-age=0;SameSite=Lax${secureFlag}`;
  } catch {}
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  clearLogin();
  window.localStorage.removeItem(KEY);
  try {
    const secureFlag = typeof location !== "undefined" && location.protocol === "https:" ? ";Secure" : "";
    document.cookie = `${KEY}=;path=/;domain=.supletivo.net.br;max-age=0;SameSite=Lax${secureFlag}`;
    document.cookie = `${KEY}=;path=/;max-age=0;SameSite=Lax${secureFlag}`;
  } catch {}
}

const LOGIN_KEY = "supletivo.login";
let refreshTokenMemory: string | null = null;

export function saveLogin(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const refresh = payload.refresh_token;
  if (typeof refresh === "string" && refresh.length > 0) {
    refreshTokenMemory = refresh;
  }
  window.localStorage.setItem(LOGIN_KEY, JSON.stringify(payload));
  try {
    const secureFlag = typeof location !== "undefined" && location.protocol === "https:" ? ";Secure" : "";
    const roles = Array.isArray(payload.roles)
      ? (payload.roles as string[]).map((r) => String(r).toLowerCase().trim())
      : [];
    const activeRole =
      typeof payload.active_role === "string"
        ? payload.active_role.toLowerCase().trim()
        : typeof payload.activeRole === "string"
        ? payload.activeRole.toLowerCase().trim()
        : "";
    const hasStudent = roles.some((r) => ["client", "student", "aluno"].includes(r));
    const isAdminPrimary =
      roles.includes("admin") && (activeRole === "admin" || !hasStudent);
    const roleValue = isAdminPrimary ? "admin" : "student";
    document.cookie = `${AUTH_COOKIE}=${roleValue};path=/;domain=.supletivo.net.br;max-age=${AUTH_COOKIE_MAX_AGE};SameSite=Lax${secureFlag}`;
    document.cookie = `${AUTH_COOKIE}=${roleValue};path=/;max-age=${AUTH_COOKIE_MAX_AGE};SameSite=Lax${secureFlag}`;
  } catch {}
}

export function getLogin(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOGIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function subscribeStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function getAccessToken(): string | null {
  const login = getLogin();
  const token = login?.access_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export function getRefreshToken(): string | null {
  if (refreshTokenMemory) return refreshTokenMemory;
  if (typeof window === "undefined") return null;
  const token = getLogin()?.refresh_token;
  if (typeof token === "string" && token.length > 0) {
    refreshTokenMemory = token;
    return token;
  }
  return null;
}

const CHECKOUT_KEY = "supletivo.checkout";

export function saveCheckout(checkout: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHECKOUT_KEY, JSON.stringify(checkout));
}

export function getCheckout(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CHECKOUT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
