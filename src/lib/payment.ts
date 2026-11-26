export type PaymentMethod = "pix" | "card";

export interface CardPricing {
  installments: number;
  installment: string;
  total: string;
}

/** Shape of GET /api/v1/catalog/pricing. */
export interface Pricing {
  pix: string;
  card?: CardPricing | null;
  promo_pix?: string | null;
  promo_card?: CardPricing | null;
  anchor_full?: string | null;
  has_discount?: boolean;
  updated_at?: string;
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix à vista",
  card: "Cartão de crédito (até 12x na InfinitePay)",
};

export function parsePaymentMethod(raw: string | null | undefined): PaymentMethod | null {
  return raw === "pix" || raw === "card" ? raw : null;
}

export function normalizeCatalogPricing(
  data: Pricing & { promo_pix?: string | null; promo_card?: Pricing["card"] | null }
): Pricing {
  const pix = data.promo_pix ?? (data.pix === "1615.00" ? "999.00" : data.pix || "999.00");
  return {
    ...data,
    pix,
    card: data.promo_card ?? null,
  };
}
