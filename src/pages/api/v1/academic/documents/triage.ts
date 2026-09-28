import type { APIRoute } from 'astro';
import { triageDocument } from '../../../../../lib/typesafe.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
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
  } catch (err: any) {
    console.error('[API:academic:documents:triage] Error:', err);
    return new Response(
      JSON.stringify({
        valid: false,
        docType: 'outro',
        confidence: 0,
        legibilityScore: 0,
        isLegible: false,
        is18Plus: true,
        feedback: 'Erro ao processar triagem do documento. Tente novamente.',
        source: 'heuristic_fallback',
        latencyMs: 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
