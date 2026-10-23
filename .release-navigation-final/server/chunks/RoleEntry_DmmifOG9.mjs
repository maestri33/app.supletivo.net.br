globalThis.process ??= {};
globalThis.process.env ??= {};
import "./index-server_EAeTh76q.mjs";
import "./RootLayout_CoEJrvu4.mjs";
//#region src/components/interactive/RoleEntry.svelte
function RoleEntry($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { role } = $$props;
		$$renderer.push(`<div class="mx-auto max-w-lg p-6 text-center" aria-live="polite">`);
		$$renderer.push(`<!--[1--><p>Consultando sua conta...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { RoleEntry as t };
