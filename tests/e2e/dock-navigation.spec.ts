import { test, expect } from "@playwright/test";

test.describe("Navegação Global e Adaptativa v2 (RoleAdaptiveNavDock)", () => {
  test("não deve renderizar a dock flutuante na rota pública de login", async ({ page }) => {
    await page.goto("/");
    const dock = page.getByTestId("role-adaptive-dock");
    await expect(dock).toHaveCount(0);
  });

  test("deve exibir a dock adaptativa globalmente no painel do aluno matriculado", async ({ page }) => {
    const externalId = "22222222-2222-4222-8222-222222222222";

    await page.addInitScript((id) => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          token_type: "bearer",
          roles: ["client"],
          role_statuses: { client: "enrolled" },
          user: { external_id: id },
          savedAt: Date.now(),
        }),
      );
    }, externalId);

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: externalId,
          external_id: externalId,
          phone: "5511999999999",
          name: "Estudante Teste",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "enrolled",
        },
      }),
    );
    await page.route("**/api/v1/student/me", (route) =>
      route.fulfill({
        json: {
          user: { id: externalId, phone: "5511999999999", name: "Estudante Teste", full_name: "Estudante Teste", cpf: "11144477735", gender: "M", blood_type: "O+" },
          role: { id: "r1", role: "client", status: "enrolled", substatus: "pending_post_siga_docs", paid_at: Date.now() },
          siga_credentials: { username: "11144477735", url: "https://siga.supletivo.net.br" },
          document_progress: { blood_type_registered: true, military_exempt: false, academic_documents_ready: false, checklist: {} },
        },
      }),
    );
    await page.route("**/api/v1/student/documents", (route) =>
      route.fulfill({ json: { documents: [], pending_requirements: ["school_records"] } }),
    );
    await page.route("**/api/v1/student/exams", (route) =>
      route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
    );
    await page.route("**/api/v1/catalog/contact", (route) =>
      route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
    );

    await page.goto("/student/active/dashboard");

    await expect(page.locator("a[href='/student/active/dashboard']").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("a[href='/student/active/documents']").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("a[href='/student/active/access']").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("a[href='/student/active/assessments']").first()).toBeVisible({ timeout: 10000 });
  });

  test("deve transmutar itens do dock ao alternar entre Aluno e Admin em /tabs-status", async ({ page }) => {
    await page.goto("/tabs-status");
    const root = page.getByTestId("role-status-tabs-root");
    await expect(root).toHaveAttribute("data-hydrated", "true", { timeout: 10000 });

    await expect(page.locator("a[href='/student/enrollment/rg']").first()).toBeVisible();

    await page.getByRole("tab", { name: /1\. Pagamento/i }).click();
    await expect(page.locator("a[href='/student/lead/payment']").first()).toBeVisible();

    await root.getByRole("button", { name: /Admin/i }).click();
    await expect(page.locator("a[href='/admin/dashboard']").first()).toBeVisible();
    await expect(page.locator("a[href='/admin/documentos']").first()).toBeVisible();
    await expect(page.locator("a[href='/admin/credenciais-siga']").first()).toBeVisible();
  });
});
