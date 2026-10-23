globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { O as createAstro } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
//#region src/pages/promoter/suspended.astro
var suspended_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Suspended,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Suspended = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Suspended;
	return Astro.redirect("/promoter/suspended/notice", 308);
}, "C:/rep/app.supletivo.net.br/src/pages/promoter/suspended.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/promoter/suspended.astro";
var $$url = "/promoter/suspended";
//#endregion
//#region \0virtual:astro:page:src/pages/promoter/suspended@_@astro
var page = () => suspended_exports;
//#endregion
export { page };
