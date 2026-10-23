globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_BZofGHHY.mjs";
//#region src/pages/hub/review/promoters.astro
var promoters_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Promoters,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Promoters = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Homologação de Promotores — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-4xl mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-28 space-y-6"><div class="border-b border-white/10 pb-4"><span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Secretaria Regional</span><h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">Homologação de Novos Promotores</h1></div><div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4"><div class="flex items-center justify-between border-b border-white/10 pb-3"><div><h3 class="text-base font-bold text-white">Fila de Novos Candidatos Credenciados</h3><p class="text-xs text-white/60">Verifique a chave PIX, documentação pessoal e autorize o link de captação.</p></div><span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">Todos os Promotores Homologados</span></div><p class="text-xs text-white/70 leading-relaxed">Não há candidatos aguardando conferência no momento. Quando um novo consultor se cadastrar, a ficha cadastral aparecerá aqui para aprovação do coordenador.</p></div></div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/hub/review/promoters.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/hub/review/promoters.astro";
var $$url = "/hub/review/promoters";
//#endregion
//#region \0virtual:astro:page:src/pages/hub/review/promoters@_@astro
var page = () => promoters_exports;
//#endregion
export { page };
