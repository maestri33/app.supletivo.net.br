import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const transpile = (code) =>
  ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

const loadTsModule = async (relativePath, transform = (s) => s) => {
  const raw = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const patched = transform(raw)
    .replace(/import\.meta\.env\.URL_BACKEND/g, "undefined")
    .replace(
      /import\s*\{\s*env\s*\}\s*from\s*['"]cloudflare:workers['"];?/,
      'const env = { URL_BACKEND: "https://api.supletivo.net.br" };',
    );
  const url = `data:text/javascript;base64,${Buffer.from(transpile(patched)).toString("base64")}`;
  return import(url);
};

test("media proxy forwards Authorization and forces private no-store + Vary + nosniff", async () => {
  const mod = await loadTsModule("../../src/pages/media/[...path].ts");
  const origFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedAuth = "";

  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedAuth = new Headers(init.headers).get("authorization") ?? "";
    return new Response("binary-ok", {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "public, max-age=86400",
      },
    });
  };

  try {
    const req = new Request("https://app.supletivo.net.br/media/enrollments/rg/front.jpg", {
      headers: { Authorization: "Bearer jwt-test-123" },
    });
    const res = await mod.ALL({
      request: req,
      url: new URL(req.url),
      locals: { runtime: { env: { URL_BACKEND: "https://api.supletivo.net.br" } } },
    });

    assert.equal(capturedUrl, "https://api.supletivo.net.br/v1/media/enrollments/rg/front.jpg");
    assert.equal(capturedAuth, "Bearer jwt-test-123");
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(res.headers.get("vary"), "Authorization");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("API proxy translates /api/v1/* -> /v1/* and separates public catalog cache from private endpoints", async () => {
  const mod = await loadTsModule("../../src/pages/api/[...path].ts");
  const origFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=999" },
    });
  };

  try {
    const publicReq = new Request("https://app.supletivo.net.br/api/v1/catalog/pricing");
    const publicRes = await mod.ALL({
      request: publicReq,
      url: new URL(publicReq.url),
      locals: { runtime: { env: { URL_BACKEND: "https://api.supletivo.net.br" } } },
    });
    assert.equal(calls[0], "https://api.supletivo.net.br/v1/catalog/pricing");
    assert.match(publicRes.headers.get("cache-control") ?? "", /s-maxage=300/);

    const authReq = new Request("https://app.supletivo.net.br/api/v1/student/me", {
      headers: { Authorization: "Bearer secret" },
    });
    const authRes = await mod.ALL({
      request: authReq,
      url: new URL(authReq.url),
      locals: { runtime: { env: { URL_BACKEND: "https://api.supletivo.net.br" } } },
    });
    assert.equal(calls[1], "https://api.supletivo.net.br/v1/student/me");
    assert.equal(authRes.headers.get("cache-control"), "private, no-store");
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("API proxy removes legacy recovery/contact & clients/auth rewrites and middleware protects /media/, /api/, /v1/", async () => {
  const proxySource = fs.readFileSync(
    new URL("../../src/pages/api/[...path].ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(proxySource, /recovery\/contact/);
  assert.doesNotMatch(proxySource, /clients\/auth/);

  const middlewareSource = fs.readFileSync(
    new URL("../../src/middleware.ts", import.meta.url),
    "utf8",
  )
    .replace(/import\s*\{\s*defineMiddleware\s*\}\s*from\s*['"]astro:middleware['"];?/, "const defineMiddleware = (fn) => fn;");
  const mwUrl = `data:text/javascript;base64,${Buffer.from(transpile(middlewareSource)).toString("base64")}`;
  const mw = await import(mwUrl);

  const mediaRes = await mw.onRequest(
    { url: new URL("https://app.supletivo.net.br/media/docs/foto.png") },
    async () => new Response("img", { headers: { "Cache-Control": "private, no-store, max-age=0" } }),
  );
  assert.equal(mediaRes.headers.get("Cache-Control"), "private, no-store, max-age=0");

  const publicAssetRes = await mw.onRequest(
    { url: new URL("https://app.supletivo.net.br/images/hero.png") },
    async () => new Response("img", { headers: {} }),
  );
  assert.equal(
    publicAssetRes.headers.get("Cache-Control"),
    "public, max-age=604800, s-maxage=2592000, immutable",
  );
});
