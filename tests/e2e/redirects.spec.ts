import { test, expect } from "@playwright/test";

test.describe("Redirecionamentos 308 de Rotas Legadas (v2)", () => {
  test("deve redirecionar /register para https://supletivo.net.br/ preservando ref", async ({ request }) => {
    const response = await request.get("/register?ref=campanha-123", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br/?ref=campanha-123");
  });

  test("deve redirecionar /cpf para https://supletivo.net.br/ preservando UTMs", async ({ request }) => {
    const response = await request.get("/cpf?utm_source=google&utm_campaign=eja", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br/?utm_source=google&utm_campaign=eja");
  });

  test("deve redirecionar /email para https://supletivo.net.br/", async ({ request }) => {
    const response = await request.get("/email", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br/");
  });

  test("deve redirecionar /planos para https://supletivo.net.br/#planos", async ({ request }) => {
    const response = await request.get("/planos?ref=parceiro", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br/?ref=parceiro#planos");
  });

  test("deve redirecionar /checkout para https://supletivo.net.br/", async ({ request }) => {
    const response = await request.get("/checkout", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("https://supletivo.net.br/");
  });

  test("deve redirecionar /login legado para a raiz / com 308", async ({ request }) => {
    const response = await request.get("/login", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/");
  });

  test("deve redirecionar /matricula e /onboarding para /student/enrollment com 308", async ({ request }) => {
    const r1 = await request.get("/matricula", { maxRedirects: 0 });
    expect(r1.status()).toBe(308);
    expect(r1.headers().location).toBe("/student/enrollment");

    const r2 = await request.get("/onboarding", { maxRedirects: 0 });
    expect(r2.status()).toBe(308);
    expect(r2.headers().location).toBe("/student/enrollment");
  });

  test("deve redirecionar /documentos e /provas para /student/enrollment com 308", async ({ request }) => {
    const r1 = await request.get("/documentos", { maxRedirects: 0 });
    expect(r1.status()).toBe(308);
    expect(r1.headers().location).toBe("/student/enrollment");

    const r2 = await request.get("/provas", { maxRedirects: 0 });
    expect(r2.status()).toBe(308);
    expect(r2.headers().location).toBe("/student/enrollment");
  });

  test("deve redirecionar /contrato para /student/enrollment/selfie com 308", async ({ request }) => {
    const response = await request.get("/contrato", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/student/enrollment/selfie");
  });

  test("deve redirecionar /painel e /aluno para /student com 308", async ({ request }) => {
    const r1 = await request.get("/painel", { maxRedirects: 0 });
    expect(r1.status()).toBe(308);
    expect(r1.headers().location).toBe("/student");

    const r2 = await request.get("/aluno", { maxRedirects: 0 });
    expect(r2.status()).toBe(308);
    expect(r2.headers().location).toBe("/student");
  });

  test("deve redirecionar /hub/review para /admin/documentos e /polo para /admin/dashboard", async ({ request }) => {
    const r1 = await request.get("/hub/review", { maxRedirects: 0 });
    expect(r1.status()).toBe(308);
    expect(r1.headers().location).toBe("/admin/documentos");

    const r2 = await request.get("/polo", { maxRedirects: 0 });
    expect(r2.status()).toBe(308);
    expect(r2.headers().location).toBe("/admin/dashboard");
  });

  test("deve redirecionar /autenticacao/login para / com 308", async ({ request }) => {
    const response = await request.get("/autenticacao/login", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/");
  });
});
