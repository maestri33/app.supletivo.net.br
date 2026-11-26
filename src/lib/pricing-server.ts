import type { Pricing } from "@/lib/payment";
import { fetchJsonWithDeadline } from "./deadline";

/**
 * Server-only. Uses URL_BACKEND (non-public env) — never import from a Client Component.
 * Direct upstream fetch (no proxy needed server-side).
 */
export async function getPricing(runtimeEnv?: { URL_BACKEND?: string }): Promise<Pricing | null> {
  const backendUrl =
    runtimeEnv?.URL_BACKEND ??
    (typeof process !== "undefined" ? process.env?.URL_BACKEND : undefined) ??
    import.meta.env.URL_BACKEND ??
    "https://api.supletivo.net.br";

  const fallback: Pricing = {
    pix: "999.00",
    card: null,
  };

  try {
    const { response: res, data } = await fetchJsonWithDeadline<
      Pricing & { promo_pix?: string | null; promo_card?: Pricing["card"] | null }
    >(`${backendUrl}/v1/catalog/pricing`, { cache: "no-store" });
    if (!res.ok || !data) return fallback;
    const pix =
      data.promo_pix ?? (data.pix === "1615.00" ? "999.00" : data.pix || "999.00");
    return {
      ...data,
      pix,
      card: data.promo_card ?? null,
    };
  } catch {
    return fallback;
  }
}
