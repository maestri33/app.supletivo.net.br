import { test, expect } from "@playwright/test";

test.describe("TypeSafe System One (Jev) Academic Integration (Issue #16)", () => {
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
    expect(data.latencyMs).toBeLessThan(1000);
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

  test("3. Endpoint /api/v1/academic/essay/evaluate aprova redação com voz autêntica EJA", async ({ request }) => {
    const res = await request.post("/api/v1/academic/essay/evaluate", {
      data: {
        text: "Trabalho como operador de caixa há doze anos e parei de estudar quando meu primeiro filho nasceu. Voltar a estudar no Supletivo EJA agora é a realização de um sonho para conseguir uma promoção na minha empresa e dar um futuro melhor para meus filhos.",
        themePrompt: "Importância da educação e do trabalho",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.onTopic).toBe(true);
    expect(data.isAiGenerated).toBe(false);
    expect(data.authenticityScore).toBeGreaterThanOrEqual(1.0);
  });

  test("4. Endpoint /api/v1/academic/essay/evaluate detecta redação com padrão típico de IA", async ({ request }) => {
    const res = await request.post("/api/v1/academic/essay/evaluate", {
      data: {
        text: "Em suma, vale destacar que no cerne da questão educacional contemporânea, como modelo de linguagem de inteligência artificial, é imperativo ressaltar a conjuntura socioeconômica. Em conclusão, resta evidente a premissa supracitada.",
        themePrompt: "Importância da educação e do trabalho",
      },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.isAiGenerated).toBe(true);
    expect(data.aiProbability).toBeGreaterThanOrEqual(0.5);
  });
});
