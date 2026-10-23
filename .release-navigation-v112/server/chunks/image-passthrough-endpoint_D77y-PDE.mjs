globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
import { J as isRemotePath } from "./console_CytTTjjb.mjs";
import { a as fetchWithRedirects, d as isRemoteAllowed } from "./service_Axy-yxcV.mjs";
import { t as imageConfig } from "./_astro_assets_9mnWnVm7.mjs";
import "./assets_kYqGEAAP.mjs";
import { env } from "cloudflare:workers";
//#region node_modules/.pnpm/@astrojs+cloudflare@14.3.2__d1b081440df5a7dba859a47519dcdb35/node_modules/@astrojs/cloudflare/dist/entrypoints/image-passthrough-endpoint.js
var image_passthrough_endpoint_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const href = url.searchParams.get("href");
		if (!href) return new Response("Bad Request", { status: 400 });
		const isRemote = isRemotePath(href);
		let response;
		if (isRemote) {
			if (!isRemoteAllowed(href, imageConfig)) return new Response("Forbidden", { status: 403 });
			response = await fetchWithRedirects({
				url: href,
				imageConfig
			});
		} else {
			const sourceUrl = new URL(href, url.origin);
			if (sourceUrl.origin !== url.origin) return new Response("Forbidden", { status: 403 });
			response = await env.ASSETS.fetch(new Request(sourceUrl, { headers: request.headers }));
		}
		if (response.status >= 300 && response.status < 400) return new Response("Not Found", { status: 404 });
		if (!response.ok) return new Response("Not Found", { status: 404 });
		const contentType = response.headers.get("Content-Type") ?? "";
		if (!contentType.startsWith("image/")) return new Response("Forbidden", { status: 403 });
		const headers = new Headers();
		headers.set("Content-Type", contentType);
		headers.set("Cache-Control", "public, max-age=31536000");
		headers.set("Date", (/* @__PURE__ */ new Date()).toUTCString());
		const etag = response.headers.get("ETag");
		if (etag) headers.set("ETag", etag);
		return new Response(response.body, {
			status: 200,
			headers
		});
	} catch (_err) {
		return new Response("Internal Server Error", { status: 500 });
	}
};
//#endregion
//#region \0virtual:astro:page:node_modules/.pnpm/@astrojs+cloudflare@14.3.2__d1b081440df5a7dba859a47519dcdb35/node_modules/@astrojs/cloudflare/dist/entrypoints/image-passthrough-endpoint@_@js
var page = () => image_passthrough_endpoint_exports;
//#endregion
export { page };
