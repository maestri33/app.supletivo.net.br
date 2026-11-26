import { test, expect, type Page } from "@playwright/test";

test.use({
  permissions: ["camera"],
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

function stubIbge(page: Page) {
  return page.route("**/localidades/estados**", (route) => {
    const url = route.request().url();
    if (url.includes("/municipios")) return route.fulfill({ json: [{ nome: "Curitiba" }] });
    return route.fulfill({ json: [{ sigla: "PR", nome: "Paraná" }] });
  });
}

async function signIn(page: Page, status: string, substatus: string | null = null) {
  await page.addInitScript(
    ({ status, substatus }) => {
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "fixture-access",
          refresh_token: "fixture-refresh",
          roles: ["client"],
          role_statuses: { client: status },
          status,
          substatus,
        }),
      );
      localStorage.setItem(
        "supletivo.session",
        JSON.stringify({ phone: "5511900000000", externalId: "user-fixture" }),
      );
    },
    { status, substatus },
  );
  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "user-fixture",
        external_id: "user-fixture",
        phone: "5511900000000",
        name: "Aluno de teste",
        roles: ["client"],
        active_role: "client",
        role_statuses: { client: status },
        status,
        substatus,
      },
    }),
  );
  await page.route("**/api/v1/catalog/contact", (route) =>
    route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
  );
}

test("central de matrícula aponta próxima etapa education_pending", async ({ page }) => {
  await signIn(page, "pre_enrolled", "education_pending");
  await page.route("**/api/v1/enrollment/status", (route) =>
    route.fulfill({
      json: {
        student_role_id: "r1",
        current_status: "pre_enrolled",
        substatus: "education_pending",
        step: 3,
        all_basic_docs_ready: false,
        checklist: {
          rg: { submitted: true, status: "approved", needs_manual_review: 0 },
          proof_of_residence: { submitted: true, status: "approved", needs_manual_review: 0 },
          education_level: { submitted: false, status: "pending", needs_manual_review: 0 },
          contract_signature: { submitted: false, status: "pending", needs_manual_review: 0 },
          selfie: { submitted: false, status: "pending", needs_manual_review: 0 },
        },
      },
    }),
  );
  await page.route("**/api/v1/enrollment/documents/rg", (route) =>
    route.fulfill({ json: { rg_section: { rg_complete: true, status: "approved" } } }),
  );
  await page.route("**/api/v1/student/payment/current", (route) =>
    route.fulfill({ status: 404, json: { error: "none" } }),
  );

  await page.goto("/student/enrollment");
  await expect(page.getByRole("heading", { name: "Central de documentos da matrícula" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continuar envio" })).toHaveAttribute(
    "href",
    "/student/enrollment/education",
  );
});

test("escolaridade permite escola opcional e avança para contrato/selfie", async ({ page }) => {
  let substatus = "education_pending";
  let posted: Record<string, unknown> | null = null;

  await signIn(page, "pre_enrolled", "education_pending");
  await page.route("**/api/v1/enrollment/status", (route) =>
    route.fulfill({
      json: {
        student_role_id: "r1",
        current_status: "pre_enrolled",
        substatus,
        step: substatus === "selfie_pending" ? 4 : 3,
        all_basic_docs_ready: false,
        checklist: {},
      },
    }),
  );
  await page.route("**/api/v1/enrollment/education", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ json: { submitted: false, data: null } });
    }
    posted = route.request().postDataJSON();
    substatus = "selfie_pending";
    return route.fulfill({ json: { saved: true, next_step: "selfie_pending" } });
  });
  await page.route("**/api/v1/contract/current", (route) =>
    route.fulfill({ json: { version: "v2", hash: "fixture-hash", text: "Contrato de matrícula de teste." } }),
  );
  await stubIbge(page);

  await page.goto("/student/enrollment/education");
  await page.locator("#edu-level").selectOption("medio");
  await page.locator("#edu-grade").selectOption("2");
  await page.locator("#edu-uf").selectOption("PR");
  await page.locator("#edu-city").selectOption("Curitiba");
  await page.getByLabel(/Declaro que as informações/i).check();
  await page.getByRole("button", { name: "Salvar escolaridade e continuar" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Concordo e confirmo" }).click();

  await expect(page).toHaveURL(/\/student\/enrollment\/selfie$/);
  expect(posted).toMatchObject({
    level: "medio",
    grade: 2,
    completed: false,
    state: "PR",
    city: "Curitiba",
    declaration_accepted: true,
  });
  expect(posted?.last_school).toBeUndefined();
});

