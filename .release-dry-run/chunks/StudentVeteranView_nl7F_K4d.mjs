globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as derived, s as attr } from "./index-server_CnxoOwt9.mjs";
import "./RootLayout_DKEwq1JF.mjs";
import { a as safeMediaUrl, o as safePartnerUrl } from "./workflow_Dqy37My9.mjs";
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
