import { c as attr, i as derived } from "./index-server_DvB6aUE6.mjs";
import "./RootLayout_Ccnumr8N.mjs";
import { s as safePartnerUrl } from "./workflow_CU6aQMsS.mjs";
/* empty css                   */
//#region src/components/interactive/student/StudentFinanceView.svelte
function StudentFinanceView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let loading = true;
		derived(() => safePartnerUrl(void 0));
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", loading)}><h1>Financeiro</h1> `);
		$$renderer.push(`<!--[0--><p role="status">Consultando seu pagamento...</p>`);
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
export { StudentFinanceView as t };
