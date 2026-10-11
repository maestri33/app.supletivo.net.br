import { test, expect, type Page } from "@playwright/test";

const enrollment = {
  external_id: "enrollment-fixture", hub_external_id: "hub-fixture",
  status: "education", selfie_verified: false, selfie_status: "pending",
  rg: { analysis_status: "approved", missing_fields: [] },
  address_complete: true, address_proof: { exists: true, status: "approved" },
  education: null, selfie: null,
};

async function signIn(page: Page, roles: string[], statuses: Record<string, string>) {
  await page.addInitScript(() => {
    localStorage.setItem("supletivo.login", JSON.stringify({ access_token: "fixture-access", refresh_token: "fixture-refresh" }));
    localStorage.setItem("supletivo.session", JSON.stringify({ phone: "11900000000", externalId: "user-fixture" }));
  });
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: "user-fixture", roles, role_statuses: statuses, name: "Aluno de teste",
  } }));
}

test("matrícula segue a escolaridade do backend mesmo com RG e endereço aprovados", async ({ page }) => {
  await signIn(page, ["enrollment"], { student: "enrollment" });
  await page.route("**/api/v1/clients/enrollment/me", route => route.fulfill({ json: enrollment }));
  await page.goto("/student/enrollment");
  await expect(page).toHaveURL(/\/student\/enrollment\/education$/);
  await expect(page.getByRole("heading", { name: "Onde você parou de estudar?" })).toBeVisible();
  await expect(page.getByText(/100% Homologada|matrícula está autorizada/i)).toHaveCount(0);
});

test("escolaridade envia escolhas reais e segue a etapa devolvida", async ({ page }) => {
  let current = { ...enrollment };
  let posted: Record<string, unknown> | null = null;
  await signIn(page, ["enrollment"], { student: "enrollment" });
  await page.route("**/api/v1/clients/enrollment/me", route => route.fulfill({ json: current }));
  await page.route("**/api/v1/clients/enrollment/education", async route => {
    posted = route.request().postDataJSON();
    current = { ...current, status: "selfie" };
    await route.fulfill({ json: current });
  });
  await page.route("**/api/v1/clients/contract/current", route => route.fulfill({ json: { version: "fixture-version", hash: "fixture-hash", text: "Contrato de matrícula de teste." } }));
  await page.goto("/student/enrollment/education");
  await page.getByRole("button", { name: "Ensino Médio", exact: true }).click();
  await page.getByRole("button", { name: "2º ano", exact: true }).click();
  await page.getByRole("button", { name: "Não terminei o ano", exact: true }).click();
  await page.getByLabel("Estado da escola").selectOption("PR");
  await page.getByLabel("Cidade da escola").fill("Curitiba");
  await page.getByRole("button", { name: "Salvar escolaridade" }).click();
  await expect(page).toHaveURL(/\/student\/enrollment\/selfie$/);
  expect(posted).toMatchObject({ level: "medio", grade: 2, completed: false, state: "PR", city: "Curitiba" });
});

test("selfie exibe contrato vigente, exige ciência e espera liberação do polo", async ({ page }) => {
  let current: Record<string, unknown> = { ...enrollment, status: "selfie" };
  let uploaded = false;
  await signIn(page, ["enrollment"], { student: "enrollment" });
  await page.route("**/api/v1/clients/enrollment/me", route => route.fulfill({ json: current }));
  await page.route("**/api/v1/clients/contract/current", route => route.fulfill({ json: { version: "fixture-version", hash: "fixture-hash", text: "Contrato vigente fornecido pelo servidor." } }));
  await page.route("**/api/v1/clients/enrollment/selfie", async route => {
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
    uploaded = true;
    current = { ...current, status: "awaiting_release", selfie_verified: true, selfie_status: "approved", selfie: { exists: true, analysis_status: "approved", verified: true }, poll_after_ms: 1 };
    await route.fulfill({ json: current });
  });
  await page.goto("/student/enrollment/selfie");
  await expect(page.getByText("Contrato vigente fornecido pelo servidor.")).toBeVisible();
  await expect(page.getByLabel("Enviar selfie")).toBeDisabled();
  await page.getByLabel("Li o contrato e autorizo a assinatura com minha selfie").check();
  await page.getByLabel("Enviar selfie").setInputFiles({ name: "selfie.png", mimeType: "image/png", buffer: Buffer.from("fixture-image") });
  await expect(page.getByRole("heading", { name: "Aguardando liberação do polo" })).toBeVisible();
  expect(uploaded).toBe(true);
  await expect(page).toHaveURL(/\/student\/enrollment$/);
  await expect(page.getByText(/100% Homologada|matrícula está autorizada/i)).toHaveCount(0);
});

test("falha no envio da selfie continua recuperável e não confirma matrícula", async ({ page }) => {
  await signIn(page, ["enrollment"], { student: "enrollment" });
  await page.route("**/api/v1/clients/enrollment/me", route => route.fulfill({ json: { ...enrollment, status: "selfie" } }));
  await page.route("**/api/v1/clients/contract/current", route => route.fulfill({ json: { version: "fixture-version", hash: "fixture-hash", text: "Contrato de teste." } }));
  await page.route("**/api/v1/clients/enrollment/selfie", route => route.fulfill({ status: 422, json: { detail: "Envie uma imagem legível." } }));
  await page.goto("/student/enrollment/selfie");
  await page.getByLabel("Li o contrato e autorizo a assinatura com minha selfie").check();
  await page.getByLabel("Enviar selfie").setInputFiles({ name: "selfie.png", mimeType: "image/png", buffer: Buffer.from("fixture-image") });
  await expect(page.getByRole("alert")).toContainText("Envie uma imagem legível.");
  await expect(page.getByLabel("Enviar selfie")).toBeEnabled();
  await expect(page).toHaveURL(/\/selfie$/);
});

