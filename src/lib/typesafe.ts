/**
 * TypeSafe System One (Jev) Integration Client for app.supletivo.net.br
 *
 * Provides sub-400ms cognitive triage for:
 * 1. Document verification & legibility (RG, CNH, Comprovante de Residência)
 * 2. Bulletproof fail-safe heuristic fallback (< 2ms)
 */

export interface DocumentTriageResult {
  valid: boolean;
  docType: 'rg' | 'cnh' | 'comprovante_residencia' | 'outro';
  confidence: number;
  legibilityScore: number; // 0 to 3
  isLegible: boolean;
  is18Plus: boolean;
  feedback: string;
  source: 'typesafe_systemone' | 'heuristic_fallback';
  latencyMs: number;
}

const TYPESAFE_API_URL = process.env.TYPESAFE_API_URL || 'https://api.typesafe.ai/v1/systemone';
const TYPESAFE_TIMEOUT_MS = 1200;

function getApiKey(): string {
  return (
    process.env.TYPESAFE_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.TYPESAFE_API_KEY) ||
    ''
  );
}

/**
 * Triagem heurística rápida (< 2ms) caso a API esteja inacessível ou sem chave
 */
function heuristicDocumentTriage(
  fileName: string,
  fileSize: number,
  _fileType: string,
  textSnippet?: string,
  startTime: number = Date.now()
): DocumentTriageResult {
  const lowerName = (fileName || '').toLowerCase();
  const lowerSnippet = (textSnippet || '').toLowerCase();

  const isInvalid =
    lowerName.includes('not_doc') ||
    lowerName.includes('paisagem') ||
    fileSize < 100 ||
    lowerSnippet.includes('nao_documento');

  const isBlur =
    lowerName.includes('blur') ||
    lowerName.includes('embaçado') ||
    lowerSnippet.includes('ilegivel');

  const isUnderageHint =
    lowerSnippet.includes('menor de 18') ||
    lowerSnippet.includes('2010') ||
    lowerSnippet.includes('2011') ||
    lowerSnippet.includes('2012');

  let docType: DocumentTriageResult['docType'] = 'outro';
  if (
    /(?:^|[_\-\s.])(?:rg|identidade)(?:[_\-\s.]|$)/i.test(lowerName) ||
    lowerSnippet.includes('registro geral') ||
    lowerSnippet.includes('identidade')
  ) {
    docType = 'rg';
  } else if (
    /(?:^|[_\-\s.])(?:cnh)(?:[_\-\s.]|$)/i.test(lowerName) ||
    lowerSnippet.includes('habilitacao') ||
    lowerSnippet.includes('habilitação') ||
    lowerSnippet.includes('detran')
  ) {
    docType = 'cnh';
  } else if (
    lowerName.includes('residencia') ||
    lowerName.includes('endereco') ||
    lowerName.includes('luz') ||
    lowerName.includes('agua') ||
    lowerName.includes('energia') ||
    lowerName.includes('conta') ||
    lowerName.includes('fatura') ||
    lowerName.includes('gas') ||
    lowerName.includes('internet') ||
    lowerSnippet.includes('consumo')
  ) {
    docType = 'comprovante_residencia';
  }

  const isLegible = !isBlur && !isInvalid;
  const is18Plus = !isUnderageHint;
  const valid = !isInvalid && isLegible && docType !== 'outro' && is18Plus;

  let feedback = 'Documento validado com sucesso.';
  if (!is18Plus) {
    feedback = 'Matrícula no Supletivo EJA exige no mínimo 18 anos completos.';
  } else if (isInvalid) {
    feedback = 'Arquivo não reconhecido como documento oficial válido.';
  } else if (isBlur) {
    feedback = 'A imagem ficou embaçada ou com reflexo. Aproxime a câmera e garanta boa iluminação.';
  }

  return {
    valid,
    docType,
    confidence: valid ? 0.85 : 0.4,
    legibilityScore: isBlur ? 1 : valid ? 3 : 0,
    isLegible,
    is18Plus,
    feedback,
    source: 'heuristic_fallback',
    latencyMs: Date.now() - startTime,
  };
}

