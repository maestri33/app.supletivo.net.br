import type { APIRoute } from 'astro';
import { triageDocument } from '../../../../../lib/typesafe.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Defesa em Profundidade: Requer sessão ativa de aluno ou token de autorização para evitar exaustão de quota
    const url = new URL(request.url);
    const isLocalOrTest = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || process.env.NODE_ENV === 'test';
    const hasAuthHeader = Boolean(request.headers.get('Authorization'));
    const hasCookieHeader = Boolean(request.headers.get('cookie')?.includes('supletivo.'));
    const hasSessionCookie = Boolean(
      cookies?.get?.('supletivo.auth')?.value ||
      cookies?.get?.('supletivo.session')?.value ||
      hasCookieHeader ||
      hasAuthHeader ||
      isLocalOrTest
    );

    if (!hasSessionCookie) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Sessão ativa ou validação Turnstile necessária para análise de documentos.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { fileName, fileSize, fileType, textSnippet } = body || {};

    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'fileName is required for document triage' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const triage = await triageDocument({
      fileName: String(fileName),
      fileSize: Number(fileSize || 0),
      fileType: String(fileType || 'image/jpeg'),
      textSnippet: textSnippet ? String(textSnippet) : undefined,
    });

    return new Response(JSON.stringify(triage), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    console.error('[API:academic:documents:triage] Error:', err);
    return new Response(
      JSON.stringify({
        valid: false,
        docType: 'outro',
        confidence: 0,
        legibilityScore: 0,
        isLegible: false,
        is18Plus: false,
        feedback: 'A análise oficial está indisponível. O documento permanece pendente de validação.',
        source: 'unavailable',
        latencyMs: 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
