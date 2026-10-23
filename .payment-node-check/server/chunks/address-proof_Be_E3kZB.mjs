//#region src/lib/document-feedback.ts
/** A reason belongs to its current step and document, not another user's role. */
function currentCandidateBlocks(blocks, step, docType) {
	if (step === "rejected" || step === "review") return blocks;
	const source = step === "documents" ? docType : step === "address" ? "address_proof" : step === "selfie" ? "selfie" : step === "pix" ? "pix" : null;
	return source ? blocks.filter((block) => block.source_type === source || block.source_type?.startsWith(`${source}_`)) : [];
}
function identityCollectionMessage(status) {
	if (status === "review") return "Documento recebido. O polo fará a revisão; não precisa enviar outra imagem agora.";
	if (status === "approved") return "Documento aprovado. Os dados extraídos foram conferidos.";
	return "Frente e verso recebidos. Estamos conferindo seus dados; não precisa enviar outra imagem.";
}
var FILE_ERRORS = {
	PDF_PASSWORD_REQUIRED: "Este PDF está protegido por senha. Remova a senha ou envie uma foto do documento.",
	PDF_TOO_MANY_PAGES: "Envie um PDF com até duas páginas do documento.",
	PDF_EMPTY: "Este PDF não tem páginas. Escolha outro arquivo.",
	PDF_TOO_LARGE: "Escolha um arquivo de até 15 MB.",
	PDF_DECODE_FAILED: "Não foi possível abrir esse PDF. Escolha outro arquivo ou envie uma foto do documento.",
	PDF_RENDER_FAILED: "Não foi possível abrir esse PDF agora. Tente novamente ou envie uma foto do documento."
};
/** Only trusted decoder codes become actionable file errors; AI prose is not reused. */
function documentFileError(code) {
	return code ? FILE_ERRORS[code] || null : null;
}
//#endregion
//#region src/lib/address-proof.ts
function addressPollDelay(proof) {
	if (!proof?.exists || proof.status !== "pending") return null;
	return Math.max(500, Math.min(proof.poll_after_ms || 2500, 3e4));
}
/** Inconclusive AI never silently counts as a document; the source must be identified. */
function addressClassificationError(result) {
	const fileError = documentFileError(result.error_code);
	if (fileError) return fileError;
	if (result.is_document === false) return "Esse arquivo não é um documento. Envie um comprovante de residência.";
	if (result.is_legible === false) return "Não conseguimos ler essa imagem. Envie uma foto nítida, sem cortes.";
	if (result.is_document !== true || !result.doc_type || result.is_legible == null) return "Não conseguimos identificar o comprovante agora. Tente novamente com uma imagem nítida.";
	if (result.doc_type !== "address_proof") return "Nesta etapa, envie um comprovante de residência com titular e endereço visíveis.";
	return null;
}
//#endregion
export { identityCollectionMessage as a, documentFileError as i, addressPollDelay as n, currentCandidateBlocks as r, addressClassificationError as t };
