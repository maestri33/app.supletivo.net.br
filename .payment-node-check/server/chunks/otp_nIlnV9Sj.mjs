import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent, w as createAstro } from "./server_ZN1nPn8N.mjs";
import { a as ensure_array_like, c as attr, i as derived, s as stringify, t as attr_class, u as escape_html } from "./index-server_DvB6aUE6.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import { t as Modal } from "./Modal_CH2Qs_1k.mjs";
//#region src/components/interactive/ContactRecoveryModal.svelte
function ContactRecoveryModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { isOpen = false, currentPhone = "", initialCpf = "", initialNewPhone = "", onClose, onSuccess } = $$props;
		let step = "form";
		let cpf = "";
		let newPhone = "";
		let otpCode = "";
		let errorMessage = null;
		let protocol = null;
		let instructions = null;
		let maskedEmail = null;
		let maskedNewPhone = null;
		function resetAndClose() {
			step = "form";
			cpf = "";
			newPhone = "";
			otpCode = "";
			errorMessage = null;
			protocol = null;
			instructions = null;
			maskedEmail = null;
			maskedNewPhone = null;
			onClose();
		}
		Modal($$renderer, {
			isOpen,
			onClose: resetAndClose,
			eyebrow: "Segurança de Conta",
			eyebrowVariant: "amber",
			title: "Atualização Segura de Contato",
			description: "Autoatendimento para recuperação de acesso vinculado ao seu CPF.",
			testId: "contact-recovery-modal",
			size: "lg",
			children: ($$renderer) => {
				if (step === "form") {
					$$renderer.push(`<!--[0--><div class="flex flex-col gap-4"><div class="flex flex-col gap-1.5"><label for="recovery-cpf" class="text-xs font-bold text-white/90">Confirme seu CPF cadastrado</label> <input id="recovery-cpf" data-testid="recovery-cpf-input" type="text" inputmode="numeric" placeholder="000.000.000-00"${attr("value", cpf)} class="h-12 w-full rounded-xl bg-white/5 border border-white/20 px-4 text-sm font-mono text-white focus:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow/30 transition"/></div> <div class="flex flex-col gap-1.5"><label for="recovery-new-phone" class="text-xs font-bold text-white/90">Novo celular / WhatsApp (com DDD)</label> <input id="recovery-new-phone" data-testid="recovery-phone-input" type="tel" inputmode="tel" placeholder="(11) 90000-0000"${attr("value", newPhone)} class="h-12 w-full rounded-xl bg-white/5 border border-white/20 px-4 text-sm font-mono text-white focus:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow/30 transition"/></div> <div class="flex flex-col gap-2 pt-2"><span class="text-xs font-bold text-white/90">Escolha o método de validação de segurança:</span> <div class="grid grid-cols-1 gap-2.5"><label${attr_class(`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition border-yellow bg-yellow/10`)}><input type="radio" name="recovery_method" value="email"${attr("checked", true, true)} class="mt-1 accent-yellow"/> <div class="flex flex-col text-left"><span class="text-xs font-bold text-white">Link de confirmação no e-mail cadastrado</span> <span class="text-[11px] text-white/60">Enviaremos um código OTP de 6 dígitos para o e-mail registrado na sua conta.</span></div></label> <label${attr_class(`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition border-white/10 bg-white/5 hover:border-white/20`)}><input type="radio" name="recovery_method" value="birth_date"${attr("checked", false, true)} class="mt-1 accent-yellow"/> <div class="flex flex-col text-left"><span class="text-xs font-bold text-white">Confirmação por Data de Nascimento</span> <span class="text-[11px] text-white/60">Validação instantânea através da data de nascimento registrada no CPF.</span></div></label> `);
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <label${attr_class(`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition border-white/10 bg-white/5 hover:border-white/20`)}><input type="radio" name="recovery_method" value="biometric"${attr("checked", false, true)} class="mt-1 accent-yellow"/> <div class="flex flex-col text-left"><span class="text-xs font-bold text-white">Reconhecimento facial biométrico</span> <span class="text-[11px] text-white/60">Selfie rápida comparada à foto do RG/CNH arquivado no sistema.</span></div></label> <label${attr_class(`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition border-white/10 bg-white/5 hover:border-white/20`)}><input type="radio" name="recovery_method" value="secretaria"${attr("checked", false, true)} class="mt-1 accent-yellow"/> <div class="flex flex-col text-left"><span class="text-xs font-bold text-white">Atendimento humano na secretaria acadêmica</span> <span class="text-[11px] text-white/60">Gera um protocolo prioritário para atendimento manual seguro.</span></div></label></div></div> `);
					if (errorMessage) $$renderer.push(`<!--[0--><div class="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2" data-testid="recovery-error"><span>⚠️</span> <span>${escape_html(errorMessage)}</span></div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <button type="button" data-testid="recovery-submit-btn" class="mt-2 flex items-center justify-center h-12 w-full rounded-full bg-yellow hover:bg-yellow/90 text-ink font-bold text-sm transition shadow-lg active:scale-[0.99]">Solicitar Atualização de Contato</button></div>`);
				} else if (step === "challenge") {
					$$renderer.push(`<!--[1--><div class="flex flex-col gap-4" data-testid="recovery-challenge-box"><div class="p-3.5 rounded-xl bg-yellow/10 border border-yellow/30 text-xs text-yellow-100 flex items-start gap-2.5"><span class="text-base">📧</span> <div><span class="font-bold text-white">Código de Confirmação Enviado:</span> <p class="text-white/80 mt-0.5">${escape_html(instructions || `Enviamos um código de 6 dígitos para ${maskedEmail || "o seu e-mail"}. Digite-o abaixo:`)}</p></div></div> <div class="flex flex-col gap-1.5"><label for="recovery-otp" class="text-xs font-bold text-white/90">Código de 6 dígitos</label> <input id="recovery-otp" data-testid="recovery-otp-input" type="text" inputmode="numeric" maxlength="6" placeholder="000000"${attr("value", otpCode)} class="h-14 w-full rounded-xl bg-white/5 border border-white/20 px-4 text-center tracking-[0.5em] text-2xl font-mono text-white focus:border-yellow focus:outline-none focus:ring-2 focus:ring-yellow/30 transition"/></div> `);
					if (errorMessage) $$renderer.push(`<!--[0--><div class="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2" data-testid="recovery-error"><span>⚠️</span> <span>${escape_html(errorMessage)}</span></div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <button type="button" data-testid="recovery-verify-otp-btn" class="mt-2 flex items-center justify-center h-12 w-full rounded-full bg-yellow hover:bg-yellow/90 text-ink font-bold text-sm transition shadow-lg active:scale-[0.99]">Confirmar Código e Atualizar Telefone</button> <button type="button" class="text-xs text-white/60 hover:text-white transition text-center underline cursor-pointer">Voltar e escolher outro método</button></div>`);
				} else if (step === "loading") $$renderer.push(`<!--[2--><div class="flex flex-col items-center justify-center py-10 text-center gap-3"><div class="size-10 animate-spin rounded-full border-4 border-yellow border-t-transparent"></div> <p class="text-sm font-bold text-white">Validando protocolo de segurança…</p> <span class="text-xs text-white/60">Processando e gravando log auditável contra sequestro de conta.</span></div>`);
				else if (step === "success") {
					$$renderer.push(`<!--[3--><div class="flex flex-col gap-4 text-center items-center py-4" data-testid="recovery-success-box"><div class="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">✓</div> <div><h4 class="text-lg font-black text-white">Solicitação Protocolada</h4> <p class="text-xs text-white/70 mt-1">${escape_html(instructions || "Seu novo número de telefone foi validado e atualizado na base oficial.")}</p></div> <div class="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md"><span class="text-[10px] font-bold text-white/50 uppercase tracking-wider">Número de Protocolo</span> <p class="font-mono text-base font-black text-yellow mt-0.5" data-testid="recovery-protocol-number">${escape_html(protocol)}</p> `);
					if (maskedNewPhone) $$renderer.push(`<!--[0--><div class="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs"><span class="text-white/60">Novo telefone:</span> <span class="font-mono text-white font-bold">${escape_html(maskedNewPhone)}</span></div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <p class="text-[11px] text-white/60 mt-2">Guarde este código. Uma cópia do registro de auditoria foi vinculada com segurança ao seu histórico acadêmico.</p></div> <button type="button" data-testid="recovery-close-btn" class="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition">Entendido, voltar para o login</button></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region src/components/interactive/OtpVerification.svelte
function OtpVerification($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let digits = [
			"",
			"",
			"",
			"",
			"",
			""
		];
		let busy = false;
		let resendCooldown = 60;
		let phone = "";
		let isRecoveryOpen = false;
		let recoveryCpf = "";
		let recoveryNewPhone = "";
		let mounted = false;
		derived(() => false);
		let code = derived(() => digits.join(""));
		let isComplete = derived(() => code().length === 6);
		function formatDisplayPhone(p) {
			if (!p) return "";
			const d = p.replace(/\D/g, "");
			if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
			return p;
		}
		$$renderer.push(`<div class="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-2xl glass-panel text-white shadow-2xl border border-white/15"><div class="text-center mb-6"><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-blue-300 mb-3"><span class="size-2 rounded-full bg-blue-400 animate-pulse"></span> Autenticação Segura</div> <h1 class="text-2xl sm:text-3xl font-display tracking-tight text-white">Digite seu código</h1> <p class="mt-2 text-sm text-white/70 font-sans">Enviamos um código de 6 dígitos no WhatsApp para:</p> <div class="mt-1 flex items-center justify-center gap-2"><span class="font-mono font-bold text-emerald-300 text-sm">${escape_html(formatDisplayPhone(phone))}</span> <a href="/" class="text-xs text-white/40 hover:text-white underline">Trocar</a></div></div> <div class="space-y-6"><div class="flex items-center justify-between gap-2 sm:gap-3"><!--[-->`);
		const each_array = ensure_array_like(digits);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let digit = each_array[i];
			$$renderer.push(`<input${attr("id", `otp-${stringify(i)}`)} type="text" inputmode="numeric" pattern="[0-9]*"${attr("maxlength", i === 0 ? 6 : 1)}${attr("autocomplete", i === 0 ? "one-time-code" : "off")}${attr("value", digit)}${attr("disabled", busy, true)}${attr("data-hydrated", mounted)} class="size-12 sm:size-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-white/5 border border-white/20 text-white focus:border-yellow focus:ring-2 focus:ring-yellow/30 focus:outline-none transition shadow-inner"/>`);
		}
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="pt-1">`);
		if (isComplete()) $$renderer.push(`<!--[1--><div class="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-sm font-semibold border border-emerald-500/30" role="status" aria-live="polite"><span class="inline-block size-2 rounded-full bg-emerald-400 animate-ping"></span> <span>Código completo. Validando...</span></div>`);
		else $$renderer.push(`<!--[-1--><div class="text-center text-xs text-white/50 py-2" aria-live="polite">Validação automática instantânea ao completar os 6 dígitos</div>`);
		$$renderer.push(`<!--]--></div></div> <div class="mt-6 pt-6 border-t border-white/10 text-center flex flex-col items-center gap-3">`);
		$$renderer.push(`<!--[0--><p class="text-xs text-white/50">Reenviar código em <span class="font-mono text-white font-bold">${escape_html(resendCooldown)}s</span></p>`);
		$$renderer.push(`<!--]--> <button type="button" data-testid="contact-recovery-trigger"${attr("data-hydrated", mounted)} class="text-xs text-white/50 hover:text-white transition underline cursor-pointer">Não tenho mais acesso a este número</button></div> `);
		ContactRecoveryModal($$renderer, {
			isOpen: isRecoveryOpen,
			currentPhone: phone,
			initialCpf: recoveryCpf,
			initialNewPhone: recoveryNewPhone,
			onClose: () => {
				isRecoveryOpen = false;
			}
		});
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
//#region src/pages/autenticacao/otp.astro
var otp_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Otp,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Otp = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Otp;
	const id = Astro.url.searchParams.get("id");
	const tel = Astro.url.searchParams.get("tel");
	const cpf = Astro.url.searchParams.get("cpf");
	const novoTelefone = Astro.url.searchParams.get("novo_telefone") || Astro.url.searchParams.get("new_phone");
	const openRecovery = Astro.url.searchParams.get("open_recovery") === "true";
	const sessionCookie = Astro.cookies.get("supletivo.session")?.value;
	if (!id && !tel && !cpf && !novoTelefone && !openRecovery && !sessionCookie) return Astro.redirect("/", 302);
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Verificação de Segurança — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex items-center justify-center p-4">${renderComponent($$result, "OtpVerification", OtpVerification, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/OtpVerification.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/autenticacao/otp.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/autenticacao/otp.astro";
var $$url = "/autenticacao/otp";
//#endregion
//#region \0virtual:astro:page:src/pages/autenticacao/otp@_@astro
var page = () => otp_exports;
//#endregion
export { page };
