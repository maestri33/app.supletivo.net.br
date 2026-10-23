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
  week_start?: string;
  week_end?: string;
  week_paid_leads: number;
  week_goal?: number;
  goal_reached?: boolean;
  week_commission_total: string;
  bonus_amount?: string;
  next_closing_at?: string;
  lifetime: { total_students: number; goals_hit?: number; total_received: string };
}

export interface WeeklyCommissionsMetrics {
  receivedAmount: string;
  receivedLabel: string;
  weekPendingAmount: string;
  weekPendingLabel: string;
  weekAccruedLabel: string | null;
  closingLabel: string;
}

export function calculatePromoterWeeklyMetrics(
  summary?: PromoterSummary | null,
  commissions?: PromoterCommission[]
): WeeklyCommissionsMetrics {
  let receivedAmount = "0.00";
  if (
    summary?.lifetime?.total_received !== undefined &&
    summary?.lifetime?.total_received !== null &&
    summary.lifetime.total_received !== ""
  ) {
    receivedAmount = summary.lifetime.total_received;
  } else if (commissions && commissions.length > 0) {
    receivedAmount = commissionTotal(commissions, ["paid"]);
  }

  let weekPendingAmount = "0.00";
  if (commissions && commissions.length > 0) {
    weekPendingAmount = commissionTotal(commissions, ["pending", "processed"]);
  } else if (
    summary?.week_commission_total !== undefined &&
    summary?.week_commission_total !== null &&
    summary.week_commission_total !== ""
  ) {
    weekPendingAmount = summary.week_commission_total;
  }

  let weekAccruedLabel: string | null = null;
  if (
    summary?.week_commission_total !== undefined &&
    summary?.week_commission_total !== null &&
    summary.week_commission_total !== ""
  ) {
    weekAccruedLabel = moneyLabel(summary.week_commission_total);
  }

  return {
    receivedAmount,
    receivedLabel: moneyLabel(receivedAmount),
    weekPendingAmount,
    weekPendingLabel: moneyLabel(weekPendingAmount),
    weekAccruedLabel,
    closingLabel: formatClosingDate(summary?.next_closing_at),
  };
}

export function formatClosingDate(iso?: string | null): string {
  if (!iso) return "Fechamento na sexta-feira às 18:00";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Fechamento na sexta-feira às 18:00";
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" });
    const day = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `Fechamento: ${weekday}, ${day} às ${time}`;
  } catch {
    return "Fechamento na sexta-feira às 18:00";
  }
}

export function commissionTotal(commissions: PromoterCommission[], statuses: string[]): string {
  const cents = commissions.filter((item) => statuses.includes(item.status)).reduce((sum, item) => {
    const raw = String(item.amount ?? "").trim();
    const parts = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
    if (!parts) throw new Error("O servidor retornou um valor de comissão inválido.");
    const isNegative = parts[1] === "-";
    const intPart = BigInt(parts[2]);
    const decStr = (parts[3] || "").padEnd(2, "0").slice(0, 2);
    const decPart = BigInt(decStr);
    const absolute = intPart * 100n + decPart;
    return sum + (isNegative ? -absolute : absolute);
  }, 0n);
  const absolute = cents < 0n ? -cents : cents;
  return `${cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

export function moneyLabel(amount: string | number): string {
  const val = typeof amount === "number" ? amount : Number(amount || 0);
  return (isNaN(val) ? 0 : val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando fechamento", processed: "Repasse em processamento",
  paid: "Pago no Pix", failed: "Falha no repasse", cancelled: "Comissão cancelada",
};
