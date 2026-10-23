import { fetchJsonWithDeadline } from "./deadline.ts";
/**
 * TypeSafe System One (Jev) Integration Client for app.supletivo.net.br
 *
 * Provides server-backed document triage. An unavailable analyzer never approves
 * a document from its filename, size, or a client-side guess.
 */

export interface DocumentTriageResult {
  valid: boolean;
  docType: 'rg' | 'cnh' | 'comprovante_residencia' | 'outro';
  confidence: number;
  legibilityScore: number; // 0 to 3
  isLegible: boolean;
  is18Plus: boolean;
  feedback: string;
  source: 'typesafe_systemone' | 'unavailable';
  latencyMs: number;
}

const TYPESAFE_API_URL = process.env.TYPESAFE_API_URL || 'https://api.typesafe.ai/v1/systemone';
const TYPESAFE_TIMEOUT_MS = 1200;

function getApiKey(): string {
  const metaEnv = typeof import.meta !== 'undefined'
    ? (import.meta as unknown as { env?: Record<string, string> }).env
    : undefined;
  return process.env.TYPESAFE_API_KEY || metaEnv?.TYPESAFE_API_KEY || '';
}

function unavailableTriage(startTime: number): DocumentTriageResult {
  return {
    valid: false,
    docType: 'outro',
    confidence: 0,
    legibilityScore: 0,
    isLegible: false,
    is18Plus: false,
    feedback: 'A análise oficial está indisponível. O documento permanece pendente de validação.',
    source: 'unavailable',
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
    return unavailableTriage(startTime);
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

    const { response, data: rawData } = await fetchJsonWithDeadline<unknown>(TYPESAFE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, TYPESAFE_TIMEOUT_MS);

    if (response.ok) {
      interface SystemOneResponse {
        answers?: Record<string, {
          choice?: string;
          score?: number;
          noul?: boolean;
          confidence?: number;
          probabilities?: Record<string, number>;
        }>;
      }
      const data = rawData as SystemOneResponse;
      const answers = data.answers || {};

      const tipoChoice = answers.tipo_documento?.choice || 'outro';
      const legScore = Number(answers.legibilidade?.score ?? 0);
      const rawNoul = answers.maioridade_eja?.noul;
      const is18 = typeof rawNoul === 'number' ? rawNoul >= 0.5 : rawNoul === true;

      const isLegible = legScore >= 1.5;
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
    console.warn('[typesafe] Request failed or timed out; document remains pending:', err);
  }

  return unavailableTriage(startTime);
}
