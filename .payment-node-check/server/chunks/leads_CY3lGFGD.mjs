import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import { t as PromoterLeadsView } from "./PromoterLeadsView_HNC-DCT_.mjs";
//#region src/pages/promoter/active/leads.astro
var leads_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Leads,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Leads = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Meus Indicados — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "PromoterLeadsView", PromoterLeadsView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/PromoterLeadsView.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/active/leads.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/active/leads.astro";
var $$url = "/promoter/active/leads";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/active/leads@_@astro
var page = () => leads_exports;
//#endregion
export { page };
