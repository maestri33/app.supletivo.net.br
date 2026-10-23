import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_as4U_EmP.mjs";
import { t as RoleEntry } from "./RoleEntry_CRapSml_.mjs";
//#region src/pages/hub/index.astro
var hub_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Index = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, {
		"title": "Secretaria de Polo — Supletivo Brasil",
		"showDock": false,
		"showFooter": false
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "RoleEntry", RoleEntry, {
		"role": "hub",
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleEntry.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/hub/index.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/hub/index.astro";
var $$url = "/hub";
//#endregion
//#region \0virtual:astro:page:src/pages/hub/index@_@astro
var page = () => hub_exports;
//#endregion
export { page };
