globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
import { t as PromoterCommissionsView } from "./PromoterCommissionsView_7iQiX0YD.mjs";
//#region src/pages/promoter/active/commissions.astro
var commissions_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Commissions,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Commissions = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Comissões & Extrato PIX — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterCommissionsView", PromoterCommissionsView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterCommissionsView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/active/commissions.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/active/commissions.astro";
var $$url = "/promoter/active/commissions";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/active/commissions@_@astro
var page = () => commissions_exports;
//#endregion
export { page };
