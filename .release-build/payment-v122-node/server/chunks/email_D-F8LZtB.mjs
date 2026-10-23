import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { w as createAstro } from "./server_ZN1nPn8N.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
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
