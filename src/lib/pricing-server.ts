import type { Pricing } from "@/lib/payment";
import { fetchJsonWithDeadline } from "./deadline";

/**
 * Server-only. Uses URL_BACKEND (non-public env) — never import from a Client Component.
 * Direct upstream fetch (no proxy needed server-side).
 */
const URL_BACKEND = process.env.URL_BACKEND ?? "https://backend.supletivo.net.br";

export async function getPricing(): Promise<Pricing | null> {
  const fallback: Pricing = {
    pix: "999.00",
    card: { installments: 12, installment: "99.00", total: "1188.00" },
  };
  try {
    const { response: res, data } = await fetchJsonWithDeadline<
      Pricing & { promo_pix?: string | null; promo_card?: Pricing["card"] | null }
    >(`${URL_BACKEND}/api/v1/clients/pricing`, { cache: "no-store" });
    if (!res.ok || !data) return fallback;
    const pix =
      data.promo_pix ?? (data.pix === "1615.00" ? "999.00" : data.pix || "999.00");
    const card = data.promo_card ?? fallback.card;
    return {
      ...data,
      pix,
      card,
    };
  } catch {
    return fallback;
  }
}
