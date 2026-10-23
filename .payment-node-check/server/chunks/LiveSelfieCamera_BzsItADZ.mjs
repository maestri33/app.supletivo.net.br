import { c as attr, u as escape_html } from "./index-server_DvB6aUE6.mjs";
//#region src/components/interactive/LiveSelfieCamera.svelte
function LiveSelfieCamera($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { disabled = false, onCapture } = $$props;
		let capturing = false;
		$$renderer.push(`<div class="live-selfie-camera svelte-4uag9c"${attr("aria-busy", capturing)}><p>Tire sua selfie agora, olhando de frente para a câmera e com boa iluminação.</p> `);
		$$renderer.push(`<!--[-1--><button type="button" class="btn svelte-4uag9c"${attr("disabled", disabled || capturing, true)}>${escape_html("Abrir câmera para selfie")}</button>`);
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { LiveSelfieCamera as t };
