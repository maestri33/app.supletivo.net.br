globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { m as renderTemplate, s as renderComponent } from "./console_CytTTjjb.mjs";
import { c as attr, i as derived, u as escape_html } from "./index-server_EAeTh76q.mjs";
import { t as createComponent } from "./compiler_CbNI0N93.mjs";
import { g as postEnrollmentEducation, l as getErrorMessage, t as $$RootLayout } from "./RootLayout_C3LAw_3K.mjs";
import { a as followEnrollmentStatus, i as expectedStatus } from "./workflow_ZE_Fb8ln.mjs";
/* empty css                   */
import { t as EducationDeclarationModal } from "./EducationDeclarationModal_DPx1wGaB.mjs";
//#region src/components/interactive/student/StudentEducationView.svelte
function StudentEducationView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let loading = true;
		let busy = false;
		let error = "";
		let level = null;
		let grade = null;
		let completed = null;
		let state = "";
		let city = "";
		let lastSchool = "";
		let cities = [];
		let showDeclaration = false;
		derived(() => false);
		derived(() => cities.includes(city.trim()));
		async function confirmDeclaration() {
			busy = true;
			error = "";
			showDeclaration = false;
			try {
				const me = await postEnrollmentEducation({
					level,
					grade,
					completed,
					state,
					city: city.trim(),
					last_school: lastSchool.trim(),
					declaration_accepted: true
				});
				followEnrollmentStatus(me.status);
			} catch (cause) {
				error = getErrorMessage(cause);
				const status = expectedStatus(cause);
				if (status) followEnrollmentStatus(status);
			} finally {
				busy = false;
			}
		}
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", loading)}><h1>Onde você parou de estudar?</h1> <p class="muted">Escolha o último ano que frequentou. O polo usará essa informação na matrícula.</p> `);
		$$renderer.push(`<!--[0--><p role="status">Consultando escolaridade…</p>`);
		$$renderer.push(`<!--]--> `);
		if (error) $$renderer.push(`<!--[0--><p class="error" role="alert">${escape_html(error)}</p><button type="button" class="secondary"${attr("disabled", busy, true)}>Consultar etapa novamente</button>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></section> `);
		EducationDeclarationModal($$renderer, {
			role: "student",
			open: showDeclaration,
			onConfirm: confirmDeclaration
		});
		$$renderer.push(`<!---->`);
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
