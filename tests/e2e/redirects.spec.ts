import { test, expect } from "@playwright/test";

test.describe("Redirecionamentos 308 de Rotas Legadas (Issue #2)", () => {
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

  test("deve redirecionar /login legado para /autenticacao/login com 308", async ({ request }) => {
    const response = await request.get("/login", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/autenticacao/login");
  });

  test("deve redirecionar a raiz / para a Landing Page se contiver ?ref=", async ({ request }) => {
    const response = await request.get("/?ref=polo-sp", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br?ref=polo-sp");
  });
});