test("painel usa o parceiro e pendências reais, sem inventar aprendizagem", async ({ page }) => {
  await signIn(page, ["student"], { student: "active" });
  await page.route("**/api/v1/clients/student/me", route => route.fulfill({ json: {
    external_id: "student-fixture", status: "documents_under_review", blood_type: "O+",
    platform: { url: "https://partner.example/ava", login: "student-login", password: "fixture-password", notes: "Orientação fornecida pelo polo." },
    documents: [{ doc_type: "transcript", validation_status: "review", analysis_status: "review", has_photo: true }],
    pendencies: [{ external_id: "pendency-fixture", kind: "document", description: "Apresentar documento original no polo", resolved: false }], diploma: null,
  } }));
  await page.goto("/student/active/dashboard");
  await expect(page.getByRole("link", { name: "Acessar ambiente do parceiro" })).toHaveAttribute("href", "https://partner.example/ava");
  await expect(page.getByText("student-login", { exact: true })).toBeVisible();
  await expect(page.getByText("fixture-password", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.getByText("fixture-password", { exact: true })).toBeVisible();
  await expect(page.getByText("Apresentar documento original no polo")).toBeVisible();
  await expect(page.getByText(/45%|5 \/ 11|Nota: 9\.5|Módulo 3\/4/)).toHaveCount(0);
});

test("upload de documento usa doc_type real e mostra análise do servidor", async ({ page }) => {
  let document = { doc_type: "blood_type", validation_status: "rejected", analysis_status: "rejected", has_photo: true, analysis_reason: "Envie novamente." };
  let uploaded = false;
  await signIn(page, ["student"], { student: "active" });
  await page.route("**/api/v1/clients/student/me", route => route.fulfill({ json: {
    external_id: "student-fixture", status: "awaiting_documents", platform: {}, documents: [document], blood_type: "O+", pendencies: [], diploma: null,
  } }));
  await page.route("**/api/v1/clients/student/documents/blood_type", async route => {
    uploaded = true;
    document = { ...document, validation_status: "review", analysis_status: "review", analysis_reason: "Conferência do polo." };
    await route.fulfill({ json: { doc_type: "blood_type", stored: true, analysis_status: "review", poll_after_ms: 1, expires_at: null } });
  });
  await page.goto("/student/active/documents");
  await page.getByLabel("Enviar comprovante de tipo sanguíneo").setInputFiles({ name: "blood.png", mimeType: "image/png", buffer: Buffer.from("fixture-image") });
  await expect(page.getByText("Conferência do polo.")).toBeVisible();
  expect(uploaded).toBe(true);
  await expect(page.getByText("Documento aprovado", { exact: true })).toHaveCount(0);
});

test("prova só agenda quando liberada e transmite matéria e data reais", async ({ page }) => {
  let status = "exam_released";
  let posted: Record<string, unknown> | null = null;
  await signIn(page, ["student"], { student: "active" });
  const data = () => ({ external_id: "student-fixture", status, platform: {}, documents: [], blood_type: "O+", pendencies: [], diploma: null });
  await page.route("**/api/v1/clients/student/me", route => route.fulfill({ json: data() }));
  await page.route("**/api/v1/clients/student/exam/schedule", async route => {
    posted = route.request().postDataJSON(); status = "exam_scheduled";
    await route.fulfill({ json: data() });
  });
  await page.goto("/student/active/assessments");
  await page.getByLabel("Matéria da prova").fill("Matéria informada pelo polo");
  await page.getByLabel("Data e hora combinadas com o polo").fill("2026-11-10T14:00");
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByTestId("student-status")).toContainText("Prova agendada");
  expect(posted?.subject).toBe("Matéria informada pelo polo");
  expect(String(posted?.scheduled_at)).toMatch(/^2026-11-10T/);
  await expect(page.getByRole("button", { name: "Confirmar agendamento" })).toHaveCount(0);
});

test("veterano baixa arquivos reais e omite links inseguros", async ({ page }) => {
  await signIn(page, ["student", "veteran"], { student: "veteran", veteran: "veteran" });
  await page.route("**/api/v1/clients/veteran/me", route => route.fulfill({ json: {
    external_id: "student-fixture", status: "veteran", user: { external_id: "user-fixture", name: "Aluno de teste", cpf: null, phone: null, email: null },
    documents: [], enrollment: null, diploma: { issued_at: "2026-09-01T14:00:00Z", picked_up_at: "2026-09-10T14:00:00Z", diploma_file: "diploma/fixture.pdf", transcript_file: "javascript:alert(1)", pickup_photo: null }, platform: { url: "javascript:alert(1)" },
  } }));
  await page.goto("/student/veteran/diploma");
  await expect(page.getByRole("link", { name: "Baixar diploma" })).toHaveAttribute("href", "/media/diploma/fixture.pdf");
  await expect(page.getByRole("link", { name: "Baixar histórico escolar" })).toHaveCount(0);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.getByText(/BR-MEC|DOE-PR|ICP-Brasil|GDAE/)).toHaveCount(0);
});
