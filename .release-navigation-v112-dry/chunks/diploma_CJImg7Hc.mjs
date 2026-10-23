globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_CQOsmgn0.mjs";
import { t as StudentVeteranView } from "./StudentVeteranView_O5HypAUs.mjs";
//#region src/pages/student/veteran/diploma.astro
var diploma_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Diploma,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Diploma = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Diploma — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentVeteranView", StudentVeteranView, {
		"client:load": true,
		"view": "diploma",
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentVeteranView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/veteran/diploma.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/veteran/diploma.astro";
var $$url = "/student/veteran/diploma";
//#endregion
//#region \0virtual:astro:page:src/pages/student/veteran/diploma@_@astro
var page = () => diploma_exports;
//#endregion
export { page };
