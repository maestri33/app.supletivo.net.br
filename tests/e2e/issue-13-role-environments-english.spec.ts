import { test, expect } from "@playwright/test";

test.describe("Ambientes e Sub-rotas Canônicas v2 (student + admin)", () => {
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

  test("acesso não autenticado a /admin/dashboard e /admin/documentos deve redirecionar para /", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");

    await page.goto("/admin/documentos");
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "");
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("usuário autenticado como aluno renderiza /student/lead com sucesso", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-student-token",
          roles: ["client"],
          role_statuses: { client: "lead" },
        }),
      );
    });
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u1",
          external_id: "u1",
          phone: "5511999999999",
          cpf: "11144477735",
          email: "a@b.com",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
        },
      }),
    );
    await page.route("**/api/v1/catalog/**", (route) =>
      route.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null } }),
    );
    await page.route("**/api/v1/student/payment/current", (route) => route.fulfill({ status: 404, json: { error: "none" } }));

    await page.goto("/student/lead");
    await expect(page.locator("h1").first()).toBeVisible();
    expect(page.url()).toContain("/student/lead");
  });

  test("usuário autenticado como administrador renderiza /admin/dashboard e /admin/documentos", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-admin-token",
          roles: ["admin"],
          role_statuses: { admin: "active" },
        }),
      );
    });
    await page.route("**/api/v1/admin/**", (route) =>
      route.fulfill({
        json: {
          success: true,
          total: 0,
          page: 1,
          limit: 15,
          total_pages: 1,
          items: [],
          documents: [],
          students: [],
          metrics: {
            total_revenue_cents: 0,
            total_revenue: "R$ 0,00",
            total_paid_count: 0,
            total_pending_count: 0,
            total_failed_count: 0,
            total_refunded_count: 0,
            total_refunded_cents: 0,
            total_refunded_amount: "R$ 0,00",
          },
        },
      }),
    );

    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Painel Administrativo" })).toBeVisible();

    await page.goto("/admin/documentos");
    await expect(page.getByRole("heading", { name: "Mesa de Revisão de Documentos" })).toBeVisible();
  });
});
