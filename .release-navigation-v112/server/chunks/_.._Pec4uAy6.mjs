globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
//#region src/pages/media/[...path].ts
var ____path__exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	prerender: () => false
});
var URL_BACKEND = process.env.URL_BACKEND ?? "https://backend.supletivo.net.br";
var ALL = async ({ request, url }) => {
	const targetUrl = new URL(url.pathname + url.search, URL_BACKEND);
	const headers = new Headers(request.headers);
	headers.set("host", targetUrl.host);
	try {
		const res = await fetch(targetUrl.toString(), {
			method: request.method,
			headers,
			redirect: "manual"
		});
		const responseHeaders = new Headers(res.headers);
		responseHeaders.delete("content-encoding");
		responseHeaders.delete("content-length");
		return new Response(res.body, {
			status: res.status,
			statusText: res.statusText,
			headers: responseHeaders
		});
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		console.error(`[media-proxy] Error proxying ${url.pathname}:`, errorMsg);
		return new Response("Not Found", { status: 404 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/media/[...path]@_@ts
var page = () => ____path__exports;
//#endregion
export { page };
