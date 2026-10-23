globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
import { t as PromoterTrainingView } from "./PromoterTrainingView_xTDBWZlj.mjs";
//#region src/pages/promoter/training.astro
var training_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Training,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Training = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Treinamento Obrigatório — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterTrainingView", PromoterTrainingView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterTrainingView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/training.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/training.astro";
var $$url = "/promoter/training";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/training@_@astro
var page = () => training_exports;
//#endregion
export { page };
