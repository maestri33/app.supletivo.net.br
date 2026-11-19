import { formatBRL } from "@/lib/money";

export type PaymentMethod = "pix" | "card";

export interface CardPricing {
  installments: number;
  installment: string;
  total: string;
}

/** Shape of GET /api/v1/clients/pricing. */
export interface Pricing {
  pix: string;
  card: CardPricing;
  promo_pix?: string | null;
  promo_card?: CardPricing | null;
  has_discount?: boolean;
  promoter_name?: string | null;
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix à vista",
  card: "Cartão de crédito",
};

/** Validate a raw query value into a known payment method (else null). */
export function parsePaymentMethod(raw: string | null | undefined): PaymentMethod | null {
  return raw === "pix" || raw === "card" ? raw : null;
}

/** Short price line, e.g. "R$ 999,00 à vista" or "12× de R$ 99,00". */
export function priceLine(method: PaymentMethod, pricing: Pricing): string {
  if (method === "pix") return `${formatBRL(pricing.pix)} à vista`;
  return `${pricing.card.installments}× de ${formatBRL(pricing.card.installment)}`;
}

export interface TierPricing {
  hasRef: boolean;
  pix: string;
  card: CardPricing;
  economyBrl?: string;
  label?: string;
}

/**
 * Retorna a oferta canônica universal: 12x R$ 99 / R$ 999 no Pix (Economia de R$ 616,00 sobre a âncora R$ 1.615).
 * Universalizada para todo o tráfego (modelo de promotor descontinuado).
 */
export function getConsultantPricing(_hasRef?: boolean): TierPricing {
  return {
    hasRef: true,
    pix: "999.00",
    card: { installments: 12, installment: "99.00", total: "1188.00" },
    economyBrl: "616,00",
    label: "Condição Especial de Matrícula (Desconto de R$ 616)",
  };
}

