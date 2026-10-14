import type { Pricing } from "@/lib/payment";
import { fetchJsonWithDeadline } from "./deadline";

/**
 * Server-only. Uses URL_BACKEND (non-public env) — never import from a Client Component.
 * Direct upstream fetch (no proxy needed server-side).
 */
const URL_BACKEND = process.env.URL_BACKEND ?? "https://backend.supletivo.net.br";

export async function getPricing(): Promise<Pricing | null> {
  try {
    const { response: res, data } = await fetchJsonWithDeadline<Pricing>(`${URL_BACKEND}/api/v1/clients/pricing`, { cache: "no-store" });
    if (!res.ok) return null;
    return data;
  } catch {
    return null;
  }
}
