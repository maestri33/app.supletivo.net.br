import { test, expect, type Page } from "@playwright/test";

async function stubEnrollment(page: Page, status: string) {
  await page.addInitScript(() => {
    localStorage.setItem("supletivo.login", JSON.stringify({ access_token: "fixture-access", refresh_token: "fixture-refresh" }));
  });
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: "release-user", roles: ["enrollment"], role_statuses: { student: "enrollment" }, name: "Aluno de teste",
  } }));
  await page.route("**/api/v1/clients/enrollment/me", route => route.fulfill({ json: {
    external_id: "release-enrollment", hub_external_id: "release-hub", status,
    selfie_verified: true, selfie_status: "approved",
    rg: { analysis_status: "approved", missing_fields: [] },
    address_complete: true, address_proof: { exists: true, status: "approved" },
    education: { level: "medio", grade: 2, completed: false, state: "PR", city: "Curitiba" },
    selfie: { exists: true, analysis_status: "approved", verified: true },
    release: { stage: "partner_setup", next_action: "O coordenador precisa efetivar sua matrícula na instituição parceira e preparar seu acesso para estudar.", hub_name: "Polo responsável", coordinator_name: "Coordenadora de teste", contact_url: null, payment_confirmed: true, updated_at: null, action_required: false, action_route: null },
  } }));
  await page.route("**/api/v1/clients/lead/me", route => route.fulfill({ json: { checkout: { amount: "1.01", is_paid: true, payment_method: "PIX", receipt_url: "https://example.com/receipt" } } }));
}

for (const status of ["awaiting_release", "fee_paid", "fee_scheduled"]) {
  test(`dock acompanha liberação do parceiro em ${status}`, async ({ page }) => {
    await stubEnrollment(page, status);
    await page.goto("/student/enrollment");
    await expect(page.getByRole("heading", { name: "Teu próximo passo é começar a estudar" })).toBeVisible();
    await expect(page.getByText("Responsável: Coordenadora de teste")).toBeVisible();
    await expect(page.getByText("Pagamento confirmado · R$ 1,01")).toBeVisible();
    await expect(page.getByRole("link", { name: "Conversar com o polo" })).toHaveCount(0);
    const dock = page.getByRole("navigation", { name: "Navegação principal do student" });
    await expect(dock.getByRole("link", { name: "Acompanhamento", exact: true })).toBeVisible();
    await expect(dock.getByRole("link")).toHaveCount(4);
    await expect(dock.getByRole("link", { name: "Meus documentos", exact: true })).toHaveAttribute("href", "/student/enrollment#documents");
    await expect(dock.getByRole("link", { name: "Falar com o polo", exact: true })).toHaveAttribute("href", "/student/enrollment#contact");
    await dock.getByRole("link", { name: "Pagamento", exact: true }).click();
    await expect(page).toHaveURL(/\/student\/enrollment#payment$/);
    await expect(dock.getByRole("link", { name: "Pagamento", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(dock.getByRole("link", { name: "Acompanhamento", exact: true })).not.toHaveAttribute("aria-current", "page");
    await expect(dock.getByText("Selfie", { exact: true })).toHaveCount(0);
  });
}

test("rota documental mantém wizard durante liberação", async ({ page }) => {
  await stubEnrollment(page, "fee_paid");
  await page.route("**/api/v1/clients/contract/current", route => route.fulfill({ json: { version: "fixture", hash: "fixture", text: "Contrato de teste." } }));
  await page.goto("/student/enrollment/selfie");
  const dock = page.getByRole("navigation", { name: "Navegação principal do student" });
  await expect(dock.getByRole("link", { name: /Selfie/ })).toBeVisible();
  await expect(dock.getByRole("link", { name: "Pagamento", exact: true })).toHaveCount(0);
});

test("animação respeita redução de movimento e atualização mantém conteúdo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await stubEnrollment(page, "awaiting_release");
  await page.goto("/student/enrollment");
  await expect(page.getByRole("heading", { name: "Teu próximo passo é começar a estudar" })).toBeVisible();
  expect(await page.locator(".release-art .key").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await page.route("**/api/v1/clients/enrollment/me", async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ json: { status: "awaiting_release", selfie_status: "review", release: { stage: "document_review", next_action: "O polo está conferindo sua identidade.", hub_name: "Polo responsável", coordinator_name: null, contact_url: null } } });
  });
  await page.getByRole("button", { name: "Verificar atualização" }).click();
  await expect(page.getByRole("heading", { name: "Teu próximo passo é começar a estudar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conferência da documentação" })).toBeVisible();
});
