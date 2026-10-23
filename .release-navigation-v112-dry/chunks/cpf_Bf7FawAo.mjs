globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { O as createAstro } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
//#region src/pages/cpf.astro
var cpf_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Cpf,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Cpf = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Cpf;
	return Astro.redirect(`https://supletivo.net.br${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/cpf.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/cpf.astro";
var $$url = "/cpf";
//#endregion
//#region \0virtual:astro:page:src/pages/cpf@_@astro
var page = () => cpf_exports;
//#endregion
export { page };
