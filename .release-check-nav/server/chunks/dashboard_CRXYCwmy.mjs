globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_C3LAw_3K.mjs";
import { t as StudentActiveView } from "./StudentActiveView_DbMH0jl1.mjs";
//#region src/pages/student/active/dashboard.astro
var dashboard_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Dashboard,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Dashboard = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Painel do Aluno — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentActiveView", StudentActiveView, {
		"client:load": true,
		"view": "dashboard",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentActiveView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/active/dashboard.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/active/dashboard.astro";
var $$url = "/student/active/dashboard";
//#endregion
//#region \0virtual:astro:page:src/pages/student/active/dashboard@_@astro
var page = () => dashboard_exports;
//#endregion
export { page };
