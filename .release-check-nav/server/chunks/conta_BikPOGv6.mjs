globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_C3LAw_3K.mjs";
import { t as RoleEntry } from "./RoleEntry_BuQETMj9.mjs";
//#region src/pages/autenticacao/conta.astro
var conta_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Conta,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Conta = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, {
		"title": "Sua conta — Supletivo Brasil",
		"showDock": false,
		"showFooter": false
	}, { "default": ($$result) => renderTemplate`${renderComponent($$result, "RoleEntry", RoleEntry, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/RoleEntry.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/autenticacao/conta.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/autenticacao/conta.astro";
var $$url = "/autenticacao/conta";
//#endregion
//#region \0virtual:astro:page:src/pages/autenticacao/conta@_@astro
var page = () => conta_exports;
//#endregion
export { page };
