import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import { t as StudentFinanceView } from "./StudentFinanceView_a0ZJk8xX.mjs";
//#region src/pages/student/veteran/finance.astro
var finance_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Finance,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Finance = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Financeiro — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentFinanceView", StudentFinanceView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentFinanceView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/veteran/finance.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/veteran/finance.astro";
var $$url = "/student/veteran/finance";
//#endregion
//#region \0virtual:astro:page:src/pages/student/veteran/finance@_@astro
var page = () => finance_exports;
//#endregion
export { page };
