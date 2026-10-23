import { r as __exportAll } from "./rolldown-runtime_BMI-E3GI.mjs";
import { t as POST } from "./contact_tPcg0l08.mjs";
//#region src/pages/api/[...path].ts
var ____path__exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	prerender: () => false
});
var URL_BACKEND = process.env.URL_BACKEND ?? "https://backend.supletivo.net.br";
var ALL = async (context) => {
	const { request, url } = context;
	if (url.pathname === "/api/v1/auth/recovery/contact" && request.method === "POST") return POST(context);
	let pathname = url.pathname;
	if (pathname.startsWith("/api/v1/auth/")) pathname = pathname.replace("/api/v1/auth/", "/api/v1/clients/auth/");
	const targetUrl = new URL(pathname + url.search, URL_BACKEND);
	const headers = new Headers(request.headers);
	headers.set("host", targetUrl.host);
	headers.set("x-forwarded-host", url.host);
	headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
	const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
	if (clientIp) headers.set("x-forwarded-for", clientIp);
	const body = request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : void 0;
	try {
		const res = await fetch(targetUrl.toString(), {
			method: request.method,
			headers,
			body,
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
		console.error(`[api-proxy] Error proxying ${request.method} ${url.pathname} to backend:`, errorMsg);
		return new Response(JSON.stringify({
			error: "backend_unavailable",
			message: "Serviço temporariamente indisponível. Tente novamente em instantes."
		}), {
			status: 502,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/[...path]@_@ts
var page = () => ____path__exports;
//#endregion
export { page };
