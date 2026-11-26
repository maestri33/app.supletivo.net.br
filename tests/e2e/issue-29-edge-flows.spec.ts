import { test, expect, type Page } from "@playwright/test";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const TINY_PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");

async function signInStudent(page: Page, status: string, substatus: string | null = null) {
  await page.addInitScript(
    ({ status, substatus }) => {
      (window as unknown as { __TEST_TURNSTILE_TOKEN__?: string }).__TEST_TURNSTILE_TOKEN__ = "e2e-turnstile-ok";
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "student-jwt-fixture",
          refresh_token: "student-refresh-fixture",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: status },
          status,
          substatus,
        }),
      );
    },
    { status, substatus },
  );

  await page.route("**/api/v1/catalog/contact", (route) =>
    route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
  );
  await page.route("**/api/v1/catalog/pricing", (route) =>
    route.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null, anchor_full: "1615.00" } }),
  );
}

test.describe("Fluxos Críticos e Edge Cases Issue #29", () => {
  test("paywall trata 409 PROFILE_INCOMPLETE com missing_fields [cpf, email], envia ambos e segue ao checkout", async ({ page }) => {
    await signInStudent(page, "lead", "awaiting_cpf");
    let cpfSaved = false;
    let emailSaved = false;
    let checkoutCalls = 0;

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-lead-2",
          external_id: "u-lead-2",
          phone: "5543999991111",
          cpf: cpfSaved ? "09126367939" : "09126367939",
          email: emailSaved ? "maria.clara@example.test" : "pendente@example.test",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
        },
      }),
    );
    await page.route("**/api/v1/student/payment/current", (route) =>
      route.fulfill({ status: 404, json: { error: "none" } }),
    );
    await page.route("**/api/v1/checkout/create", (route) => {
      checkoutCalls += 1;
      if (checkoutCalls === 1) {
        return route.fulfill({
          status: 409,
          json: {
            error: "Complete seu CPF e e-mail antes de prosseguir para o pagamento.",
            code: "PROFILE_INCOMPLETE",
            missing_fields: ["cpf", "email"],
          },
        });
      }
      return route.fulfill({
        json: {
          payment_id: "pay-both-1",
          checkout_url: "https://pay.infinitepay.io/both-fixed",
          status: "pending",
        },
      });
    });

    let cpfPayload: Record<string, unknown> | null = null;
    await page.route("**/api/v1/auth/cpf/lookup", (route) => {
      cpfPayload = route.request().postDataJSON();
      cpfSaved = true;
      return route.fulfill({ json: { valid: true, cpf: "09126367939", name: "Maria Clara" } });
    });

    let emailPayload: Record<string, unknown> | null = null;
    await page.route("**/api/v1/users/me", (route) => {
      emailPayload = route.request().postDataJSON();
      emailSaved = true;
      return route.fulfill({ json: { success: true, email: "maria.clara@example.test", already_yours: false } });
    });
    await page.route("**/pay.infinitepay.io/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<h1>InfinitePay Mock</h1>" }),
    );

    await page.goto("/student/lead/checkout");
    await expect(page.getByText(/12x sem juros|12x de R\$\s*99\b|1\.188,00/i)).toHaveCount(0);

    await page.getByRole("button", { name: /Ir para pagamento seguro InfinitePay/i }).click();
    await expect(page.getByLabel("CPF do aluno")).toBeVisible();
    await expect(page.getByLabel("E-mail pessoal")).toBeVisible();

    await page.getByLabel("CPF do aluno").fill("09126367939");
    await page.getByLabel("E-mail pessoal").fill("maria.clara@example.test");
    await page.getByRole("button", { name: /Salvar dados e ir para pagamento/i }).click();

    await page.waitForURL("https://pay.infinitepay.io/both-fixed");
    expect(cpfPayload).toMatchObject({ cpf: "09126367939", turnstile_token: "e2e-turnstile-ok" });
    expect(emailPayload).toEqual({ email: "maria.clara@example.test" });
    expect(checkoutCalls).toBe(2);
  });

  test("retorno InfinitePay encaminha receipt_url em confirmCardPayment e faz polling quando paid=false", async ({ page }) => {
    await signInStudent(page, "lead", "checkout_created");
    let confirmed = false;

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-lead-3",
          external_id: "u-lead-3",
          phone: "5543999991112",
          cpf: "09126367939",
          email: "aluno@example.test",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: confirmed ? "pre_enrolled" : "lead" },
          status: confirmed ? "pre_enrolled" : "lead",
          substatus: confirmed ? "rg_pending" : "checkout_created",
        },
      }),
    );
    await page.route("**/api/v1/student/payment/current", (route) =>
      route.fulfill({ status: 404, json: { error: "none" } }),
    );

    let confirmPayload: Record<string, unknown> | null = null;
    await page.route("**/api/v1/student/payment/card-confirmation", (route) => {
      confirmPayload = route.request().postDataJSON();
      return route.fulfill({
        json: { success: true, paid: false, status: "pending", payment_id: "pay-poll-1", order_nsu: "ord-99" },
      });
    });

    await page.route("**/api/v1/checkout/status/pay-poll-1", (route) => {
      confirmed = true;
      return route.fulfill({ json: { payment_id: "pay-poll-1", paid: true, status: "paid" } });
    });

    await page.route("**/api/v1/enrollment/status", (route) =>
      route.fulfill({
        json: {
          student_role_id: "r1",
          current_status: "pre_enrolled",
          substatus: "rg_pending",
          step: 1,
          all_basic_docs_ready: false,
          checklist: { rg: { submitted: false, status: null } },
        },
      }),
    );
    await page.route("**/api/v1/enrollment/documents/rg", (route) =>
      route.fulfill({ json: { submitted: false, document: null, rg_section: {} } }),
    );

    await page.goto(
      "/student/lead/payment?order_nsu=ord-99&transaction_nsu=tx-88&slug=slg-77&receipt_url=https%3A%2F%2Fpay.infinitepay.io%2Freceipt%2F99",
    );
    await page.waitForURL(/\/student\/enrollment\/rg$/);
    expect(confirmPayload).toEqual({
      order_nsu: "ord-99",
      transaction_nsu: "tx-88",
      slug: "slg-77",
      receipt_url: "https://pay.infinitepay.io/receipt/99",
    });
  });

  test("RG veta PDF, usa seletor manual quando completeness=null e trava avanço quando rg_complete=false", async ({ page }) => {
    await signInStudent(page, "pre_enrolled", "rg_pending");

    let hasFront = false;
    let hasBack = false;
    let classifyCalls = 0;

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-rg",
          external_id: "u-rg",
          phone: "5543999991113",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "pre_enrolled" },
          status: "pre_enrolled",
          substatus: hasFront && hasBack ? "address_pending" : "rg_pending",
        },
      }),
    );

    await page.route("**/api/v1/enrollment/status", (route) =>
      route.fulfill({
        json: {
          student_role_id: "r1",
          current_status: "pre_enrolled",
          substatus: hasFront && hasBack ? "address_pending" : "rg_pending",
          step: hasFront && hasBack ? 2 : 1,
          all_basic_docs_ready: false,
          checklist: {
            rg: { submitted: hasFront && hasBack, status: hasFront && hasBack ? "approved" : null },
          },
        },
      }),
    );

    await page.route("**/api/v1/enrollment/documents/rg", (route) =>
      route.fulfill({
        json: {
          submitted: hasFront || hasBack,
          rg_section: {
            front_photo: hasFront ? "/v1/media/rg/f.png" : null,
            back_photo: hasBack ? "/v1/media/rg/b.png" : null,
            full_photo: null,
            next_slot: hasFront && hasBack ? null : hasFront ? "rg_back" : "rg_front",
            analysis_status: "pending",
          },
        },
      }),
    );

    await page.route("**/media/**", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: TINY_PNG }),
    );

    await page.route("**/api/v1/enrollment/documents/classify", (route) => {
      classifyCalls += 1;
      if (classifyCalls === 1) {
        return route.fulfill({
          json: {
            success: true,
            is_document: true,
            doc_type: "rg",
            is_legible: true,
            completeness: null,
          },
        });
      }
      return route.fulfill({
        json: {
          success: true,
          is_document: true,
          doc_type: "rg",
          is_legible: true,
          completeness: "back",
        },
      });
    });

    await page.route("**/api/v1/enrollment/documents/rg/photo/front", (route) => {
      hasFront = true;
      return route.fulfill({
        json: {
          slot: "front",
          stored: "enrollments/rg/f.png",
          rg_complete: false,
          next_slot: "rg_back",
          substatus: "rg_pending",
          analysis_status: "pending",
        },
      });
    });

    await page.route("**/api/v1/enrollment/documents/rg/photo/back", (route) => {
      hasBack = true;
      return route.fulfill({
        json: {
          slot: "back",
          stored: "enrollments/rg/b.png",
          rg_complete: true,
          next_slot: null,
          substatus: "address_pending",
          analysis_status: "approved",
        },
      });
    });

    await page.goto("/student/enrollment/rg");

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");

    // 1. Veto PDF
    await fileInput.setInputFiles({ name: "rg.pdf", mimeType: "application/pdf", buffer: TINY_PDF });
    await expect(page.getByText("Envie uma imagem JPG, PNG ou WebP legível.")).toBeVisible();
    expect(classifyCalls).toBe(0);

    // 2. Manual side confirmation when completeness=null -> front only -> stays on /rg
    await fileInput.setInputFiles({ name: "rg-lado1.png", mimeType: "image/png", buffer: TINY_PNG });
    await expect(page.getByText("Identificamos seu RG! Confirme com 1 toque qual lado está nessa foto:")).toBeVisible();
    await page.getByRole("button", { name: "É a Frente do RG" }).click();

    await expect(page.getByText("Frente recebida! Agora envie a foto do verso do RG.")).toBeVisible();
    await expect(page.getByText("Falta enviar o verso do RG.")).toBeVisible();
    await expect(page).toHaveURL(/\/student\/enrollment\/rg$/);

    // 3. Upload back -> rg_complete=true -> advances to /student/enrollment/address
    await fileInput.setInputFiles({ name: "rg-lado2.png", mimeType: "image/png", buffer: TINY_PNG });
    await page.waitForURL(/\/student\/enrollment\/address$/);
  });

  test("endereço envia direto sem /classify e kinship exige owner_name sem placeholders", async ({ page }) => {
    await signInStudent(page, "pre_enrolled", "address_pending");

    let substatus = "address_pending";
    let classifyCalls = 0;

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-addr",
          external_id: "u-addr",
          phone: "5543999991114",
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
          student_role_id: "r1",
          current_status: "pre_enrolled",
          substatus,
          step: substatus === "education_pending" ? 3 : 2,
          all_basic_docs_ready: false,
          checklist: {
            rg: { submitted: true, status: "approved" },
            proof_of_residence: { submitted: substatus !== "address_pending", status: substatus === "education_pending" ? "approved" : "pending" },
          },
        },
      }),
    );
    await page.route("**/api/v1/enrollment/documents/classify", (route) => {
      classifyCalls += 1;
      return route.fulfill({ status: 500, json: { error: "Should not call classify" } });
    });
    let addressUploads = 0;
    await page.route("**/api/v1/enrollment/address/proof", (route) => {
      addressUploads += 1;
      substatus = "needs_kinship";
      return route.fulfill({
        json: {
          id: "doc-addr-1",
          needs_kinship: true,
          substatus: "needs_kinship",
          extracted_data: { residentName: null, name_matched: false, street: "Rua das Flores", city: "Londrina", state: "PR" },
        },
      });
    });

    let kinshipBody: Record<string, unknown> | null = null;
    await page.route("**/api/v1/enrollment/address/proof/kinship", (route) => {
      kinshipBody = route.request().postDataJSON();
      substatus = "education_pending";
      return route.fulfill({ json: { success: true, substatus: "education_pending" } });
    });
    await page.route("**/api/v1/enrollment/education", (route) =>
      route.fulfill({ json: { submitted: false, data: null } }),
    );
    await page.route("**/localidades/estados**", (route) => route.fulfill({ json: [{ sigla: "PR", nome: "Paraná" }] }));

    await page.goto("/student/enrollment/address");
    await page.locator('input[type="file"]').setInputFiles({
      name: "conta-grande.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 0x20),
    });
    await expect(page.getByText("Escolha um arquivo de até 10 MB.")).toBeVisible();
    expect(addressUploads).toBe(0);

    await page.locator('input[type="file"]').setInputFiles({
      name: "conta-luz.pdf",
      mimeType: "application/pdf",
      buffer: TINY_PDF,
    });
    await expect.poll(() => addressUploads).toBe(1);

    expect(classifyCalls).toBe(0);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("#kinship-owner-name")).toHaveValue("");
    await expect(dialog.getByText(/Maria Silva|Titular não informado/i)).toHaveCount(0);

    await page.locator("#kinship-owner-name").fill("Ana Paula Souza");
    await page.locator("#kinship-relation").selectOption("mae");
    await page.getByRole("button", { name: "Confirmar vínculo" }).click();

    await page.waitForURL(/\/student\/enrollment\/education$/);
    expect(kinshipBody).toEqual({ relation: "mae", owner_name: "Ana Paula Souza" });
  });

  test("aluno ativo registra tipo sanguíneo, envia reservista PDF e baixa espelho corrigido com Bearer JWT", async ({ page }) => {
    await signInStudent(page, "enrolled", "eligible_for_exam");

    let bloodType: string | null = null;
    let milUploaded = false;

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-act",
          external_id: "u-act",
          phone: "5543999991115",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "enrolled",
          substatus: "eligible_for_exam",
        },
      }),
    );
    await page.route("**/api/v1/student/me", (route) =>
      route.fulfill({
        json: {
          user: { id: "u-act", phone: "5543999991115", cpf: "11144477735", name: "Carlos", full_name: "Carlos Lima", gender: "M", blood_type: bloodType },
          role: { id: "r-act", role: "client", status: "enrolled", substatus: "eligible_for_exam", paid_at: Date.now() },
          siga_credentials: null,
          document_progress: { blood_type_registered: Boolean(bloodType), military_exempt: false, academic_documents_ready: milUploaded, checklist: {} },
        },
      }),
    );
    await page.route("**/api/v1/student/documents", (route) =>
      route.fulfill({
        json: {
          documents: milUploaded
            ? [{ id: "d-mil", document_type: "military_certificate", status: "pending", file_key: "/v1/media/students/u-act/mil.pdf" }]
            : [],
          pending_requirements: milUploaded ? [] : ["military_certificate"],
        },
      }),
    );
    await page.route("**/api/v1/student/blood-type", (route) => {
      const body = route.request().postDataJSON() as { blood_type: string };
      bloodType = body.blood_type;
      return route.fulfill({ json: { success: true, blood_type: bloodType } });
    });
    await page.route("**/api/v1/student/documents/military_certificate", (route) => {
      milUploaded = true;
      return route.fulfill({ json: { success: true, status: "pending" } });
    });
    await page.route("**/api/v1/student/exams", (route) =>
      route.fulfill({
        json: {
          student_role_id: "r-act",
          current_status: "enrolled",
          eligibility: { exam_can_schedule: true, exam_available_at: "" },
          exams: [
            {
              id: "ex-act-1",
              subject: "Prova Geral EJA",
              attempt_number: 1,
              scheduled_at: "2026-11-20T14:00:00.000Z",
              result: "failed",
              notes: "Refazer redação",
              corrected_exam_file_key: "students/u-act/exams/ex-act-1-graded.pdf",
            },
          ],
        },
      }),
    );

    let examPdfAuth = "";
    await page.route("**/api/v1/student/exams/corrected-pdf?exam_id=ex-act-1", (route) => {
      examPdfAuth = route.request().headers().authorization ?? "";
      return route.fulfill({ status: 200, contentType: "application/pdf", body: TINY_PDF });
    });

    await page.goto("/student/active/documents");
    await expect(page.getByText(/Taxas da Instituição Parceira/i)).toHaveCount(0);

    await page.locator("select").selectOption("AB+");
    await page.getByRole("button", { name: "Salvar tipo sanguíneo" }).click();
    await expect(page.getByText("Tipo sanguíneo AB+ salvo com sucesso.")).toBeVisible();

    const milInput = page.locator('label:has-text("Enviar reservista") input[type="file"]');
    await milInput.setInputFiles({ name: "reservista.pdf", mimeType: "application/pdf", buffer: TINY_PDF });
    await expect(page.getByText("Comprovante militar enviado para conferência da secretaria.")).toBeVisible();

    await page.goto("/student/active/assessments");
    await page.getByRole("button", { name: "Baixar prova corrigida (PDF)" }).click();
    await expect.poll(() => examPdfAuth).toBe("Bearer student-jwt-fixture");
  });

  test("concluinte baixa histórico (transcript) e prova corrigida via fetch autenticado", async ({ page }) => {
    await signInStudent(page, "graduated", "graduated");

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-vet",
          external_id: "u-vet",
          phone: "5543999991116",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "graduated" },
          status: "graduated",
        },
      }),
    );
    await page.route("**/api/v1/student/me", (route) =>
      route.fulfill({
        json: {
          user: { id: "u-vet", phone: "5543999991116", cpf: "11144477735", name: "Beatriz", full_name: "Beatriz Nogueira", gender: "F", blood_type: "B+" },
          role: { id: "r-vet", role: "client", status: "graduated", substatus: null, paid_at: Date.now() },
          siga_credentials: null,
          document_progress: { blood_type_registered: true, military_exempt: true, academic_documents_ready: true, checklist: {} },
        },
      }),
    );
    await page.route("**/api/v1/student/diploma", (route) =>
      route.fulfill({
        json: {
          status: "graduated",
          message: "Certificados liberados.",
          registration: { registration_number: null, process_number: null, gazette_publication_date: null, issued_at: Date.now() },
          documents: {
            diploma_download_url: "/api/v1/student/diploma/file?type=diploma",
            transcript_download_url: "/api/v1/student/diploma/file?type=transcript",
          },
          pickup: null,
        },
      }),
    );
    await page.route("**/api/v1/student/exams", (route) =>
      route.fulfill({
        json: {
          eligibility: { exam_can_schedule: false, exam_available_at: "" },
          exams: [
            {
              id: "ex-vet-1",
              subject: "Prova Geral EJA",
              attempt_number: 1,
              scheduled_at: "2026-10-10T14:00:00.000Z",
              result: "passed",
              corrected_exam_file_key: "students/u-vet/exams/ex-vet-1-graded.pdf",
            },
          ],
        },
      }),
    );

    const authCalls: string[] = [];
    await page.route("**/api/v1/student/diploma/file?type=transcript", (route) => {
      authCalls.push(`transcript:${route.request().headers().authorization ?? ""}`);
      return route.fulfill({ status: 200, contentType: "application/pdf", body: TINY_PDF });
    });
    await page.route("**/api/v1/student/exams/corrected-pdf?exam_id=ex-vet-1", (route) => {
      authCalls.push(`exam:${route.request().headers().authorization ?? ""}`);
      return route.fulfill({ status: 200, contentType: "application/pdf", body: TINY_PDF });
    });

    await page.goto("/student/veteran/diploma");
    await page.getByRole("button", { name: "Baixar Histórico Escolar (PDF)" }).click();
    await expect.poll(() => authCalls).toContain("transcript:Bearer student-jwt-fixture");

    await page.goto("/student/veteran/assessments");
    await page.getByRole("button", { name: "Baixar prova corrigida" }).click();
    await expect.poll(() => authCalls).toContain("exam:Bearer student-jwt-fixture");
  });

  test("GET /auth/confirm-link redireciona 302 preservando token para /v1/auth/confirm-link", async ({ request }) => {
    const res = await request.get("/auth/confirm-link?token=magic-tok-29", { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    expect(res.headers()["cache-control"]).toBe("no-store");
    const location = res.headers().location ?? "";
    expect(location).toMatch(/\/v1\/auth\/confirm-link\?token=magic-tok-29$/);
  });

  test("RG parcial com checklist.rg.submitted=true e status=pending mantém aviso de verso e bloqueia avanço", async ({ page }) => {
    await signInStudent(page, "pre_enrolled", "rg_pending");

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-rg-partial",
          external_id: "u-rg-partial",
          phone: "5543999991119",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "pre_enrolled" },
          status: "pre_enrolled",
          substatus: "rg_pending",
        },
      }),
    );

    await page.route("**/api/v1/enrollment/status", (route) =>
      route.fulfill({
        json: {
          student_role_id: "r1",
          current_status: "pre_enrolled",
          substatus: "rg_pending",
          step: 1,
          all_basic_docs_ready: false,
          checklist: {
            rg: { submitted: true, status: "pending" },
          },
        },
      }),
    );

    await page.route("**/api/v1/enrollment/documents/rg", (route) =>
      route.fulfill({
        json: {
          submitted: true,
          rg_section: {
            front_photo: "/v1/media/rg/f.png",
            back_photo: null,
            full_photo: null,
            next_slot: "rg_back",
            analysis_status: "pending",
          },
        },
      }),
    );

    await page.route("**/media/**", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: TINY_PNG }),
    );

    await page.goto("/student/enrollment/rg");
    await expect(page.getByText("Falta enviar o verso do RG.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Avançar para comprovante de endereço" })).toHaveCount(0);
  });

  test("OtpVerification: erro OTP_INVALID e clique em 'Digitar Novamente' limpa dígitos e foca sem TypeError", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.route("**/api/v1/auth/otp/verify", (route) =>
      route.fulfill({
        status: 401,
        json: { error: "Código incorreto", code: "OTP_INVALID" },
      }),
    );

    await page.goto("/autenticacao/otp?id=u-otp-invalid&tel=11987654321");
    await expect(page.locator("#otp-0")).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("contact-recovery-trigger")).toHaveAttribute("data-hydrated", "true");
    for (let i = 0; i < 6; i += 1) {
      await page.locator(`#otp-${i}`).fill(String(i + 1));
    }

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Código Incorreto");

    await dialog.getByRole("button", { name: "Digitar Novamente" }).click();
    await expect(dialog).toHaveCount(0);

    for (let i = 0; i < 6; i += 1) {
      await expect(page.locator(`#otp-${i}`)).toHaveValue("");
    }
    await expect(page.locator("#otp-0")).toBeFocused();
    expect(pageErrors).toEqual([]);
  });

  test("StudentActiveView: /student/active/dashboard preserva phone/externalId em supletivo.session e atualiza status/substatus em supletivo.login", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "supletivo.session",
        JSON.stringify({ phone: "5543996648750", externalId: "ext-keep-0028", cpf: "11144477735" }),
      );
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "student-jwt-fixture",
          refresh_token: "student-refresh-fixture",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "lead",
          substatus: "stale_substatus",
        }),
      );
    });

    await page.route("**/api/v1/catalog/contact", (route) =>
      route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
    );
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "ext-keep-0028",
          external_id: "ext-keep-0028",
          phone: "5543996648750",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "enrolled",
          substatus: "siga_active",
        },
      }),
    );
    await page.route("**/api/v1/student/me", (route) =>
      route.fulfill({
        json: {
          user: { id: "ext-keep-0028", phone: "5543996648750", cpf: "11144477735", name: "Mariana", full_name: "Mariana Lima", gender: "F", blood_type: "A+" },
          role: { id: "r-act-1", role: "client", status: "enrolled", substatus: "siga_active", paid_at: Date.now() },
          siga_credentials: { username: "mariana.siga", password: null, url: "https://siga.example.test" },
          document_progress: { blood_type_registered: true, military_exempt: true, academic_documents_ready: true, checklist: {} },
        },
      }),
    );
    await page.route("**/api/v1/student/documents", (route) =>
      route.fulfill({ json: { documents: [], pending_requirements: [] } }),
    );
    await page.route("**/api/v1/student/exams", (route) =>
      route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
    );

    await page.goto("/student/active/dashboard");
    await expect(page.getByRole("heading", { name: /Painel do aluno — Mariana/i })).toBeVisible();
    await expect(page.getByText("Usuário: mariana.siga")).toBeVisible();

    const stored = await page.evaluate(() => ({
      session: JSON.parse(localStorage.getItem("supletivo.session") || "null"),
      login: JSON.parse(localStorage.getItem("supletivo.login") || "null"),
    }));

    expect(stored.session).toMatchObject({
      phone: "5543996648750",
      externalId: "ext-keep-0028",
    });
    expect(stored.login).toMatchObject({
      status: "enrolled",
      substatus: "siga_active",
    });
  });

  test("StudentLockedPaywall: abertura com ?from=infinitepay&order_nsu=... sem transaction_nsu/slug dispara polling automático", async ({ page }) => {
    await signInStudent(page, "lead", "checkout_created");
    let confirmed = false;
    let pollCalls = 0;

    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-auto-poll",
          external_id: "u-auto-poll",
          phone: "5543999991122",
          cpf: "09126367939",
          email: "poll@example.test",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: confirmed ? "pre_enrolled" : "lead" },
          status: confirmed ? "pre_enrolled" : "lead",
          substatus: confirmed ? "rg_pending" : "checkout_created",
        },
      }),
    );
    await page.route("**/api/v1/student/payment/current", (route) =>
      route.fulfill({
        json: {
          payment_attempt_id: "pay-auto-poll-1",
          status: "pending",
          checkout_url: "https://pay.infinitepay.io/auto-poll-1",
        },
      }),
    );
    await page.route("**/api/v1/checkout/status/pay-auto-poll-1", (route) => {
      pollCalls += 1;
      if (pollCalls >= 2) {
        confirmed = true;
        return route.fulfill({ json: { payment_id: "pay-auto-poll-1", paid: true, status: "paid" } });
      }
      return route.fulfill({ json: { payment_id: "pay-auto-poll-1", paid: false, status: "pending" } });
    });
    await page.route("**/api/v1/enrollment/status", (route) =>
      route.fulfill({
        json: {
          student_role_id: "r-auto",
          current_status: "pre_enrolled",
          substatus: "rg_pending",
          step: 1,
          all_basic_docs_ready: false,
          checklist: { rg: { submitted: false, status: null } },
        },
      }),
    );
    await page.route("**/api/v1/enrollment/documents/rg", (route) =>
      route.fulfill({ json: { submitted: false, document: null, rg_section: {} } }),
    );

    await page.goto("/student/lead/checkout?from=infinitepay&order_nsu=ord-auto-1");
    await expect(page.getByText("Verificando confirmação do seu pagamento na InfinitePay...")).toBeVisible();
    await expect.poll(() => pollCalls, { timeout: 10000 }).toBeGreaterThanOrEqual(2);
    await page.waitForURL(/\/student\/enrollment\/rg$/);
  });

  test("Contraste dark-glass em runtime: títulos, parágrafos e labels sobre .aurora-wrap / Card não ficam escuros sobre fundo escuro", async ({ page }) => {
    const assertDarkGlassContrast = async (routeLabel: string) => {
      const violations = await page.evaluate((label) => {
        const parseRgba = (raw: string): [number, number, number, number] | null => {
          const m = raw.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/i);
          if (!m) return null;
          return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1];
        };
        const luminance = (r: number, g: number, b: number) => {
          const toLin = (c: number) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
        };

        const issues: string[] = [];
        const nodes = Array.from(document.querySelectorAll("main h1, main h2, main h3, main p, main label"));
        for (const el of nodes) {
          const style = getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 1 || rect.height <= 1) continue;
          if (el.classList.contains("sr-only")) continue;

          let bgRgba: [number, number, number, number] = [6, 22, 58, 1]; // .aurora-wrap dark base
          let curr: HTMLElement | null = el as HTMLElement;
          while (curr && curr !== document.body) {
            const parsed = parseRgba(getComputedStyle(curr).backgroundColor);
            if (parsed && parsed[3] > 0.15) {
              bgRgba = parsed;
              break;
            }
            curr = curr.parentElement;
          }

          const bgLum = luminance(bgRgba[0], bgRgba[1], bgRgba[2]);
          const fg = parseRgba(style.color);
          if (!fg) continue;
          const fgLum = luminance(fg[0], fg[1], fg[2]);

          // Sobre fundo escuro (aurora / dark-glass Card), texto não pode ser rgb(11, 18, 32) nem escuro
          if (bgLum < 0.25 && (style.color === "rgb(11, 18, 32)" || fgLum < 0.18)) {
            issues.push(
              `[${label}] <${el.tagName.toLowerCase()}> "${(el.textContent || "").trim().slice(0, 40)}" color=${style.color} (lum=${fgLum.toFixed(3)}) over bg=rgba(${bgRgba.join(",")})`,
            );
          }
        }
        return issues;
      }, routeLabel);

      expect(violations, `Contraste inválido em ${routeLabel}`).toEqual([]);
    };

    // 1. Login raiz /
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Acesse sua conta");
    await assertDarkGlassContrast("/");

    // 2. OTP
    await page.goto("/autenticacao/otp?id=u-contrast&tel=11987654321");
    await expect(page.locator("h1")).toHaveText("Digite seu código");
    await assertDarkGlassContrast("/autenticacao/otp");

    // 3. Checkout
    await page.route("**/api/v1/catalog/contact", (route) =>
      route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
    );
    await page.route("**/api/v1/catalog/pricing", (route) =>
      route.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null, anchor_full: "1615.00" } }),
    );
    await page.evaluate(() => {
      (window as unknown as { __TEST_TURNSTILE_TOKEN__?: string }).__TEST_TURNSTILE_TOKEN__ = "e2e-turnstile-ok";
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "student-jwt-fixture",
          refresh_token: "student-refresh-fixture",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
          substatus: "awaiting_cpf",
        }),
      );
    });
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-contrast-lead",
          external_id: "u-contrast-lead",
          phone: "5543999991100",
          cpf: "09126367939",
          email: "contrast@example.test",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "lead" },
          status: "lead",
        },
      }),
    );
    await page.route("**/api/v1/student/payment/current", (route) =>
      route.fulfill({ status: 404, json: { error: "none" } }),
    );
    await page.goto("/student/lead/checkout");
    await expect(page.getByRole("heading", { name: "Finalize sua matrícula na EJA" })).toBeVisible();
    await assertDarkGlassContrast("/student/lead/checkout");

    // 4. Student Active Dashboard
    await page.evaluate(() => {
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "student-jwt-fixture",
          refresh_token: "student-refresh-fixture",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "enrolled",
          substatus: "siga_active",
        }),
      );
    });
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "u-contrast-act",
          external_id: "u-contrast-act",
          phone: "5543999991101",
          roles: ["client"],
          active_role: "client",
          role_statuses: { client: "enrolled" },
          status: "enrolled",
          substatus: "siga_active",
        },
      }),
    );
    await page.route("**/api/v1/student/me", (route) =>
      route.fulfill({
        json: {
          user: { id: "u-contrast-act", phone: "5543999991101", cpf: "11144477735", name: "Lucas", full_name: "Lucas Alves", gender: "M", blood_type: "O+" },
          role: { id: "r-act", role: "client", status: "enrolled", substatus: "siga_active", paid_at: Date.now() },
          siga_credentials: null,
          document_progress: { blood_type_registered: true, military_exempt: true, academic_documents_ready: true, checklist: {} },
        },
      }),
    );
    await page.route("**/api/v1/student/documents", (route) =>
      route.fulfill({ json: { documents: [], pending_requirements: [] } }),
    );
    await page.route("**/api/v1/student/exams", (route) =>
      route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
    );
    await page.goto("/student/active/dashboard");
    await expect(page.getByRole("heading", { name: /Painel do aluno — Lucas/i })).toBeVisible();
    await expect(page.getByText("Documentação completa")).toBeVisible();
    await assertDarkGlassContrast("/student/active/dashboard");

    // 5. Admin Dashboard
    await page.evaluate(() => {
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "admin-jwt-fixture",
          refresh_token: "admin-refresh-fixture",
          roles: ["admin"],
          active_role: "admin",
          role_statuses: { admin: "active" },
          status: "active",
        }),
      );
    });
    await page.route("**/api/v1/auth/whoami", (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          id: "adm-contrast",
          external_id: "adm-contrast",
          phone: "5543996648750",
          roles: ["admin"],
          active_role: "admin",
          role_statuses: { admin: "active" },
          status: "active",
        },
      }),
    );
    await page.route("**/api/v1/admin/**", (route) =>
      route.fulfill({
        json: {
          items: [],
          students: [],
          total: 0,
          page: 1,
          limit: 15,
          total_pages: 1,
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
    await expect(page.getByRole("heading", { name: "Resumo Financeiro (InfinitePay)" })).toBeVisible();
    await assertDarkGlassContrast("/admin/dashboard");
  });
});
