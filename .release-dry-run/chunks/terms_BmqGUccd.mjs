globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_DKEwq1JF.mjs";
//#region src/pages/promoter/candidate/terms.astro
var terms_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Terms,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Terms = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Termos de Parceria & Divulgação — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-2xl mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-28 space-y-6"><div class="border-b border-white/10 pb-4"><span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Credenciamento de Consultor</span><h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">Termo de Adesão & Ética</h1></div><div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 text-xs text-white/80 leading-relaxed max-h-96 overflow-y-auto"><h3 class="text-sm font-bold text-white">1. Objeto da Parceria</h3><p>O presente termo estabelece as diretrizes de cooperação e divulgação dos programas de conclusão da Educação Básica promovidos pelo Supletivo Brasil.</p><h3 class="text-sm font-bold text-white">2. Práticas Autorizadas e Proibidas</h3><p>O consultor parceiro compromete-se a utilizar estritamente o material promocional oficial e nunca garantir notas ou dispensas sem o devido cumprimento das exigências do MEC.</p><h3 class="text-sm font-bold text-white">3. Remuneração e Repasse via PIX</h3><p>As bonificações por matrícula confirmada são repassadas diretamente na chave PIX cadastrada após a liquidação bancária do aluno indicado.</p></div><div class="flex items-center gap-3"><button type="button" class="btn px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Concordar & Assinar Digitalmente</button></div></div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate/terms.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/candidate/terms.astro";
var $$url = "/promoter/candidate/terms";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/candidate/terms@_@astro
var page = () => terms_exports;
//#endregion
export { page };
