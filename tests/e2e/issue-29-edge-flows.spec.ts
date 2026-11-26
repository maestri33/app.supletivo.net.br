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
    await page.route("**/api/v1/enrollment/address/proof", (route) => {
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
      name: "conta-luz.pdf",
      mimeType: "application/pdf",
      buffer: TINY_PDF,
    });

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
});
