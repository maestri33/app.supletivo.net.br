export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  rg: "Documento de identidade", address: "Endereço", education: "Escolaridade", selfie: "Selfie de assinatura",
  awaiting_release: "Aguardando liberação", fee_paid: "Primeira taxa paga", fee_scheduled: "Segunda taxa programada", completed: "Matrícula concluída",
};

export interface HubRow { external_id: string; name?: string | null; phone?: string | null; status: string; }
export interface HubStudentsPage { items: HubRow[]; total: number; limit: number; offset: number; }
export interface HubFee { status: string; amount: string; scheduled_for?: string | null; paid: boolean; last_error?: string | null; }
export interface HubFees { first?: HubFee | null; second?: HubFee | null; first_paid: boolean; second_scheduled: boolean; }
export interface HubMedia { label: string; path?: string | null; }
export interface HubEnrollment {
  external_id: string; status: string; fees: HubFees;
  profile?: Record<string, string | null> | null;
  address?: Record<string, unknown> | null;
  address_proof?: { photo?: string | null; validation_status?: string | null; analysis_reason?: string | null; kinship_description?: string | null } | null;
  education?: { level?: string | null; grade?: number | null; completed?: boolean | null; last_school?: string | null } | null;
  rg?: { front_photo?: string | null; back_photo?: string | null; full_photo?: string | null; analysis_reason?: string | null; validation_status?: string | null } | null;
  selfie?: { photo?: string | null; status?: string | null; analysis_reason?: string | null; description?: string | null } | null;
}
export interface HubPendency { external_id: string; kind: string; description: string; amount_cents?: number | null; resolved: boolean; }
export interface HubDocument { external_id: string; doc_type: string; photo?: string | null; validation_status: string; analysis_reason?: string | null; }
export interface HubStudent {
  external_id: string; status: string; blood_type?: string | null;
  platform: { url?: string | null; login?: string | null; password?: string | null; notes?: string | null };
  documents: HubDocument[]; pendencies: HubPendency[];
  diploma?: { issued_at?: string | null; picked_up: boolean } | null;
  user: { name?: string | null; phone?: string | null; cpf?: string | null };
}
export interface HubCandidate {
  external_id: string; status: string; user: { name?: string | null; phone?: string | null };
  document?: { front_photo?: string | null; back_photo?: string | null; full_photo?: string | null; analysis_status?: string | null; analysis_reason?: string | null } | null;
  selfie_image?: string | null; selfie_status: string; selfie_description?: string | null;
  pix_key?: string | null; pix_validated: boolean;
}

/** Parse an operator-entered BRL amount without binary floating point rounding. */
export function amountInCents(value: string): number | null {
  const input = value.trim();
  if (!input) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(input)) throw new Error("Informe o valor em reais, por exemplo 125,50, sem separador de milhares.");
  const [whole, fraction = ""] = input.split(/[.,]/);
  const cents = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
  if (!Number.isSafeInteger(cents) || cents > 2147483647) throw new Error("Valor fora do limite permitido.");
  return cents;
}

export function centsLabel(value: number): string {
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
