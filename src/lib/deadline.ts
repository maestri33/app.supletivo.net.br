/** Release UI waits even if a transport does not honor cancellation. */
export function withDeadline<T>(work: () => Promise<T>, timeoutMs: number, cancel?: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DOMException("A consulta demorou. O processamento pode continuar no servidor.", "AbortError"));
      cancel?.();
    }, Math.max(1, Number.isFinite(timeoutMs) ? timeoutMs : 12_000));
    Promise.resolve().then(work).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/** The deadline includes reading the response body, not only receiving headers. */
export function fetchJsonWithDeadline<T>(url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<{ response: Response; data: T }> {
  const controller = new AbortController();
  return withDeadline(async () => {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json() as T;
    return { response, data };
  }, timeoutMs, () => controller.abort());
}
