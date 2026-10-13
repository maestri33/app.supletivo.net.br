import { test, expect, type Page } from "@playwright/test";

const userId = "33333333-3333-4333-8333-333333333333";
const materialId = "44444444-4444-4444-8444-444444444444";

async function authenticate(page: Page, roles: string[]) {
  await page.addInitScript(({ roles, userId }) => {
    localStorage.setItem("supletivo.login", JSON.stringify({
      access_token: "test-token", refresh_token: "test-refresh", roles,
    }));
    localStorage.setItem("supletivo.session", JSON.stringify({
      phone: "11999999999", externalId: userId,
    }));
  }, { roles, userId });
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles, name: "Maria Silva",
    role_statuses: { promoter: roles.includes("candidate") ? "candidate" : "training" },
  } }));
}

const readyCandidate = {
  external_id: userId, hub_external_id: userId, status: "documents",
  ref_url: `https://supletivo.net.br/?ref=${userId}`,
  pix_validated: false, selfie_verified: false,
  profile: { name: "Maria Silva", education_level: null },
  address: { zipcode: "84010000", street: "Rua Brasil", number: "10", neighborhood: "Centro", city: "Ponta Grossa", state: "PR", missing_fields: [] },
  address_proof: { exists: true, status: "approved", needs_kinship: false },
  documents: { external_id: userId, rg: { number: "1234", full_photo: "documents/rg.jpg", validation_status: "approved" } },
  selfie: { exists: false }, blocks: [],
};

const readyDocument = { doc_type: "rg", number: "1234", full_photo: "documents/rg.jpg", analysis_status: "approved", validation_status: "approved", missing_fields: [], next_slot: null, photos: { rg_full: { status: "approved" } } };

function stubIbge(page: Page) {
  return page.route("**/localidades/estados**", route => {
    const url = route.request().url();
    if (url.includes("/municipios")) return route.fulfill({ json: [{ nome: "Curitiba" }] });
    return route.fulfill({ json: [{ sigla: "PR", nome: "Paraná" }] });
  });
}

test("candidate keeps PIX editable after rejection and sends the real key contract", async ({ page }) => {
  await authenticate(page, ["candidate"]);
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: readyCandidate }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: readyDocument }));
  let payload: unknown;
  await page.route("**/api/v1/collaborators/candidate/pix", route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 422, json: { detail: "Chave Pix inválida ou não é do titular." } });
  });
  await page.goto("/promoter/candidate");
  await page.getByLabel("Chave PIX", { exact: true }).fill("12345678909");
  await page.getByRole("button", { name: "Salvar e Continuar" }).click();
  await expect(page.getByRole("alert")).toContainText("Chave Pix inválida");
  await expect(page.getByLabel("Chave PIX", { exact: true })).toHaveValue("12345678909");
  await expect(page.getByRole("link", { name: /Treinamento Obrigatório/ })).toHaveCount(0);
  expect(payload).toEqual({ key: "12345678909", key_type: "CPF" });
});

