globalThis.process ??= {};
globalThis.process.env ??= {};
import { n as __exportAll } from "./rolldown-runtime_BDykq6kg.mjs";
//#region src/lib/typesafe.ts
var TYPESAFE_API_URL = process.env.TYPESAFE_API_URL || "https://api.typesafe.ai/v1/systemone";
var TYPESAFE_TIMEOUT_MS = 1200;
function getApiKey() {
	const metaEnv = typeof import.meta !== "undefined" ? Object.assign({
		"ASSETS_PREFIX": void 0,
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SITE": void 0,
		"SSR": true
	}, { OS: "Windows_NT" }) : void 0;
	return process.env.TYPESAFE_API_KEY || metaEnv?.TYPESAFE_API_KEY || "";
}
function unavailableTriage(startTime) {
	return {
		valid: false,
		docType: "outro",
		confidence: 0,
		legibilityScore: 0,
		isLegible: false,
		is18Plus: false,
		feedback: "A análise oficial está indisponível. O documento permanece pendente de validação.",
		source: "unavailable",
		latencyMs: Date.now() - startTime
	};
}
async function triageDocument(params) {
	const startTime = Date.now();
	const apiKey = getApiKey();
	if (!apiKey) return unavailableTriage(startTime);
	const payload = {
		model: "jev-latest",
		state: `Arquivo: ${params.fileName}, Tamanho: ${params.fileSize} bytes, Mime: ${params.fileType}. Texto/OCR: ${params.textSnippet || "Nenhum texto extraído"}`.slice(0, 2e3),
		questions: {
			tipo_documento: {
				type: "choice",
				instructions: "Identifique o tipo de documento de matrícula apresentado:",
				criteria: {
					rg: "Cédula de RG, Identidade Nacional ou CIN oficial",
					cnh: "Carteira Nacional de Habilitação ou CNH Digital oficial",
					comprovante_residencia: "Conta de consumo (luz, água, internet, gás) ou declaração de residência",
					outro: "Não é um documento de identificação nem comprovante de residência válido"
				}
			},
			legibilidade: {
				type: "score",
				instructions: "Nível de legibilidade e qualidade da foto/documento:",
				criteria: [
					"0 - Ilegível: Totalmente embaçado, escuro ou corrompido",
					"1 - Regular: Parcialmente legível mas com cortes ou reflexos graves",
					"2 - Bom: Dados essenciais e foto reconhecíveis",
					"3 - Excelente: Nitidez perfeita, dados 100% legíveis sem cortes"
				]
			},
			maioridade_eja: {
				type: "noul",
				instructions: "Os dados indicam que o candidato cumpre o requisito de maioridade (18+ anos para EJA)?",
				criteria: {
					true: "Indica maioridade ou ausência de indício de menoridade",
					false: "Data de nascimento indica explicitamente menor de 18 anos"
				}
			}
		}
	};
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), TYPESAFE_TIMEOUT_MS);
		const response = await fetch(TYPESAFE_API_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload),
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (response.ok) {
			const answers = (await response.json()).answers || {};
			const tipoChoice = answers.tipo_documento?.choice || "outro";
			const legScore = Number(answers.legibilidade?.score ?? 0);
			const rawNoul = answers.maioridade_eja?.noul;
			const is18 = typeof rawNoul === "number" ? rawNoul >= .5 : rawNoul === true;
			const isLegible = legScore >= 1.5;
			const valid = tipoChoice !== "outro" && isLegible && is18;
			let feedback = "Documento validado com sucesso pela triagem inteligente.";
			if (!is18) feedback = "Matrícula no Supletivo EJA exige no mínimo 18 anos completos.";
			else if (!isLegible) feedback = "A imagem ficou embaçada ou com reflexo. Aproxime a câmera e garanta boa iluminação.";
			else if (tipoChoice === "outro") feedback = "O arquivo enviado não parece ser um documento de identidade ou residência oficial.";
			return {
				valid,
				docType: tipoChoice,
				confidence: Number(answers.tipo_documento?.confidence ?? .9),
				legibilityScore: legScore,
				isLegible,
				is18Plus: is18,
				feedback,
				source: "typesafe_systemone",
				latencyMs: Date.now() - startTime
			};
		}
	} catch (err) {
		console.warn("[typesafe] Request failed or timed out; document remains pending:", err);
	}
	return unavailableTriage(startTime);
}
//#endregion
//#region src/pages/api/v1/academic/documents/triage.ts
var triage_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const { fileName, fileSize, fileType, textSnippet } = await request.json() || {};
		if (!fileName) return new Response(JSON.stringify({ error: "fileName is required for document triage" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const triage = await triageDocument({
			fileName: String(fileName),
			fileSize: Number(fileSize || 0),
			fileType: String(fileType || "image/jpeg"),
			textSnippet: textSnippet ? String(textSnippet) : void 0
		});
		return new Response(JSON.stringify(triage), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store"
			}
		});
	} catch (err) {
		console.error("[API:academic:documents:triage] Error:", err);
		return new Response(JSON.stringify({
			valid: false,
			docType: "outro",
			confidence: 0,
			legibilityScore: 0,
			isLegible: false,
			is18Plus: false,
			feedback: "A análise oficial está indisponível. O documento permanece pendente de validação.",
			source: "unavailable",
			latencyMs: 0
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/v1/academic/documents/triage@_@ts
var page = () => triage_exports;
//#endregion
export { page };
