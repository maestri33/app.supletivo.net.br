globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_C3LAw_3K.mjs";
//#region src/pages/promoter/suspended/support.astro
var support_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Support,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Support = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Suporte da Coordenação — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-28 text-center space-y-4"><div class="size-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto text-amber-400">🎧</div><div class="space-y-1"><span class="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">Canal de Suporte</span><h1 class="text-2xl font-black text-white font-display pt-2">Coordenação Regional</h1><p class="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">Clique abaixo para iniciar atendimento via WhatsApp oficial com o coordenador responsável pelo seu credenciamento.</p></div><div class="pt-2 w-full max-w-xs"><a href="https://wa.me/554284321915?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20sobre%20meu%20cadastro%20de%20promotor" target="_blank" rel="noopener noreferrer" class="btn w-full py-3 text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">Chamar no WhatsApp &rarr;</a></div></div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/suspended/support.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/suspended/support.astro";
var $$url = "/promoter/suspended/support";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/suspended/support@_@astro
var page = () => support_exports;
//#endregion
export { page };
