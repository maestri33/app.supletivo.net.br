globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { O as createAstro } from "./console_CytTTjjb.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
//#region src/pages/email.astro
var email_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Email,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Email = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Email;
	return Astro.redirect(`https://supletivo.net.br${Astro.url.search}`, 308);
}, "C:/rep/app.supletivo.net.br/src/pages/email.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/email.astro";
var $$url = "/email";
//#endregion
//#region \0virtual:astro:page:src/pages/email@_@astro
var page = () => email_exports;
//#endregion
export { page };
