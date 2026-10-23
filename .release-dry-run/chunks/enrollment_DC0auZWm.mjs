globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { h as maybeRenderHead, m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { s as attr } from "./index-server_CnxoOwt9.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_DKEwq1JF.mjs";
import "./workflow_Dqy37My9.mjs";
//#region src/components/interactive/DocumentVerificationCenter.svelte
function DocumentVerificationCenter($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", true)}>`);
		$$renderer.push(`<!--[0--><h1>Consultando sua matrícula</h1> <p class="muted" role="status">Buscando a etapa atual no polo…</p>`);
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
