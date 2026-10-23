import { test, expect } from "@playwright/test";

test.describe("Ambientes e Sub-rotas Canônicas em Inglês", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  });

  test("acesso não autenticado a /student/lead deve redirecionar para a raiz /", async ({ page }) => {
    await page.goto("/student/lead");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("acesso não autenticado a /student/enrollment deve redirecionar para a raiz /", async ({ page }) => {
    await page.goto("/student/enrollment");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("acesso não autenticado a /promoter/candidate deve redirecionar para a raiz", async ({ page }) => {
    await page.goto("/promoter/candidate");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("acesso não autenticado a /promoter/training deve redirecionar para a raiz", async ({ page }) => {
    await page.goto("/promoter/training");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("acesso não autenticado a /promoter/active deve redirecionar para a raiz", async ({ page }) => {
    await page.goto("/promoter/active");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("acesso não autenticado a /hub/active deve redirecionar para a raiz /", async ({ page }) => {
    await page.goto("/hub/active");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("acesso não autenticado a /hub/review deve redirecionar para a raiz /", async ({ page }) => {
    await page.goto("/hub/review");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("usuário autenticado como aluno renderiza /student/lead com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-student-token",
        roles: ["lead", "student"]
      }));
    });

    await page.goto("/student/lead");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(page.url()).toContain("/student/lead");
  });

  test("usuário autenticado como aluno renderiza /student/enrollment com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-student-token",
        roles: ["enrollment", "student"]
      }));
    });

    await page.goto("/student/enrollment");
    await expect(page.locator("h1")).toContainText("Documentação");
    expect(page.url()).toContain("/student/enrollment");
  });

  test("usuário autenticado como candidato a promotor renderiza /promoter/candidate com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-candidate-token",
        roles: ["candidate", "promoter"]
      }));
    });

    await page.goto("/promoter/candidate");
    await expect(page.locator("h1")).toContainText("Credenciamento de Promotor");
    expect(page.url()).toContain("/promoter/candidate");
  });

  test("usuário autenticado como promotor renderiza /promoter/active com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-promoter-token",
        roles: ["promoter"]
      }));
    });

    await page.goto("/promoter/active");
    await expect(page.locator("h1")).toContainText("Painel do Promotor");
    expect(page.url()).toContain("/promoter/active");
  });

  test("usuário autenticado como promotor renderiza /promoter/training com status de atenção", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-training-token",
        roles: ["promoter", "training"]
      }));
    });

    await page.goto("/promoter/training");
    await expect(page.locator("h1")).toContainText("Treinamento Obrigatório Pendente");
    expect(page.url()).toContain("/promoter/training");
  });

  test("usuário autenticado como coordenador de hub renderiza /hub/active com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-hub-token",
        roles: ["coordinator", "hub"]
      }));
    });

    await page.goto("/hub/active");
    await expect(page.locator("h1")).toContainText("Secretaria de Polo (Hub)");
    expect(page.url()).toContain("/hub/active");
  });

  test("usuário autenticado como coordenador de hub renderiza /hub/review com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("supletivo.login", JSON.stringify({
        access_token: "mock-hub-token",
        roles: ["coordinator", "hub"]
      }));
    });

    await page.goto("/hub/review");
    await expect(page.locator("h1")).toContainText("Central de Análises do Polo");
    expect(page.url()).toContain("/hub/review");
  });
});


