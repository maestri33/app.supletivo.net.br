import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_ZN1nPn8N.mjs";
import { c as attr, i as derived } from "./index-server_DvB6aUE6.mjs";
import { t as createComponent } from "./compiler_DJgU_Xlh.mjs";
import { t as $$RootLayout } from "./RootLayout_Ccnumr8N.mjs";
import "./private-media_Bqo_yQ2a.mjs";
import "./workflow_CU6aQMsS.mjs";
/* empty css                   */
//#region src/components/interactive/DocumentVerificationCenter.svelte
function DocumentVerificationCenter($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let loading = true;
		derived(() => void 0);
		derived(() => []);
		$$renderer.push(`<section class="student-workflow release-view svelte-av4ud6"${attr("aria-busy", loading)}>`);
		$$renderer.push(`<!--[0--><h1 class="svelte-av4ud6">Consultando sua matrícula</h1> <p class="muted svelte-av4ud6" role="status">Buscando a etapa atual no polo…</p>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
//#region src/pages/student/enrollment.astro
var enrollment_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Enrollment,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Enrollment = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Fase de Matrícula — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-lg mx-auto flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-28">${renderComponent($$result, "DocumentVerificationCenter", DocumentVerificationCenter, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/DocumentVerificationCenter.svelte",
		"client:component-export": "default"
	})}</div>` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/enrollment.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/enrollment.astro";
var $$url = "/student/enrollment";
//#endregion
//#region \0virtual:astro:page:src/pages/student/enrollment@_@astro
var page = () => enrollment_exports;
//#endregion
export { page };
