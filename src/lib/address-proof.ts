import { documentFileError } from "./document-feedback.ts";

export interface AddressAnalysis {
  exists?: boolean;
  status?: string | null;
  poll_after_ms?: number | null;
  expires_at?: string | null;
}

export function addressPollDelay(proof: AddressAnalysis | null | undefined): number | null {
  if (!proof?.exists || proof.status !== "pending") return null;
  return Math.max(500, Math.min(proof.poll_after_ms || 2500, 30_000));
}

/** Inconclusive AI never silently counts as a document; the source must be identified. */
export function addressClassificationError(result: {
  is_document?: boolean | null; is_legible?: boolean | null;
  doc_type?: string | null; error_code?: string | null;
}): string | null {
  const fileError = documentFileError(result.error_code);
  if (fileError) return fileError;
  if (result.is_document === false) return "Esse arquivo não é um documento. Envie um comprovante de residência.";
  if (result.is_legible === false) return "Não conseguimos ler essa imagem. Envie uma foto nítida, sem cortes.";
  if (result.is_document !== true || !result.doc_type || result.is_legible == null) return "Não conseguimos identificar o comprovante agora. Tente novamente com uma imagem nítida.";
  if (result.doc_type !== "address_proof") return "Nesta etapa, envie um comprovante de residência com titular e endereço visíveis.";
  return null;
}
