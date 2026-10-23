/**
 * IBGE Localidades — public API, CORS-enabled. Drives UF -> cidade selects so
 * birthplace never arrives as free text.
 * https://servicodados.ibge.gov.br/api/docs/localidades
 */
const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
import { fetchJsonWithDeadline } from "./deadline";
const IBGE_TIMEOUT_MS = 8_000;

export interface UfOption {
  sigla: string;
  nome: string;
}

export async function fetchUfs(): Promise<UfOption[]> {
  const { response: res, data } = await fetchJsonWithDeadline<{ sigla: string; nome: string }[]>(`${IBGE_BASE}/estados?orderBy=nome`, {}, IBGE_TIMEOUT_MS);
  if (!res.ok) throw new Error(`IBGE estados: ${res.status}`);
  return data.map((e) => ({ sigla: e.sigla, nome: e.nome }));
}

export async function fetchCities(uf: string): Promise<string[]> {
  const normalizedUf = encodeURIComponent(uf.trim().toUpperCase());
  const { response: res, data } = await fetchJsonWithDeadline<{ nome: string }[]>(`${IBGE_BASE}/estados/${normalizedUf}/municipios?orderBy=nome`, {}, IBGE_TIMEOUT_MS);
  if (!res.ok) throw new Error(`IBGE municípios: ${res.status}`);
  return data.map((m) => m.nome);
}

