globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CoEJrvu4.mjs";
import { t as StudentVeteranView } from "./StudentVeteranView_DC-zysOB.mjs";
//#region src/pages/student/veteran/dashboard.astro
var dashboard_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Dashboard,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Dashboard = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Conclusão do aluno — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentVeteranView", StudentVeteranView, {
		"client:load": true,
		"view": "dashboard",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentVeteranView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/veteran/dashboard.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/veteran/dashboard.astro";
var $$url = "/student/veteran/dashboard";
//#endregion
//#region \0virtual:astro:page:src/pages/student/veteran/dashboard@_@astro
var page = () => dashboard_exports;
//#endregion
export { page };
