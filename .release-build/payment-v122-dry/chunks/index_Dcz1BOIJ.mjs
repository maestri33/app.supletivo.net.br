globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_C0gAutpq.mjs";
import { t as RoleEntry } from "./RoleEntry_CVAdVpbE.mjs";
//#region src/pages/student/index.astro
var student_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, {
		"title": "Portal do Aluno — Supletivo Brasil",
		"showDock": false,
		"showFooter": false
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "RoleEntry", RoleEntry, {
		"role": "student",
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleEntry.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/index.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/index.astro";
var $$url = "/student";
//#endregion
//#region \0virtual:astro:page:src/pages/student/index@_@astro
var page = () => student_exports;
//#endregion
export { page };
