import type { APIRoute } from 'astro';

export const prerender = false;

function builtAtSaoPaulo(): string {
  const raw = process.env.BUILD_AT ?? new Date().toISOString();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: "ok",
      sha: process.env.GIT_SHA ?? "unknown",
      builtAt: builtAtSaoPaulo(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
};
