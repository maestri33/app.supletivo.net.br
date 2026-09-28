import type { APIRoute } from 'astro';
import { evaluateEssay } from '../../../../../lib/typesafe.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { text, themePrompt } = body || {};

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'text is required for essay evaluation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const evaluation = await evaluateEssay({
      text: String(text),
      themePrompt: themePrompt ? String(themePrompt) : undefined,
    });

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[API:academic:essay:evaluate] Error:', err);
    return new Response(
      JSON.stringify({
        isAiGenerated: false,
        aiProbability: 0,
        authenticityScore: 2,
        onTopic: true,
        feedback: 'Erro ao avaliar redação. Tente novamente em instantes.',
        source: 'heuristic_fallback',
        latencyMs: 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
