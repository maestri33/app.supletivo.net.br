globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as ApiError } from "./RootLayout_C0gAutpq.mjs";
//#region src/components/interactive/student/workflow.ts
function enrollmentPath(status) {
	switch (status) {
		case "rg": return "/student/enrollment/rg";
		case "address": return "/student/enrollment/address";
		case "education": return "/student/enrollment/education";
		case "selfie": return "/student/enrollment/selfie";
		case "awaiting_release": return "/student/enrollment";
		default: return null;
	}
}
function followEnrollmentStatus(status) {
	const target = enrollmentPath(status);
	if (target && window.location.pathname.replace(/\/$/, "") !== target) {
		window.location.replace(target);
		return true;
	}
	return false;
}
function expectedStatus(error) {
	if (!(error instanceof ApiError)) return null;
	const status = error.expectedStatus ?? error.extra?.expected_status;
	return typeof status === "string" ? status : null;
}
/** Only explicit HTTP(S) links may leave the app; reject embedded credentials. */
function safePartnerUrl(value) {
	if (!value) return null;
	try {
		const url = new URL(value);
		if (url.protocol !== "https:" || url.username || url.password) return null;
		return url.href;
	} catch {
		return null;
	}
}
/** Backend media paths are local files, never executable or protocol-relative URLs. */
function safeMediaUrl(value) {
	if (!value || /[\\\u0000-\u001f]/.test(value)) return null;
	if (/^https?:\/\//i.test(value)) return safePartnerUrl(value);
	if (value.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
	const path = value.replace(/^\/+/, "");
	if (!path || path.split("/").some((part) => part === "." || part === "..")) return null;
	return path.startsWith("media/") ? `/${path}` : `/media/${path}`;
}
var STUDENT_STATUS_LABELS = {
	awaiting_documents: "Aguardando documentos",
	documents_under_review: "Documentos em análise",
	blood_type_pending: "Tipo sanguíneo pendente",
	exam_released: "Prova liberada",
	exam_scheduled: "Prova agendada",
	exam_failed: "Nova prova necessária",
	awaiting_documentation_dispatch: "Aguardando envio da documentação",
	pending: "Pendências em aberto",
	awaiting_diploma_issuance: "Aguardando emissão do diploma",
	awaiting_pickup: "Aguardando retirada do diploma",
	veteran: "Concluído"
};
function dateLabel(value) {
	if (!value) return "Ainda não informado";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "Data não disponível" : date.toLocaleDateString("pt-BR");
}
//#endregion
export { followEnrollmentStatus as a, expectedStatus as i, dateLabel as n, safeMediaUrl as o, enrollmentPath as r, safePartnerUrl as s, STUDENT_STATUS_LABELS as t };