test("selfie assina contrato antes do upload e segue para /student/enrollment", async ({ page }) => {
  let substatus = "selfie_pending";
  let signed = false;
  let uploaded = false;

  await signIn(page, "pre_enrolled", "selfie_pending");
  await page.route("**/api/v1/enrollment/status", (route) =>
    route.fulfill({
      json: {
        student_role_id: "r1",
        current_status: "pre_enrolled",
        substatus,
        step: substatus === "pending_siga" ? 6 : 4,
        all_basic_docs_ready: substatus === "pending_siga",
        checklist: {
          rg: { submitted: true, status: "approved", needs_manual_review: 0 },
          proof_of_residence: { submitted: true, status: "approved", needs_manual_review: 0 },
          education_level: { submitted: true, status: "approved", needs_manual_review: 0 },
          contract_signature: { submitted: signed, status: signed ? "approved" : "pending", needs_manual_review: 0 },
          selfie: { submitted: uploaded, status: uploaded ? "approved" : "pending", needs_manual_review: 0 },
        },
      },
    }),
  );
  await page.route("**/api/v1/enrollment/documents/rg", (route) =>
    route.fulfill({ json: { rg_section: { rg_complete: true, status: "approved" } } }),
  );
  await page.route("**/api/v1/student/payment/current", (route) =>
    route.fulfill({ status: 404, json: { error: "none" } }),
  );
  await page.route("**/api/v1/contract/current", (route) =>
    route.fulfill({
      json: { version: "v2", hash: "fixture-hash", text: "Contrato vigente fornecido pelo servidor." },
    }),
  );
  await page.route("**/api/v1/student/contract/sign", async (route) => {
    signed = true;
    await route.fulfill({ json: { signed: true, contract_hash: "fixture-hash" } });
  });
  await page.route("**/api/v1/enrollment/selfie", async (route) => {
    expect(signed).toBe(true);
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
    uploaded = true;
    substatus = "pending_siga";
    await route.fulfill({ json: { uploaded: true, status: "approved", substatus: "pending_siga" } });
  });

  await page.goto("/student/enrollment/selfie");
  await expect(page.getByText("Contrato vigente fornecido pelo servidor.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir câmera para selfie" })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Abrir câmera para selfie" }).click();
  await expect(page.getByLabel("Prévia da câmera para selfie")).toBeVisible();
  await page.getByRole("button", { name: "Fotografar e enviar selfie" }).click();

  await expect(page).toHaveURL(/\/student\/enrollment$/);
  await expect(page.getByText("Documentação inicial concluída")).toBeVisible();
  expect(uploaded).toBe(true);
});

test("painel de acesso SIGA exibe login e alterna exibição da senha", async ({ page }) => {
  await signIn(page, "enrolled", "active");
  await page.route("**/api/v1/student/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "u1", phone: "5511900000000", cpf: "11144477735", name: "Aluno Ativo", full_name: "Aluno Ativo", gender: "M", blood_type: "O+" },
        role: { id: "r1", role: "client", status: "enrolled", substatus: "active", paid_at: Date.now() },
        siga_credentials: { username: "student-login", password: "fixture-password", url: "https://siga.supletivo.net.br" },
        document_progress: { blood_type_registered: true, military_exempt: false, academic_documents_ready: true, checklist: {} },
      },
    }),
  );
  await page.route("**/api/v1/student/documents", (route) =>
    route.fulfill({ json: { documents: [], pending_requirements: [] } }),
  );
  await page.route("**/api/v1/student/exams", (route) =>
    route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
  );

  await page.goto("/student/active/access");
  await expect(page.getByRole("link", { name: "Acessar portal de estudos (SIGA)" })).toHaveAttribute(
    "href",
    /^https:\/\/siga\.supletivo\.net\.br\/?$/,
  );
  await expect(page.getByText("student-login", { exact: true })).toBeVisible();
  await expect(page.getByText("fixture-password", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mostrar" }).click();
  await expect(page.getByText("fixture-password", { exact: true })).toBeVisible();
});

test("upload de documento pós-SIGA envia school_records", async ({ page }) => {
  let doc = { id: "d1", document_type: "school_records", status: "rejected", rejection_reason: "Envie novamente." };
  let uploaded = false;

  await signIn(page, "enrolled", "pending_post_siga_docs");
  await page.route("**/api/v1/student/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "u1", phone: "5511900000000", cpf: "11144477735", name: "Aluno Ativo", full_name: "Aluno Ativo", gender: "M", blood_type: "O+" },
        role: { id: "r1", role: "client", status: "enrolled", substatus: "pending_post_siga_docs", paid_at: Date.now() },
        siga_credentials: { username: "11144477735", url: "https://siga.supletivo.net.br" },
        document_progress: { blood_type_registered: true, military_exempt: false, academic_documents_ready: false, checklist: {} },
      },
    }),
  );
  await page.route("**/api/v1/student/documents", (route) =>
    route.fulfill({ json: { documents: [doc], pending_requirements: ["school_records"] } }),
  );
  await page.route("**/api/v1/student/exams", (route) =>
    route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
  );
  await page.route("**/api/v1/student/documents/school_records", async (route) => {
    uploaded = true;
    doc = { id: "d1", document_type: "school_records", status: "pending", rejection_reason: "" };
    await route.fulfill({ json: { uploaded: true, status: "pending" } });
  });

  await page.goto("/student/active/documents");
  const validImage = await page.screenshot({ type: "png" });
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "historico.png",
    mimeType: "image/png",
    buffer: validImage,
  });

  await expect(page.getByText("Histórico escolar enviado para conferência da secretaria.")).toBeVisible();
  expect(uploaded).toBe(true);
});

