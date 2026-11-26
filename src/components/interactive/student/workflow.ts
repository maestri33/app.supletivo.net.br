export function enrollmentPath(stepOrSubstatus: string | number | null | undefined): string | null {
  switch (stepOrSubstatus) {
    case 1:
    case "rg":
    case "rg_pending":
      return "/student/enrollment/rg";
    case 2:
    case "address":
    case "address_pending":
    case "needs_kinship":
      return "/student/enrollment/address";
    case 3:
    case "education":
    case "education_pending":
      return "/student/enrollment/education";
    case 4:
    case "selfie":
    case "selfie_pending":
      return "/student/enrollment/selfie";
    case 5:
    case "awaiting_release":
    case "pending_siga":
      return "/student/enrollment";
    default:
      return null;
  }
}

/** Only explicit HTTPS links may leave the app; reject embedded credentials. */
export function safePartnerUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  lead: "Aguardando Matrícula",
  payment_pending: "Pagamento Pendente",
  pre_enrolled: "Fase de Matrícula",
  enrolled: "Matrícula Ativa",
  exam_scheduled: "Prova Agendada",
  awaiting_pickup: "Aguardando Retirada do Diploma",
  graduated: "Concluído",
  cancelled: "Matrícula Cancelada",
  siga_active: "Acesso Liberado",
  pending_post_siga_docs: "Documentação Complementar Pendente",
  eligible_for_exam: "Liberado para Prova",
  scheduled: "Prova Agendada",
  pending_documents: "Emissão de Diploma",
  ready_for_pickup: "Pronto para Retirada",
};

export function dateLabel(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Ainda não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não disponível" : date.toLocaleDateString("pt-BR");
}

export function dateTimeLabel(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Ainda não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data não disponível"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function imageError(file: File): string | null {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ? null
    : "Envie uma imagem JPG, PNG ou WebP legível.";
}

export function documentFileError(file: File): string | null {
  return ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)
    ? null
    : "Envie uma imagem (JPG, PNG, WebP) ou arquivo PDF legível.";
}