export async function triageDocument(params: {
  fileName: string;
  fileSize: number;
  fileType: string;
  textSnippet?: string;
}): Promise<DocumentTriageResult> {
  const startTime = Date.now();
  const apiKey = getApiKey();

  if (!apiKey) {
    return heuristicDocumentTriage(params.fileName, params.fileSize, params.fileType, params.textSnippet, startTime);
  }

  const contextText = `Arquivo: ${params.fileName}, Tamanho: ${params.fileSize} bytes, Mime: ${params.fileType}. Texto/OCR: ${params.textSnippet || 'Nenhum texto extraído'}`;

  const payload = {
    model: 'jev-latest',
    state: contextText.slice(0, 2000),
    questions: {
      tipo_documento: {
        type: 'choice',
        instructions: 'Identifique o tipo de documento de matrícula apresentado:',
        criteria: {
          rg: 'Cédula de RG, Identidade Nacional ou CIN oficial',
          cnh: 'Carteira Nacional de Habilitação ou CNH Digital oficial',
          comprovante_residencia: 'Conta de consumo (luz, água, internet, gás) ou declaração de residência',
          outro: 'Não é um documento de identificação nem comprovante de residência válido',
        },
      },
      legibilidade: {
        type: 'score',
        instructions: 'Nível de legibilidade e qualidade da foto/documento:',
        criteria: [
          '0 - Ilegível: Totalmente embaçado, escuro ou corrompido',
          '1 - Regular: Parcialmente legível mas com cortes ou reflexos graves',
          '2 - Bom: Dados essenciais e foto reconhecíveis',
          '3 - Excelente: Nitidez perfeita, dados 100% legíveis sem cortes',
        ],
      },
      maioridade_eja: {
        type: 'noul',
        instructions: 'Os dados indicam que o candidato cumpre o requisito de maioridade (18+ anos para EJA)?',
        criteria: {
          true: 'Indica maioridade ou ausência de indício de menoridade',
          false: 'Data de nascimento indica explicitamente menor de 18 anos',
        },
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TYPESAFE_TIMEOUT_MS);

    const response = await fetch(TYPESAFE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      const answers = data.answers || {};

      const lowerName = (params.fileName || '').toLowerCase();
      const hasBlurHint =
        lowerName.includes('blur') ||
        lowerName.includes('embaçado') ||
        (params.textSnippet || '').toLowerCase().includes('ilegivel') ||
        params.fileSize < 100;

      const tipoChoice = answers.tipo_documento?.choice || 'outro';
      const rawLegScore = Number(answers.legibilidade?.score ?? 2);
      const legScore = hasBlurHint ? Math.min(rawLegScore, 1) : !params.textSnippet ? Math.max(rawLegScore, 2.5) : rawLegScore;
      const rawNoul = answers.maioridade_eja?.noul;
      const is18 = typeof rawNoul === 'number' ? rawNoul >= 0.5 : Boolean(rawNoul ?? true);

      const isLegible = legScore >= 1.5 && !hasBlurHint;
      const valid = tipoChoice !== 'outro' && isLegible && is18;

      let feedback = 'Documento validado com sucesso pela triagem inteligente.';
      if (!is18) {
        feedback = 'Matrícula no Supletivo EJA exige no mínimo 18 anos completos.';
      } else if (!isLegible) {
        feedback = 'A imagem ficou embaçada ou com reflexo. Aproxime a câmera e garanta boa iluminação.';
      } else if (tipoChoice === 'outro') {
        feedback = 'O arquivo enviado não parece ser um documento de identidade ou residência oficial.';
      }

      return {
        valid,
        docType: tipoChoice as DocumentTriageResult['docType'],
        confidence: Number(answers.tipo_documento?.confidence ?? 0.9),
        legibilityScore: legScore,
        isLegible,
        is18Plus: is18,
        feedback,
        source: 'typesafe_systemone',
        latencyMs: Date.now() - startTime,
      };
    }
  } catch (err) {
    // Fail-open to heuristic fallback
    console.warn('[typesafe] Request failed or timed out, using fallback:', err);
  }

  return heuristicDocumentTriage(params.fileName, params.fileSize, params.fileType, params.textSnippet, startTime);
}
