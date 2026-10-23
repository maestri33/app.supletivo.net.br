globalThis.process ??= {};
globalThis.process.env ??= {};
import { c as attr, i as derived } from "./index-server_EAeTh76q.mjs";
import "./RootLayout_CoEJrvu4.mjs";
import "./private-media_C7SKYpJ8.mjs";
import { o as safeMediaUrl, s as safePartnerUrl } from "./workflow_BFLixNjv.mjs";
/* empty css                   */
//#region src/components/interactive/student/StudentVeteranView.svelte
function StudentVeteranView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { view = "dashboard" } = $$props;
		let loading = true;
		derived(() => safeMediaUrl(void 0));
		derived(() => safeMediaUrl(void 0));
		derived(() => safePartnerUrl(void 0));
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", loading)}>`);
		$$renderer.push(`<!--[0--><h1>Consultando sua conclusão</h1><p role="status">Buscando os registros do servidor…</p>`);
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
export { StudentVeteranView as t };