test("canonical candidate gets a referral link immediately and stays in registration", async ({ page }) => {
  await authenticate(page, ["promoter"]);
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles: ["promoter"], role_statuses: { promoter: "candidate" }, name: "Maria Silva",
  } }));
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: readyCandidate }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: readyDocument }));
  await page.goto("/promoter/candidate");
  const dock = page.getByRole("navigation", { name: "Navegação principal do promoter" });
  await expect(dock.getByRole("link", { name: /1\. RG ou CNH/ })).toHaveAttribute("href", "#documents");
  await expect(dock.getByRole("link", { name: /2\. Endereço/ })).toHaveAttribute("href", "#address");
  await expect(dock.getByRole("link", { name: /3\. Escolaridade/ })).toHaveAttribute("href", "#education");
  await expect(page.getByRole("textbox", { name: "Seu link de indicação" })).toHaveCount(0);
  await page.getByRole("link", { name: "Comece a indicar", exact: true }).click();
  await expect(page).toHaveURL(/#referral$/);
  await expect(page.getByRole("heading", { name: "Você já pode indicar" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Seu link de indicação" })).toHaveValue(readyCandidate.ref_url);
  await dock.getByRole("link", { name: /2\. Endereço/ }).click();
  await expect(page.getByRole("heading", { name: "Comprovante de residência" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Seu link de indicação" })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("candidate blocks a wrong document in the browser before the authoritative upload", async ({ page }) => {
  await authenticate(page, ["candidate"]);
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles: ["candidate"], role_statuses: { promoter: "candidate" }, name: "Maria Silva",
  } }));
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: {
    ...readyCandidate, status: "documents", address_proof: { exists: false, status: null },
  } }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: {
    doc_type: "rg", analysis_status: null, validation_status: null, next_slot: "rg_front", photos: {}, missing_fields: ["number"],
  } }));
  let uploadCalled = false;
  await page.route("**/api/v1/collaborators/candidate/documents/classify", route => route.fulfill({ json: {
    is_document: true, is_legible: true, doc_type: "address_proof", completeness: "full", confidence: 0.99,
  } }));
  await page.route("**/api/v1/collaborators/candidate/documents/photo/**", route => {
    uploadCalled = true;
    return route.fulfill({ json: { stored: true, analysis_status: "pending", poll_after_ms: 500 } });
  });
  await page.goto("/promoter/candidate");
  const dock = page.getByRole("navigation", { name: "Navegação principal do promoter" });
  await expect(dock.getByRole("link", { name: /2\. Endereço/ })).toHaveAttribute("aria-disabled", "true");
  await expect(dock.getByRole("link", { name: /4\. Selfie/ })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: /Envie seu RG ou CNH/ }).click();
  await expect(page.getByRole("dialog", { name: "Como quer enviar o documento?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.locator("#candidate-document").setInputFiles({ name: "conta.png", mimeType: "image/png", buffer: Buffer.from("valid-image-fixture") });
  await expect(page.getByRole("alert")).toContainText("parece ser um comprovante de residência");
  expect(uploadCalled).toBe(false);
});

test("candidate keeps a document pending until the backend returns a terminal verdict", async ({ page }) => {
  await authenticate(page, ["candidate"]);
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles: ["candidate"], role_statuses: { promoter: "candidate" }, name: "Maria Silva",
  } }));
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: {
    ...readyCandidate, status: "documents", address_proof: { exists: false, status: null },
  } }));
  let documentReads = 0;
  await page.route("**/api/v1/collaborators/candidate/document", route => {
    documentReads += 1;
    return route.fulfill({ json: documentReads < 2
      ? { doc_type: "rg", analysis_status: null, validation_status: null, next_slot: "rg_front", photos: {}, missing_fields: ["number"] }
      : documentReads === 2 ? { doc_type: "rg", front_photo: "documents/rg.png", analysis_status: "pending", validation_status: "pending", next_slot: null, photos: { rg_front: { status: "pending" } }, missing_fields: ["number"] }
      : { doc_type: "rg", analysis_status: "rejected", validation_status: "rejected", analysis_reason: "Envie uma foto mais nítida.", next_slot: "rg_front", photos: { rg_front: { status: "rejected" } }, missing_fields: ["number"] } });
  });
  await page.route("**/api/v1/collaborators/candidate/documents/classify", route => route.fulfill({ json: {
    is_document: true, is_legible: true, doc_type: "rg", completeness: "front", confidence: 0.99,
  } }));
  await page.route("**/api/v1/collaborators/candidate/documents/photo/**", route => route.fulfill({ json: { stored: "documents/rg.png", analysis_status: "pending", poll_after_ms: 5 } }));
  await page.goto("/promoter/candidate");
  await page.locator("#candidate-document").setInputFiles({ name: "rg.png", mimeType: "image/png", buffer: Buffer.from("valid-image-fixture") });
  await expect(page.getByText("Envie uma foto mais nítida.")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Aprovado")).toHaveCount(0);
});

test("candidate submits the last attended and completed school grade", async ({ page }) => {
  await authenticate(page, ["candidate"]);
  let candidate = { ...readyCandidate, status: "pix", pix_validated: true };
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: candidate }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: readyDocument }));
  await page.route("**/api/v1/collaborators/contract/current", route => route.fulfill({ json: { text: "Offline contract", version: "test" } }));
  await stubIbge(page);
  let payload: unknown;
  await page.route("**/api/v1/collaborators/candidate/education", route => {
    payload = route.request().postDataJSON();
    candidate = { ...candidate, status: "education" };
    return route.fulfill({ json: candidate });
  });
  await page.goto("/promoter/candidate");
  await page.getByLabel("Qual foi a última série ou ano cursado?").selectOption("2");
  await page.getByLabel("Você concluiu essa série ou ano?").selectOption("no");
  await page.getByLabel("Qual foi a última série concluída?").selectOption("1");
  await page.getByRole("button", { name: "Continuar para assinatura" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Termo de adesão e selfie" })).toBeVisible();
  expect(payload).toEqual({ level: "medio", completed: false, grade: 2, last_completed_grade: 1, education_status: "stopped", year: null, declaration_accepted: true });
  await expect(page.getByRole("button", { name: "Abrir câmera para selfie" })).toBeDisabled();
});

