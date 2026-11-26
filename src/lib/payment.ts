import { formatBRL } from "@/lib/money";

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

export function priceLine(method: PaymentMethod, pricing: Pricing): string {
  const pixValue = pricing.promo_pix ?? pricing.pix;
  if (method === "pix") return `${formatBRL(pixValue)} à vista`;
  return `em até 12x no cartão pela InfinitePay (${formatBRL(pixValue)} à vista no Pix)`;
}

export interface TierPricing {
  hasRef: boolean;
  pix: string;
  card: CardPricing | null;
  economyBrl?: string;
  label?: string;
}

export function getConsultantPricing(_hasRef?: boolean): TierPricing {
  return {
    hasRef: true,
    pix: "999.00",
    card: null,
    economyBrl: "616,00",
    label: "Condição Especial de Matrícula (Desconto de R$ 616)",
  };
}
