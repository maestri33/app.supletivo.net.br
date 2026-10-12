/**
 * IBGE Localidades — public API, CORS-enabled. Drives UF -> cidade selects so
 * birthplace never arrives as free text.
 * https://servicodados.ibge.gov.br/api/docs/localidades
 */
const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_TIMEOUT_MS = 8_000;

export interface UfOption {
  sigla: string;
  nome: string;
}

export async function fetchUfs(): Promise<UfOption[]> {
  const res = await fetchWithTimeout(`${IBGE_BASE}/estados?orderBy=nome`);
  if (!res.ok) throw new Error(`IBGE estados: ${res.status}`);
  const data = (await res.json()) as { sigla: string; nome: string }[];
  return data.map((e) => ({ sigla: e.sigla, nome: e.nome }));
}

export async function fetchCities(uf: string): Promise<string[]> {
  const normalizedUf = encodeURIComponent(uf.trim().toUpperCase());
  const res = await fetchWithTimeout(`${IBGE_BASE}/estados/${normalizedUf}/municipios?orderBy=nome`);
  if (!res.ok) throw new Error(`IBGE municípios: ${res.status}`);
  const data = (await res.json()) as { nome: string }[];
  return data.map((m) => m.nome);
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), IBGE_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
