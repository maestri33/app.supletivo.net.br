globalThis.process ??= {};
globalThis.process.env ??= {};
import { r as derived, s as attr } from "./index-server_CnxoOwt9.mjs";
import "./RootLayout_DKEwq1JF.mjs";
import { o as safePartnerUrl, t as STUDENT_STATUS_LABELS } from "./workflow_Dqy37My9.mjs";
//#region src/components/interactive/student/StudentActiveView.svelte
function StudentActiveView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { view = "dashboard" } = $$props;
		let loading = true;
		derived(() => STUDENT_STATUS_LABELS[""] ?? "Status não informado");
		derived(() => safePartnerUrl(void 0));
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", loading)}>`);
		$$renderer.push(`<!--[0--><h1>Consultando seu ambiente</h1><p role="status">Buscando os dados do servidor…</p>`);
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
export { StudentActiveView as t };