test("promotor pode declarar Superior completo e envia a declaração", async ({ page }) => {
  await authenticate(page, ["candidate"]);
  let candidate = { ...readyCandidate, status: "pix", pix_validated: true };
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: candidate }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: readyDocument }));
  await page.route("**/api/v1/collaborators/contract/current", route => route.fulfill({ json: { text: "Offline contract", version: "test" } }));
  await stubIbge(page);
  let payload: Record<string, unknown> | null = null;
  await page.route("**/api/v1/collaborators/candidate/education", async route => {
    payload = route.request().postDataJSON();
    candidate = { ...candidate, status: "education" };
    await route.fulfill({ json: candidate });
  });
  await page.goto("/promoter/candidate");
  await page.getByLabel("Qual o seu nível de ensino?").selectOption("superior");
  await page.getByLabel("Formação", { exact: true }).selectOption("graduacao");
  await page.getByLabel("Estado onde estudou (opcional)").selectOption("PR");
  await page.getByLabel("Cidade onde estudou (opcional)").fill("Curitiba");
  await page.getByLabel("Você concluiu essa formação?").selectOption("yes");
  await page.getByRole("button", { name: "Continuar para assinatura" }).click();
  await page.getByRole("dialog").getByRole("checkbox").check();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar e continuar" }).click();
  await expect(page.getByRole("heading", { name: "Termo de adesão e selfie" })).toBeVisible();
  expect(payload).toMatchObject({ level: "superior", completed: true, qualification: "graduacao", state: "PR", city: "Curitiba", declaration_accepted: true });
});

test("active promoter has actual share actions and a documents navigation entry", async ({ page }) => {
  await authenticate(page, ["promoter"]);
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: { external_id: userId, roles: ["promoter"], role_statuses: { promoter: "active" }, name: "Maria Silva" } }));
  const ref = `https://supletivo.net.br/?ref=${userId}`;
  await page.route("**/api/v1/collaborators/promoter/me", route => route.fulfill({ json: { external_id: userId, status: "active", name: "Maria Silva", locked: false, ref_url: ref, pending_materials: [], payout_locked: false } }));
  await page.route("**/api/v1/collaborators/promoter/summary", route => route.fulfill({ json: { week_paid_leads: 0, lifetime: { total_students: 0 } } }));
  await page.route("**/api/v1/collaborators/promoter/leads", route => route.fulfill({ json: [] }));
  await page.route("**/api/v1/collaborators/promoter/commissions", route => route.fulfill({ json: [] }));
  await page.goto("/promoter/active");
  await expect(page.getByRole("link", { name: "WhatsApp", exact: true })).toHaveAttribute("href", `https://wa.me/?text=${encodeURIComponent(`Conheça o Supletivo Brasil pelo meu link: ${ref}`)}`);
  await expect(page.getByRole("link", { name: "Facebook", exact: true })).toHaveAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ref)}`);
  await expect(page.getByRole("button", { name: "Instagram", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Documentos/ })).toHaveAttribute("href", "/promoter/active/documents");
});

test("promoter documents download includes authentication rather than a public media link", async ({ page }) => {
  await authenticate(page, ["promoter"]);
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: { external_id: userId, roles: ["promoter"], role_statuses: { promoter: "active" } } }));
  await page.route("**/api/v1/collaborators/promoter/me", route => route.fulfill({ json: { status: "active", locked: false, pending_materials: [] } }));
  await page.route("**/api/v1/collaborators/promoter/documents", route => route.fulfill({ json: { documents: [{ kind: "rg_full", name: "RG — completo", path: "documents/private-rg.png", status: "approved" }] } }));
  let authorization = "";
  await page.route("**/media/documents/private-rg.png", route => {
    authorization = route.request().headers()["authorization"];
    return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64") });
  });
  await page.goto("/promoter/active/documents");
  await page.getByRole("button", { name: "Abrir RG — completo" }).click();
  await expect.poll(() => authorization).toBe("Bearer test-token");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("training renders assigned backend material and keeps the submission pending after an API error", async ({ page }) => {
  await authenticate(page, ["promoter", "training"]);
  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles: ["promoter", "training"], name: "Maria Silva",
    role_statuses: { promoter: "training" },
  } }));
  await page.route("**/api/v1/collaborators/promoter/me", route => route.fulfill({ json: {
    external_id: userId, status: "active", locked: true, pending_materials: [{ material_external_id: materialId }],
  } }));
  await page.route("**/api/v1/collaborators/training/materials", route => route.fulfill({ json: [{
    material_external_id: materialId, title: "Ética no atendimento", blocking: true, kind: "fixed",
    assignment_status: "pending", submission_status: "not_started", text_content: "Conteúdo real da matéria.",
    question: "Como você atende com transparência?", content_blocks: [], video: null, photo: null,
  }] }));
  let posted = false;
  await page.route("**/api/v1/collaborators/training/submissions", route => {
    posted = true;
    return route.fulfill({ status: 422, json: { detail: "Esta matéria não está atribuída a você." } });
  });
  await page.goto("/promoter/training");
  await expect(page.getByText("Conteúdo real da matéria.")).toBeVisible();
  await page.locator("#training-answer").fill("Explico os requisitos e custos sem prometer resultado.");
  await page.getByRole("button", { name: "Submeter resposta" }).click();
  await expect(page.getByRole("alert")).toContainText("Esta matéria não está atribuída");
  await expect(page.getByText("Matéria aprovada pelo backend.")).toHaveCount(0);
  expect(posted).toBe(true);
});
