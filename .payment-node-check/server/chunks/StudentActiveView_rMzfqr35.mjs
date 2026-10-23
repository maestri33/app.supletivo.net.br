import { c as attr, i as derived } from "./index-server_DvB6aUE6.mjs";
import "./RootLayout_as4U_EmP.mjs";
import "./private-media_mIOO3KxE.mjs";
import { s as safePartnerUrl, t as STUDENT_STATUS_LABELS } from "./workflow_Br-wKspG.mjs";
/* empty css                   */
//#region src/components/interactive/student/StudentActiveView.svelte
function StudentActiveView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { view = "dashboard" } = $$props;
		let loading = true;
		derived(() => STUDENT_STATUS_LABELS[""] ?? "Status não informado");
		derived(() => safePartnerUrl(void 0));
		derived(() => [
			{
				label: "RG — frente",
				path: void 0
			},
			{
				label: "RG — verso",
				path: void 0
			},
			{
				label: "RG — arquivo completo",
				path: void 0
			},
			{
				label: "Comprovante de endereço",
				path: void 0
			},
			{
				label: "Foto de assinatura",
				path: void 0
			}
		].filter((item) => item.path));
		$$renderer.push(`<section class="student-workflow"${attr("aria-busy", loading)}>`);
		$$renderer.push(`<!--[0--><h1>Consultando seu ambiente</h1><p role="status">Buscando os dados do servidor…</p>`);
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
export { StudentActiveView as t };
