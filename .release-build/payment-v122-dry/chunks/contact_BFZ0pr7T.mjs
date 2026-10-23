globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
//#region src/pages/api/v1/auth/recovery/contact.ts
var contact_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const body = await request.json();
		const { cpf, new_phone, method, current_phone } = body;
		const cpfDigits = cpf ? cpf.replace(/\D/g, "") : "";
		const phoneDigits = new_phone ? new_phone.replace(/\D/g, "") : "";
		if (cpfDigits.length !== 11) return new Response(JSON.stringify({ error: "CPF inválido. Informe os 11 dígitos do documento." }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (phoneDigits.length < 10 || phoneDigits.length > 11) return new Response(JSON.stringify({ error: "Novo número de telefone inválido. Informe DDD + número." }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1";
		const userAgent = request.headers.get("user-agent") || "unknown";
		const timestamp = (/* @__PURE__ */ new Date()).toISOString();
		const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const maskedCpf = `${cpfDigits.slice(0, 3)}.***.***-${cpfDigits.slice(-2)}`;
		const maskedNewPhone = `(${phoneDigits.slice(0, 2)}) *****-${phoneDigits.slice(-4)}`;
		console.info("[AUDIT_LOG:CONTACT_CHANGE]", JSON.stringify({
			event: "STUDENT_CONTACT_CHANGE_REQUESTED",
			audit_id: auditId,
			timestamp,
			client_ip: clientIp,
			user_agent: userAgent,
			masked_cpf: maskedCpf,
			masked_new_phone: maskedNewPhone,
			previous_phone: current_phone || "not_provided",
			method: method || "email",
			status: "PENDING_SECONDARY_VALIDATION"
		}));
		const URL_BACKEND = process.env.URL_BACKEND ?? "https://backend.supletivo.net.br";
		try {
			const backendRes = await fetch(`${URL_BACKEND}/api/v1/clients/auth/recover-phone`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-forwarded-for": clientIp,
					"user-agent": userAgent
				},
				body: JSON.stringify({
					cpf: cpfDigits,
					new_phone: phoneDigits,
					birth_date: body.birth_date,
					email: body.email,
					otp: body.otp,
					method: method || "email",
					turnstile_token: body.turnstile_token
				}),
				signal: AbortSignal.timeout(2e4)
			});
			if (backendRes.status < 500) {
				const backendData = await backendRes.json();
				return new Response(JSON.stringify({
					success: backendData.success ?? backendRes.status === 200,
					protocol: backendData.protocol,
					status: backendData.status ?? (backendRes.status === 200 ? "COMPLETED" : "ERROR"),
					requires_challenge: backendData.requires_challenge ?? false,
					masked_email: backendData.masked_email,
					masked_new_phone: backendData.masked_new_phone || maskedNewPhone,
					instructions: backendData.message,
					error: backendData.detail || (backendRes.status >= 400 ? backendData.message : void 0)
				}), {
					status: backendRes.status,
					headers: { "Content-Type": "application/json" }
				});
			}
		} catch (backendErr) {
			console.warn("[CONTACT_RECOVERY] Backend unavailable; recovery was not confirmed.");
		}
		return new Response(JSON.stringify({
			success: false,
			error: "Não foi possível confirmar a recuperação. Tente novamente em instantes."
		}), {
			status: 502,
			headers: { "Content-Type": "application/json" }
		});
	} catch (err) {
		console.error("[CONTACT_RECOVERY_ERROR]", err);
		return new Response(JSON.stringify({ error: "Falha ao processar solicitação de troca de contato." }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
export { contact_exports as n, POST as t };
