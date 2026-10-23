globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { c as clsx, l as escape_html, r as derived, t as attr_class } from "./index-server_CnxoOwt9.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_DKEwq1JF.mjs";
import { t as BankTlsSeal } from "./BankTlsSeal_BlCpxmMi.mjs";
import { n as CameraIcon, t as UploadFileIcon } from "./UploadFileIcon_CxLD_fQ0.mjs";
import "./MecGuillocheSeal_CMVCWFEc.mjs";
//#region src/components/icons/IdCardIcon.svelte
function IdCardIcon($$renderer, $$props) {
	let { class: className = "size-6 text-white" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></rect><rect x="4.5" y="7" width="5.5" height="6.5" rx="1" stroke="currentColor" stroke-width="1.4" fill="rgba(255, 255, 255, 0.08)"></rect><circle cx="7.25" cy="9.25" r="1.25" fill="currentColor" opacity="0.8"></circle><path d="M5.5 13c0-1 .8-1.5 1.75-1.5s1.75.5 1.75 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path><path d="M12.5 8h6M12.5 11h6M12.5 14h4M5 16.5h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity="0.75"></path></svg>`);
}
//#endregion
//#region src/components/interactive/StudentRgEnrollmentView.svelte
function StudentRgEnrollmentView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		derived(() => "front");
		$$renderer.push(`<div class="w-full max-w-2xl mx-auto flex flex-col items-center gap-6"><div class="text-center space-y-2"><div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1"><span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>Documentação Obrigatória · Etapa 1 de 4</span></div> <h1 class="text-2xl sm:text-4xl font-display tracking-tight text-white">Documento de Identidade</h1> <p class="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">Envie seu RG ou CNH para homologação da sua matrícula oficial com conferência automatizada.</p></div> <div class="payment-card-zero-g w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">`);
		$$renderer.push(`<!--[0--><div class="flex rounded-2xl bg-black/40 p-1.5 border border-white/10" role="tablist"><button type="button"${attr_class(`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 bg-[var(--yellow)] text-[var(--ink)] shadow-lg`)}>`);
		IdCardIcon($$renderer, { class: `size-4 text-[var(--ink)]` });
		$$renderer.push(`<!----> <span>RG (Físico)</span></button> <button type="button"${attr_class(`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-white/70 hover:text-white`)}><svg${attr_class(`size-4 text-white/70`)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10M7 12h10M7 16h6"></path></svg> <span>CNH (Digital ou Física)</span></button></div>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div${attr_class(`grid grid-cols-1 sm:grid-cols-2 gap-4`)}><div${attr_class(`p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden`)}><div><div class="flex items-center justify-between pb-3 border-b border-white/10"><span class="text-xs font-bold text-white flex items-center gap-2">`);
		IdCardIcon($$renderer, { class: "size-4 text-emerald-400" });
		$$renderer.push(`<!----> <span>${escape_html("1. Frente do RG")}</span></span> <span${attr_class(`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/60`)}>${escape_html("Pendente")}</span></div> `);
		$$renderer.push(`<!--[-1--><div class="mt-4 flex flex-col items-center justify-center text-center py-4 text-white/50 space-y-1">`);
		IdCardIcon($$renderer, { class: "size-10 text-white/20" });
		$$renderer.push(`<!----> <span class="text-xs font-medium">Lado da foto do documento</span></div>`);
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push(`<!--[0--><div${attr_class(`p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden`)}><div><div class="flex items-center justify-between pb-3 border-b border-white/10"><span class="text-xs font-bold text-white flex items-center gap-2">`);
		IdCardIcon($$renderer, { class: "size-4 text-emerald-400" });
		$$renderer.push(`<!----> <span>2. Verso do RG</span></span> <span${attr_class(`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/60`)}>${escape_html("Pendente")}</span></div> `);
		$$renderer.push(`<!--[-1--><div class="mt-4 flex flex-col items-center justify-center text-center py-4 text-white/50 space-y-1">`);
		IdCardIcon($$renderer, { class: "size-10 text-white/20" });
		$$renderer.push(`<!----> <span class="text-xs font-medium">Lado com números e filiação</span></div>`);
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		$$renderer.push(`<!--]--></div> `);
		$$renderer.push(`<!--[1--><div class="flex flex-col sm:flex-row gap-3 pt-2"><label class="btn flex-1 min-h-[48px] py-3.5 px-6 rounded-full bg-[var(--yellow)] text-[var(--ink)] font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.985]">`);
		CameraIcon($$renderer, { class: "size-4 text-[var(--ink)]" });
		$$renderer.push(`<!----> <span>Tirar Foto Agora</span> <input type="file" accept="image/*" capture="environment" class="hidden"/></label> <label class="flex-1 min-h-[48px] py-3.5 px-6 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.985]">`);
		UploadFileIcon($$renderer, { class: "size-4 text-white" });
		$$renderer.push(`<!----> <span>Escolher da Galeria / PDF</span> <input type="file" accept="image/*,application/pdf" class="hidden"/></label></div>`);
		$$renderer.push(`<!--]--> <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-left"><div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5"><span class="text-sm">☀️</span> <div class="text-[11px] text-white/70 leading-tight"><strong class="text-white block font-semibold">Boa Iluminação</strong> Evite sombras cobrindo seus dados ou foto.</div></div> <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5"><span class="text-sm">🚫</span> <div class="text-[11px] text-white/70 leading-tight"><strong class="text-white block font-semibold">Sem Reflexo</strong> Retire o RG do plástico de proteção antes da foto.</div></div> <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5"><span class="text-sm">📐</span> <div class="text-[11px] text-white/70 leading-tight"><strong class="text-white block font-semibold">Enquadramento</strong> Mantenha as 4 pontas do documento na foto.</div></div></div> <div class="flex items-center justify-center gap-2 text-[11px] text-[var(--muted-on-dark)] pt-2 border-t border-white/10">`);
		BankTlsSeal($$renderer, { class: "size-4 text-emerald-400" });
		$$renderer.push(`<!----> <span>Dados Criptografados e Protegidos conforme a Lei Geral de Proteção de Dados (LGPD)</span></div></div> <div class="text-center"><a href="https://wa.me/5543996648750?text=Ol%C3%A1%2C%20estou%20na%20etapa%20de%20envio%20do%20RG%20do%20Supletivo%20e%20preciso%20de%20ajuda." target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-white/70 text-xs hover:text-white transition-all cursor-pointer"><svg class="size-3.5 fill-emerald-400" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"></path></svg> <span>Dúvidas ao fotografar seu documento? Fale no WhatsApp</span></a></div></div>`);
	});
}
//#endregion
//#region src/pages/student/enrollment/rg.astro
var rg_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Rg,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Rg = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Identidade (RG / CNH) — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-28">${renderComponent($$result, "StudentRgEnrollmentView", StudentRgEnrollmentView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/StudentRgEnrollmentView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/rg.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/rg.astro";
var $$url = "/student/enrollment/rg";
//#endregion
//#region \0virtual:astro:page:src/pages/student/enrollment/rg@_@astro
var page = () => rg_exports;
//#endregion
export { page };
