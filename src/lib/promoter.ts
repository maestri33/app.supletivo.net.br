/** Contracts returned by the collaborators API, without estimated commissions. */
export interface PromoterProfile {
  external_id: string;
  name?: string | null;
  ref_url: string;
  status: string;
  locked: boolean;
  payout_locked: boolean;
  pix_key?: string | null;
  pix_validated: boolean;
  pending_materials: unknown[];
}

export interface PromoterLead {
  external_id: string;
  name?: string | null;
  phone?: string | null;
  status: string;
  created_at: string;
}

export interface PromoterCommission {
  external_id: string;
  amount: string;
  source: string;
  status: string;
  created_at: string;
}

export interface PromoterSummary {
  week_paid_leads: number;
  week_goal: number;
  week_commission_total: string;
  bonus_amount: string;
  next_closing_at: string;
  lifetime: { total_students: number; goals_hit: number; total_received: string };
}

export function commissionTotal(commissions: PromoterCommission[], statuses: string[]): string {
  const cents = commissions.filter((item) => statuses.includes(item.status)).reduce((sum, item) => {
    const amount = /^(-?)(\d+)\.(\d{2})$/.exec(item.amount);
    if (!amount) throw new Error("O servidor retornou um valor de comissão inválido.");
    const absolute = BigInt(amount[2]) * 100n + BigInt(amount[3]);
    return sum + (amount[1] ? -absolute : absolute);
  }, 0n);
  const absolute = cents < 0n ? -cents : cents;
  return `${cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function moneyLabel(amount: string): string {
  return Number(amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando fechamento", processed: "Repasse em processamento",
  paid: "Pago no Pix", failed: "Falha no repasse", cancelled: "Comissão cancelada",
};
