import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import { t as StudentLockedPaywall } from "./StudentLockedPaywall_s0DaLvaM.mjs";
//#region src/pages/student/lead/payment.astro
var payment_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Payment,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Payment = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Forma de Pagamento — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full flex-1 flex flex-col p-4 sm:p-6 pb-28">${renderComponent($$result, "StudentLockedPaywall", StudentLockedPaywall, {
		"client:load": true,
		"initialPhase": "selection",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/StudentLockedPaywall.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/lead/payment.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/lead/payment.astro";
var $$url = "/student/lead/payment";
//#endregion
//#region \0virtual:astro:page:src/pages/student/lead/payment@_@astro
var page = () => payment_exports;
//#endregion
export { page };
