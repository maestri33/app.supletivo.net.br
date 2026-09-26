import { test, expect } from "@playwright/test";

test.describe("Redirecionamentos 308 de Rotas Legadas", () => {
  test("deve redirecionar /register para https://supletivo.net.br preservando ref", async ({ request }) => {
    const response = await request.get("/register?ref=promoter-123", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br?ref=promoter-123");
  });

  test("deve redirecionar /cpf para https://supletivo.net.br preservando UTMs", async ({ request }) => {
    const response = await request.get("/cpf?utm_source=google&utm_campaign=eja", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br?utm_source=google&utm_campaign=eja");
  });

  test("deve redirecionar /email para https://supletivo.net.br", async ({ request }) => {
    const response = await request.get("/email", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br");
  });

  test("deve redirecionar /planos para https://supletivo.net.br/#planos", async ({ request }) => {
    const response = await request.get("/planos?ref=parceiro", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br/#planos?ref=parceiro");
  });

  test("deve redirecionar /checkout para https://supletivo.net.br", async ({ request }) => {
    const response = await request.get("/checkout", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br");
  });

  test("deve redirecionar /login legado para a raiz / com 308", async ({ request }) => {
    const response = await request.get("/login", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/");
  });

  test("deve redirecionar /matricula legada para /student/enrollment com 308", async ({ request }) => {
    const response = await request.get("/matricula", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/student/enrollment");
  });

  test("deve redirecionar /documentos para /student/enrollment com 308", async ({ request }) => {
    const response = await request.get("/documentos", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/student/enrollment");
  });

  test("deve redirecionar /painel para /student com 308", async ({ request }) => {
    const response = await request.get("/painel", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/student");
  });

  test("deve redirecionar a raiz / para a Landing Page se contiver ?ref=", async ({ request }) => {
    const response = await request.get("/?ref=polo-sp", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br?ref=polo-sp");
  });
});

test.describe("Recepção de Promotores e Prevenção de Ejeção Indevida", () => {
  test("deve NÃO redirecionar para a landing B2C quando role=promotor estiver presente", async ({ request }) => {
    const response = await request.get("/?role=promotor&ref=polo-sp", { maxRedirects: 0 });
    // Deve servir 200 (HTML da tela de login direto na raiz)
    expect(response.status()).toBe(200);
    expect(response.headers().location).toBeUndefined();
  });

  test("rota /promotor deve direcionar para /promoter com 308", async ({ request }) => {
    const response = await request.get("/promotor?ref=polo-sp&utm_source=google", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const location = response.headers().location || "";
    expect(location).toContain("/promoter");
    expect(location).toContain("ref=polo-sp");
    expect(location).toContain("utm_source=google");
  });

  test("rota /promotor/adesao deve direcionar para /promoter/candidate", async ({ request }) => {
    const response = await request.get("/promotor/adesao?ref=polo-curitiba", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const location = response.headers().location || "";
    expect(location).toContain("/promoter/candidate");
    expect(location).toContain("ref=polo-curitiba");
  });
});
