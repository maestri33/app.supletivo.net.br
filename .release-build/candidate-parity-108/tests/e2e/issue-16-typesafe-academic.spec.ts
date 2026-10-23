import { test, expect } from "@playwright/test";

test.describe("TypeSafe System One (Jev) Document Triage Integration (Issue #16)", () => {
  test("1. Endpoint /api/v1/academic/documents/triage classifica CNH válida com maioridade", async ({ request }) => {
    const res = await request.post("/api/v1/academic/documents/triage", {
      data: {
        fileName: "cnh_digital_aluno_2026.pdf",
        fileSize: 102400,
        fileType: "application/pdf",
        textSnippet: "Carteira Nacional de Habilitação DETRAN PR Nascimento 15/05/1992",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.docType).toBe("cnh");
    expect(data.is18Plus).toBe(true);
    expect(data.isLegible).toBe(true);
    expect(data.latencyMs).toBeLessThan(1500);
  });

  test("2. Endpoint /api/v1/academic/documents/triage rejeita arquivo ilegível/embaçado", async ({ request }) => {
    const res = await request.post("/api/v1/academic/documents/triage", {
      data: {
        fileName: "foto_embaçado_paisagem.jpg",
        fileSize: 40,
        fileType: "image/jpeg",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.isLegible).toBe(false);
    expect(data.feedback).toBeTruthy();
  });

  test("3. Endpoint /api/v1/academic/documents/triage classifica Comprovante de Residência válido", async ({ request }) => {
    const res = await request.post("/api/v1/academic/documents/triage", {
      data: {
        fileName: "fatura_energia_copel_2026.pdf",
        fileSize: 85000,
        fileType: "application/pdf",
        textSnippet: "Conta de Consumo Energia Elétrica COPEL Vencimento 10/09/2026",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.docType).toBe("comprovante_residencia");
    expect(data.isLegible).toBe(true);
  });

  test("4. Endpoint /api/v1/academic/documents/triage rejeita candidato menor de 18 anos para EJA", async ({ request }) => {
    const res = await request.post("/api/v1/academic/documents/triage", {
      data: {
        fileName: "rg_candidato_menor.jpg",
        fileSize: 64000,
        fileType: "image/jpeg",
        textSnippet: "Registro Geral SSP PR Nascimento 12/08/2011 (menor de 18 anos)",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.is18Plus).toBe(false);
  });
});
