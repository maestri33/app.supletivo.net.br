import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
//#region src/pages/planos.astro
var planos_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Planos,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Planos = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Planos;
	return Astro.redirect(`https://supletivo.net.br/#planos${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/planos.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/planos.astro";
var $$url = "/planos";
//#endregion
//#region \0virtual:astro:page:src/pages/planos@_@astro
var page = () => planos_exports;
//#endregion
export { page };
