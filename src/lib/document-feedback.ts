export interface DocumentBlock {
  source_type?: string;
  title?: string;
  reason?: string;
  description?: string;
}

/** A reason belongs to its current step and document, not another user's role. */
export function currentCandidateBlocks(blocks: DocumentBlock[], step: string, docType: string): DocumentBlock[] {
  if (step === "rejected" || step === "review") return blocks;
  const source = step === "documents" ? docType : step === "address" ? "address_proof" : step === "selfie" ? "selfie" : step === "pix" ? "pix" : null;
  return source ? blocks.filter(block => block.source_type === source || block.source_type?.startsWith(`${source}_`)) : [];
}

export function identityCollectionMessage(status: string | null | undefined): string {
  if (status === "review") return "Documento recebido. O polo fará a revisão; não precisa enviar outra imagem agora.";
  if (status === "approved") return "Documento aprovado. Os dados extraídos foram conferidos.";
  return "Frente e verso recebidos. Estamos conferindo seus dados; não precisa enviar outra imagem.";
}

const FILE_ERRORS: Record<string, string> = {
  PDF_PASSWORD_REQUIRED: "Este PDF está protegido por senha. Remova a senha ou envie uma foto do documento.",
  PDF_TOO_MANY_PAGES: "Envie um PDF com até duas páginas do documento.",
  PDF_EMPTY: "Este PDF não tem páginas. Escolha outro arquivo.",
  PDF_TOO_LARGE: "Escolha um arquivo de até 15 MB.",
  PDF_DECODE_FAILED: "Não foi possível abrir esse PDF. Escolha outro arquivo ou envie uma foto do documento.",
  PDF_RENDER_FAILED: "Não foi possível abrir esse PDF agora. Tente novamente ou envie uma foto do documento.",
};

/** Only trusted decoder codes become actionable file errors; AI prose is not reused. */
export function documentFileError(code?: string | null): string | null {
  return code ? FILE_ERRORS[code] || null : null;
}
