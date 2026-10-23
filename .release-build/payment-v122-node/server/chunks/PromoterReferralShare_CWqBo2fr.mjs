import { c as attr } from "./index-server_DvB6aUE6.mjs";
//#region src/components/interactive/PromoterReferralShare.svelte
function PromoterReferralShare($$renderer, $$props) {
	let { url } = $$props;
	$$renderer.push(`<div class="referral-share svelte-1s9o3rd" aria-label="Compartilhar link de indicação"><div class="actions svelte-1s9o3rd"><button type="button" class="btn svelte-1s9o3rd"${attr("disabled", !url, true)}>Copiar link</button> <a class="share-action svelte-1s9o3rd"${attr("href", `https://wa.me/?text=${encodeURIComponent(`Conheça o Supletivo Brasil pelo meu link: ${url}`)}`)} target="_blank" rel="noopener noreferrer">WhatsApp</a> <a class="share-action svelte-1s9o3rd"${attr("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)} target="_blank" rel="noopener noreferrer">Facebook</a> <button type="button" class="share-action svelte-1s9o3rd"${attr("disabled", !url, true)}>Instagram</button> <button type="button" class="share-action svelte-1s9o3rd"${attr("disabled", !url, true)}>Outros aplicativos</button></div> `);
	$$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--> `);
	$$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
export { PromoterReferralShare as t };
