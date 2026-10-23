globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { s as attr } from "./index-server_CnxoOwt9.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { t as $$RootLayout } from "./RootLayout_DKEwq1JF.mjs";
import "./workflow_Dqy37My9.mjs";
//#region src/components/interactive/student/StudentEducationView.svelte
function StudentEducationView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", true)}><h1>Onde você parou de estudar?</h1> <p class="muted">Escolha o último ano que frequentou. O polo usará essa informação na matrícula.</p> `);
		$$renderer.push(`<!--[0--><p role="status">Consultando escolaridade…</p>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
//#region src/pages/student/enrollment/education.astro
var education_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Education,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
var $$Education = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "RootLayout", $$RootLayout, { "title": "Escolaridade — Supletivo Brasil" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "StudentEducationView", StudentEducationView, {
		"client:load": true,
		"client:component-hydration": "load",
		"client:component-path": "C:/rep/app.supletivo.net.br/src/components/interactive/student/StudentEducationView.svelte",
		"client:component-export": "default"
	})}` })}`;
}, "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/education.astro", void 0);
var $$file = "C:/rep/app.supletivo.net.br/src/pages/student/enrollment/education.astro";
var $$url = "/student/enrollment/education";
//#endregion
//#region \0virtual:astro:page:src/pages/student/enrollment/education@_@astro
var page = () => education_exports;
//#endregion
export { page };
