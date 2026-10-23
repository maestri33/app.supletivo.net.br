globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
import { t as StudentLockedPaywall } from "./StudentLockedPaywall_T3bPo_1e.mjs";
//#region src/pages/student/lead/checkout.astro
var checkout_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Checkout,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Checkout = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Checkout de Matrícula — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "StudentLockedPaywall", StudentLockedPaywall, {
		"client:load": true,
		"initialPhase": "checkout",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/StudentLockedPaywall.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/lead/checkout.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/lead/checkout.astro";
var $$url = "/student/lead/checkout";
//#endregion
//#region \0virtual:astro:page:src/pages/student/lead/checkout@_@astro
var page = () => checkout_exports;
//#endregion
export { page };
