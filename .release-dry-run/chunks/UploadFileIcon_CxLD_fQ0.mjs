globalThis.process ??= {};
globalThis.process.env ??= {};
import { c as clsx, t as attr_class } from "./index-server_CnxoOwt9.mjs";
//#region src/components/icons/CameraIcon.svelte
function CameraIcon($$renderer, $$props) {
	let { class: className = "size-5 text-white" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2"></circle><circle cx="18" cy="9" r="0.8" fill="currentColor"></circle></svg>`);
}
//#endregion
//#region src/components/icons/UploadFileIcon.svelte
function UploadFileIcon($$renderer, $$props) {
	let { class: className = "size-5 text-white" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline><line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line></svg>`);
}
//#endregion
export { CameraIcon as n, UploadFileIcon as t };