test("prova agenda apenas quando elegível e transmite matéria e data", async ({ page }) => {
  let scheduled = false;
  let posted: Record<string, unknown> | null = null;

  await signIn(page, "enrolled", "active");
  await page.route("**/api/v1/student/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "u1", phone: "5511900000000", cpf: "11144477735", name: "Aluno Ativo", full_name: "Aluno Ativo", gender: "M", blood_type: "O+" },
        role: { id: "r1", role: "client", status: scheduled ? "exam_scheduled" : "enrolled", substatus: null, paid_at: Date.now() },
        siga_credentials: null,
        document_progress: { blood_type_registered: true, military_exempt: false, academic_documents_ready: true, checklist: {} },
      },
    }),
  );
  await page.route("**/api/v1/student/documents", (route) =>
    route.fulfill({ json: { documents: [], pending_requirements: [] } }),
  );
  await page.route("**/api/v1/student/exams", (route) =>
    route.fulfill({
      json: {
        student_role_id: "r1",
        current_status: scheduled ? "exam_scheduled" : "enrolled",
        eligibility: { exam_can_schedule: !scheduled, exam_available_at: "" },
        exams: scheduled
          ? [{ id: "ex-1", subject: "Matemática", attempt_number: 1, scheduled_at: "2026-11-10T14:00:00.000Z", result: "pending" }]
          : [],
      },
    }),
  );
  await page.route("**/api/v1/student/exams/schedule", async (route) => {
    posted = route.request().postDataJSON();
    scheduled = true;
    await route.fulfill({ json: { id: "ex-1", scheduled: true } });
  });

  await page.goto("/student/active/assessments");
  await page.locator("#exam-subject").selectOption("Matemática");
  await page.locator("#exam-dt").fill("2026-11-10T14:00");
  await page.getByRole("button", { name: "Agendar prova" }).click();

  await expect(page.getByText("Agendamento registrado!")).toBeVisible();
  expect(posted?.subject).toBe("Matemática");
  expect(String(posted?.scheduled_at)).toMatch(/^2026-11-10T/);
});

test("concluinte baixa diploma via fetch autenticado sem expor href direto", async ({ page }) => {
  await signIn(page, "graduated", "graduated");
  await page.route("**/api/v1/student/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "u1", phone: "5511900000000", cpf: "11144477735", name: "Aluno Concluinte", full_name: "Aluno Concluinte", gender: "M", blood_type: "O+" },
        role: { id: "r1", role: "client", status: "graduated", substatus: null, paid_at: Date.now() },
        siga_credentials: null,
        document_progress: { blood_type_registered: true, military_exempt: true, academic_documents_ready: true, checklist: {} },
      },
    }),
  );
  await page.route("**/api/v1/student/diploma", (route) =>
    route.fulfill({
      json: {
        status: "graduated",
        message: "Diploma disponível para download.",
        registration: { registration_number: "REG-2026-01", process_number: "PROC-01", gazette_publication_date: "2026-09-01", issued_at: "2026-09-05" },
        documents: { diploma_download_url: "/api/v1/student/diploma/file?type=diploma", transcript_download_url: null },
        pickup: null,
      },
    }),
  );
  await page.route("**/api/v1/student/exams", (route) =>
    route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
  );

  let diplomaAuth = "";
  await page.route("**/api/v1/student/diploma/file?type=diploma", (route) => {
    diplomaAuth = route.request().headers().authorization ?? "";
    return route.fulfill({ status: 200, contentType: "application/pdf", body: Buffer.from("%PDF-1.4\n") });
  });

  await page.goto("/student/veteran/diploma");
  await expect(page.getByRole("button", { name: "Baixar Diploma (PDF)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Baixar Histórico Escolar (PDF)" })).toHaveCount(0);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Baixar Diploma (PDF)" }).click();
  await expect.poll(() => diplomaAuth).toBe("Bearer fixture-access");
});
