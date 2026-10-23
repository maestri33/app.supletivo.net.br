import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent, w as createAstro } from "./server_ZN1nPn8N.mjs";
import { c as attr, i as derived, u as escape_html } from "./index-server_DvB6aUE6.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { k as saveSession, t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as Modal } from "./Modal_CH2Qs_1k.mjs";
//#region src/lib/phone.ts
/**
* Brazilian phone helpers. App is BR-only — no country code (+55) anywhere.
* Backend requires DDD + number: 10 digits (landline) or 11 digits (mobile).
*/
/** Strip everything but digits. */
function onlyDigits(value) {
	return value.replace(/\D+/g, "");
}
/** Strict Brazilian mobile validation for WhatsApp (11 digits: valid DDD + 9). */
function isValidBrMobile(value) {
	const d = onlyDigits(value);
	if (d.length !== 11) return false;
	const ddd = parseInt(d.slice(0, 2), 10);
	if (ddd < 11 || ddd > 99 || ddd % 10 === 0) return false;
	return d.charAt(2) === "9";
}
//#endregion
//#region src/components/interactive/UnregisteredRoleModal.svelte
function UnregisteredRoleModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { isOpen = false, phone = "", isSubmitting = false, onClose, onSelectRole } = $$props;
		let phoneDigits = derived(() => phone.replace(/\D/g, ""));
		let alunoUrl = derived(() => phoneDigits() ? `https://supletivo.net.br?tel=${encodeURIComponent(phoneDigits())}&modal=cadastro` : "https://supletivo.net.br");
		let promotorUrl = derived(() => phoneDigits() ? `https://promotor.supletivo.net.br?tel=${encodeURIComponent(phoneDigits())}&modal=cadastro` : "https://promotor.supletivo.net.br");
		function formatDisplayPhone(val) {
			const d = val.replace(/\D/g, "");
			if (d.length <= 2) return d;
			if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
			return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
		}
		Modal($$renderer, {
			isOpen,
			onClose,
			eyebrow: "Primeiro Acesso",
			eyebrowVariant: "yellow",
			title: "Como deseja continuar?",
			description: "Identificamos que seu WhatsApp ainda não possui matrícula ou credenciamento ativo. Escolha seu objetivo para acessar a página correspondente:",
			testId: "unregistered-role-modal",
			size: "lg",
			children: ($$renderer) => {
				$$renderer.push(`<div class="flex flex-col gap-5 svelte-1odlnj7">`);
				if (phone) $$renderer.push(`<!--[0--><div class="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs svelte-1odlnj7"><span class="text-white/60 svelte-1odlnj7">WhatsApp verificado:</span> <span class="font-mono font-bold text-emerald-300 svelte-1odlnj7">${escape_html(formatDisplayPhone(phone))}</span></div>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 svelte-1odlnj7" data-testid="role-cards-container"><a${attr("href", alunoUrl())} data-testid="card-role-aluno" class="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-emerald-950/40 hover:border-emerald-400/90 transition-all duration-300 text-left active:scale-[0.99] cursor-pointer shadow-lg overflow-hidden no-underline svelte-1odlnj7"><div class="absolute -right-8 -top-8 size-28 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/25 transition-all duration-300 pointer-events-none svelte-1odlnj7"></div> <div class="flex flex-col gap-4 relative z-10 svelte-1odlnj7"><div class="flex items-start justify-between svelte-1odlnj7"><div class="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center p-2 text-emerald-300 group-hover:border-emerald-400/60 transition-colors shadow-inner svelte-1odlnj7"><svg class="size-10 text-emerald-400 group-hover:scale-105 transition-transform duration-300 svelte-1odlnj7" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="26" class="fill-emerald-500/10 animate-pulse svelte-1odlnj7"></circle><path d="M32 14L10 24L32 34L54 24L32 14Z" class="fill-emerald-950 stroke-emerald-400 svelte-1odlnj7" stroke-width="2.5" stroke-linejoin="round"></path><path d="M32 16.5L14 24L32 31.5L50 24L32 16.5Z" class="fill-emerald-400/20 svelte-1odlnj7"></path><path d="M20 29.5V38.5C20 43.5 25.4 46.5 32 46.5C38.6 46.5 44 43.5 44 38.5V29.5" class="stroke-emerald-400 fill-emerald-950/60 svelte-1odlnj7" stroke-width="2.5" stroke-linecap="round"></path><g class="aluno-tassel-pendulum svelte-1odlnj7"><path d="M32 24L48 29.5V42" class="stroke-amber-300 svelte-1odlnj7" stroke-width="2" stroke-linecap="round"></path><circle cx="48" cy="43.5" r="2.5" class="fill-amber-400 svelte-1odlnj7"></circle><path d="M48 46V51" class="stroke-amber-300 svelte-1odlnj7" stroke-width="2.5" stroke-linecap="round"></path></g><circle cx="32" cy="24" r="2.2" class="fill-amber-400 svelte-1odlnj7"></circle><g class="aluno-sparkle-1 svelte-1odlnj7"><path d="M49 11L50.5 14L53.5 15.5L50.5 17L49 20L47.5 17L44.5 15.5L47.5 14L49 11Z" class="fill-amber-400 svelte-1odlnj7"></path></g><g class="aluno-sparkle-2 svelte-1odlnj7"><path d="M12 36L13 38.5L15.5 39.5L13 40.5L12 43L11 40.5L8.5 39.5L11 38.5L12 36Z" class="fill-emerald-300 svelte-1odlnj7"></path></g></svg></div> <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wide text-emerald-300 svelte-1odlnj7">Ensino Médio</span></div> <div class="svelte-1odlnj7"><h4 class="text-base font-black text-white font-display tracking-tight group-hover:text-emerald-300 transition svelte-1odlnj7">Quero ser Aluno</h4> <p class="text-xs text-white/70 leading-relaxed mt-1 svelte-1odlnj7">Conclua sua matrícula e siga as aulas e avaliações no ambiente da instituição parceira, conforme as regras aplicáveis.</p></div></div> <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:translate-x-1 transition-transform relative z-10 svelte-1odlnj7"><span class="svelte-1odlnj7">${escape_html("Ir para Landing Page de Aluno")}</span> <span class="svelte-1odlnj7">→</span></div></a> <a${attr("href", promotorUrl())} data-testid="card-role-promotor" class="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-amber-950/35 hover:border-[var(--yellow)]/90 transition-all duration-300 text-left active:scale-[0.99] cursor-pointer shadow-lg overflow-hidden no-underline svelte-1odlnj7"><div class="absolute -right-8 -top-8 size-28 rounded-full bg-[var(--yellow)]/10 blur-2xl group-hover:bg-[var(--yellow)]/25 transition-all duration-300 pointer-events-none svelte-1odlnj7"></div> <div class="flex flex-col gap-4 relative z-10 svelte-1odlnj7"><div class="flex items-start justify-between svelte-1odlnj7"><div class="size-14 rounded-2xl bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 flex items-center justify-center p-2 text-[var(--yellow)] group-hover:border-[var(--yellow)]/60 transition-colors shadow-inner svelte-1odlnj7"><svg class="size-10 text-[var(--yellow)] group-hover:scale-105 transition-transform duration-300 svelte-1odlnj7" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="26" class="fill-amber-500/10 animate-pulse svelte-1odlnj7"></circle><g class="promotor-rocket-hover svelte-1odlnj7"><path d="M22 43C19 47 20 52 23 55C24.2 49.5 26.5 47 28.5 46" class="promotor-flame-primary fill-amber-500 stroke-amber-400 svelte-1odlnj7" stroke-width="1.5"></path><path d="M19 45C16.5 48.5 17 54 21 57.5C21.8 52 23.5 49 25 48" class="promotor-flame-secondary fill-[var(--yellow)] stroke-[var(--yellow)] svelte-1odlnj7" stroke-width="1.5"></path><path d="M23 35L15 41C14 45 16 50 19 50L26 44" class="fill-amber-950 stroke-amber-400 svelte-1odlnj7" stroke-width="2" stroke-linejoin="round"></path><path d="M34 24L40 16C44 15 49 17 49 20L43 27" class="fill-amber-950 stroke-amber-400 svelte-1odlnj7" stroke-width="2" stroke-linejoin="round"></path><path d="M48 16C37 18 27 28 24 38L33 47C43 44 53 34 55 23C55 19 52 16 48 16Z" class="fill-amber-950 stroke-[var(--yellow)] svelte-1odlnj7" stroke-width="2.5" stroke-linejoin="round"></path><circle cx="37" cy="30" r="5.5" class="fill-amber-500/20 stroke-amber-300 svelte-1odlnj7" stroke-width="2"></circle><circle cx="37" cy="30" r="2.2" class="fill-[var(--yellow)] animate-ping svelte-1odlnj7"></circle></g><g class="promotor-sparkle-1 svelte-1odlnj7"><path d="M14 18L15 20.5L17.5 21.5L15 22.5L14 25L13 22.5L10.5 21.5L13 20.5L14 18Z" class="fill-amber-300 svelte-1odlnj7"></path></g><g class="promotor-sparkle-2 svelte-1odlnj7"><path d="M48 48L49 50L51 51L49 52L48 54L47 52L45 51L47 50L48 48Z" class="fill-[var(--yellow)] svelte-1odlnj7"></path></g></svg></div> <span class="px-2.5 py-0.5 rounded-full bg-[var(--yellow)]/15 border border-[var(--yellow)]/30 text-[10px] font-extrabold uppercase tracking-wide text-[var(--yellow)] svelte-1odlnj7">Renda Extra</span></div> <div class="svelte-1odlnj7"><h4 class="text-base font-black text-white font-display tracking-tight group-hover:text-[var(--yellow)] transition svelte-1odlnj7">Quero ser Promotor</h4> <p class="text-xs text-white/70 leading-relaxed mt-1 svelte-1odlnj7">Indique pessoas que precisam do diploma, ganhe comissões automáticas no PIX e tenha seu próprio painel.</p></div></div> <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[var(--yellow)] group-hover:translate-x-1 transition-transform relative z-10 svelte-1odlnj7"><span class="svelte-1odlnj7">${escape_html("Ir para Landing Page de Promotor")}</span> <span class="svelte-1odlnj7">→</span></div></a></div> <p class="text-[11px] text-white/50 text-center leading-relaxed svelte-1odlnj7">Acesso seguro e criptografado · Sistema integrado à legislação educacional (LDB nº 9.394/96).</p></div>`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region src/components/interactive/UniversalLogin.svelte
function UniversalLogin($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let phone = "";
		let busy = false;
		let isRoleModalOpen = false;
		let isRoleSubmitting = false;
		let phoneDigits = derived(() => phone.replace(/\D/g, ""));
		let isPhoneComplete = derived(() => isValidBrMobile(phoneDigits()));
		let mounted = false;
		function onRoleSelect(role) {
			isRoleSubmitting = true;
			const digits = phone.replace(/\D/g, "");
			if (role === "promotor") {
				saveSession({
					phone: digits,
					role: "promotor"
				});
				const target = digits ? `https://promotor.supletivo.net.br?tel=${encodeURIComponent(digits)}&modal=cadastro` : "https://promotor.supletivo.net.br";
				window.location.href = target;
			} else {
				saveSession({
					phone: digits,
					role: "aluno"
				});
				const target = digits ? `https://supletivo.net.br?tel=${encodeURIComponent(digits)}&modal=cadastro` : "https://supletivo.net.br";
				window.location.href = target;
			}
		}
		$$renderer.push(`<div class="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl glass-panel border border-white/15 text-white shadow-2xl relative overflow-hidden backdrop-blur-2xl"><div class="flex justify-center mb-6"><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs font-semibold text-emerald-300"><span class="size-2 rounded-full bg-[var(--green)] animate-pulse"></span> Acesso Universal à Plataforma</div></div> <div class="text-center mb-6"><h1 class="text-2xl sm:text-3xl font-display tracking-tight text-white">Acesse sua conta</h1> <p class="text-xs sm:text-sm text-white/70 font-sans mt-2">Digite seu WhatsApp. O sistema valida e avança automaticamente.</p></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="space-y-4"><div><label for="phone" class="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">Seu WhatsApp:</label> <div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-70 pointer-events-none">💬</span> <input id="phone"${attr("data-hydrated", mounted)} type="tel" inputmode="numeric" autocomplete="tel" placeholder="(11) 90000-0000"${attr("value", phone)}${attr("disabled", busy, true)} class="w-full h-12 pl-12 pr-12 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 text-base font-medium focus:outline-none focus:border-[var(--yellow)] focus:ring-1 focus:ring-[var(--yellow)] transition-all disabled:opacity-50"/> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div> <div class="pt-2 text-center">`);
		if (isPhoneComplete()) $$renderer.push(`<!--[1--><div class="inline-flex items-center gap-2 text-xs text-emerald-400 font-medium">Número completo</div>`);
		else $$renderer.push(`<!--[-1--><div class="text-[11px] text-white/50">Avanço automático ao completar 11 dígitos</div>`);
		$$renderer.push(`<!--]--></div></div> <div class="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/60">Ainda não possui cadastro? Basta digitar seu WhatsApp acima para conhecer as opções de acesso.</div></div> `);
		UnregisteredRoleModal($$renderer, {
			isOpen: isRoleModalOpen,
			phone,
			isSubmitting: isRoleSubmitting,
			onClose: () => {
				isRoleModalOpen = false;
			},
			onSelectRole: onRoleSelect
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => ""
});
createAstro("https://astro.build");
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const searchParams = Astro.url.searchParams;
	const roleVal = (searchParams.get("role") ?? "").toLowerCase();
	if (!(["promotor", "promoter"].includes(roleVal) || searchParams.has("promotor") || searchParams.has("promoter")) && (searchParams.has("ref") || Array.from(searchParams.keys()).some((k) => k.startsWith("utm_") || k.endsWith("clid")))) return Astro.redirect(`https://supletivo.net.br${Astro.url.search}`, 308);
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, {
		"title": "Entrar — Supletivo Brasil",
		"showDock": false
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col items-center justify-start my-auto p-4 sm:p-6">${renderComponent($$result, "UniversalLogin", UniversalLogin, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/UniversalLogin.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/index.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
