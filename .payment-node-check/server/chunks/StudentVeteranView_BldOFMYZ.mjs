import { c as attr, i as derived } from "./index-server_DvB6aUE6.mjs";
import "./RootLayout_as4U_EmP.mjs";
import "./private-media_mIOO3KxE.mjs";
import { o as safeMediaUrl, s as safePartnerUrl } from "./workflow_Br-wKspG.mjs";
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
