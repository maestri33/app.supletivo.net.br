import { l as clsx, t as attr_class } from "./index-server_DvB6aUE6.mjs";
//#region src/components/icons/BankTlsSeal.svelte
function BankTlsSeal($$renderer, $$props) {
	let { class: className = "size-5 text-[var(--green)]" } = $$props;
	$$renderer.push(`<svg${attr_class(clsx(className))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><rect x="3" y="10" width="18" height="12" rx="3" stroke="currentColor" stroke-width="2" fill="rgba(0, 115, 77, 0.15)"></rect><circle cx="12" cy="15" r="1.5" fill="var(--yellow, #ffc400)"></circle><path d="M12 16.5v2.5" stroke="var(--yellow, #ffc400)" stroke-width="1.5" stroke-linecap="round"></path><path d="M6 16h2M16 16h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.6"></path></svg>`);
}
//#endregion
export { BankTlsSeal as t };
