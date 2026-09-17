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
 * Retorna as condições de preço conforme a presença de indicação de consultor (Issue #3).
 * Com ref: Lote 01 Promocional (12x R$ 99 / R$ 999 no Pix, economia de R$ 616,00).
 * Sem ref: Tabela oficial (12x R$ 161 / R$ 1.615 no Pix).
 */
export function getConsultantPricing(hasRef: boolean): TierPricing {
  if (hasRef) {
    return {
      hasRef: true,
      pix: "999.00",
      card: { installments: 12, installment: "99.00", total: "1188.00" },
      economyBrl: "616,00",
      label: "Desconto aplicado via Consultor Autorizado",
    };
  }
  return {
    hasRef: false,
    pix: "1615.00",
    card: { installments: 12, installment: "161.00", total: "1932.00" },
  };
}

