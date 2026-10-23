globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
//#region src/pages/promoter/training/locked.astro
var locked_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Locked,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Locked = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Painel Bloqueado — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-28 text-center space-y-4"><div class="size-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-3xl mx-auto text-rose-400">🔒</div><div class="space-y-1"><span class="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">Acesso Restrito</span><h1 class="text-2xl font-black text-white font-display pt-2">Painel de Vendas Bloqueado</h1><p class="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">Conforme a regulamentação educacional, antes de iniciar a captação de alunos e gerar links de indicação, você deve concluir todos os módulos de capacitação e conformidade ética.</p></div><div class="pt-2"><a href="/promoter/training/courses" class="btn px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Concluir Módulos Obrigatórios &rarr;</a></div></div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/training/locked.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/training/locked.astro";
var $$url = "/promoter/training/locked";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/training/locked@_@astro
var page = () => locked_exports;
//#endregion
export { page };
