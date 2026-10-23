globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { O as createAstro } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
//#region src/pages/autenticacao/recuperar-numero.astro
var recuperar_numero_exports = /* @__PURE__ */ __exportAll({
	default: () => $$RecuperarNumero,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$RecuperarNumero = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$RecuperarNumero;
	const params = new URLSearchParams(Astro.url.search);
	params.set("open_recovery", "true");
	return Astro.redirect(`/autenticacao/otp?${params.toString()}`, 302);
}, "C:/rep/app.supletivo.net.br/src/pages/autenticacao/recuperar-numero.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/autenticacao/recuperar-numero.astro";
var $$url = "/autenticacao/recuperar-numero";
//#endregion
//#region \0virtual:astro:page:src/pages/autenticacao/recuperar-numero@_@astro
var page = () => recuperar_numero_exports;
//#endregion
export { page };
