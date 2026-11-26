import { test, expect, type Page } from "@playwright/test";

async function stubPreEnrolledPendingSiga(page: Page, substatus = "pending_siga") {
  await page.addInitScript(() => {
    localStorage.setItem(
      "supletivo.login",
      JSON.stringify({
        access_token: "fixture-access",
        refresh_token: "fixture-refresh",
        roles: ["client"],
        role_statuses: { client: "pre_enrolled" },
      }),
    );
  });

  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "release-user",
        external_id: "release-user",
        phone: "5511999999999",
        name: "Aluno de teste",
        roles: ["client"],
        active_role: "client",
        role_statuses: { client: "pre_enrolled" },
        status: "pre_enrolled",
        substatus,
      },
    }),
  );

  await page.route("**/api/v1/enrollment/status", (route) =>
    route.fulfill({
      json: {
        student_role_id: "role-1",
        current_status: "pre_enrolled",
        substatus,
        step: 6,
        message: "Documentação completa! Aguardando emissão de acesso ao SIGA.",
        all_basic_docs_ready: true,
        checklist: {
          rg: { submitted: true, status: "approved", needs_manual_review: 0 },
          proof_of_residence: { submitted: true, status: "approved", needs_manual_review: 0 },
          education_level: { submitted: true, status: "approved", needs_manual_review: 0 },
          contract_signature: { submitted: true, status: "approved", needs_manual_review: 0 },
          selfie: { submitted: true, status: "approved", needs_manual_review: 0 },
        },
      },
    }),
  );

  await page.route("**/api/v1/enrollment/documents/rg", (route) =>
    route.fulfill({
      json: {
        rg_section: { rg_complete: true, status: "approved", front_photo: "f.jpg", back_photo: "b.jpg" },
      },
    }),
  );

  await page.route("**/api/v1/student/payment/current", (route) =>
    route.fulfill({
      json: {
        payment_attempt_id: "pay-1",
        amount: "999.00",
        status: "paid",
        paid_at: Date.now(),
        receipt_url: "https://pay.infinitepay.io/receipt/demo",
      },
    }),
  );

  await page.route("**/api/v1/catalog/contact", (route) =>
    route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
  );
}

test("dock acompanha status pending_siga na central de matrícula", async ({ page }) => {
  await stubPreEnrolledPendingSiga(page, "pending_siga");
  await page.goto("/student/enrollment");

  await expect(page.getByRole("heading", { name: "Central de documentos da matrícula" })).toBeVisible();
  await expect(page.getByText("Documentação inicial concluída")).toBeVisible();
  await expect(page.getByText(/Taxa de matrícula:\s*999\.00/)).toBeVisible();

  const dock = page.getByRole("navigation", { name: "Navegação principal do student" });
  await expect(dock.getByRole("link", { name: "Acompanhamento", exact: true })).toBeVisible();
  await expect(dock.getByRole("link")).toHaveCount(4);
  await expect(dock.getByRole("link", { name: "Meus documentos", exact: true })).toHaveAttribute(
    "href",
    "/student/enrollment#documents",
  );
  await expect(dock.getByRole("link", { name: "Atendimento", exact: true })).toHaveAttribute(
    "href",
    "/student/enrollment#contact",
  );

  await dock.getByRole("link", { name: "Pagamento", exact: true }).click();
  await expect(page).toHaveURL(/\/student\/enrollment#payment$/);
  await expect(dock.getByRole("link", { name: "Pagamento", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(dock.getByRole("link", { name: "Acompanhamento", exact: true })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(dock.getByText("Selfie", { exact: true })).toHaveCount(0);
});

test("rota documental /selfie mantém wizard durante pending_siga", async ({ page }) => {
  await stubPreEnrolledPendingSiga(page, "pending_siga");
  await page.route("**/api/v1/student/contract", (route) =>
    route.fulfill({ json: { version: "v2", hash: "fixture-hash", text: "Contrato de teste." } }),
  );

  await page.goto("/student/enrollment/selfie");
  const dock = page.getByRole("navigation", { name: "Navegação principal do student" });
  await expect(dock.getByRole("link", { name: /Selfie/ })).toBeVisible();
  await expect(dock.getByRole("link", { name: "Pagamento", exact: true })).toHaveCount(0);
});
