import { test, expect, type Page } from "@playwright/test";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const TINY_PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");

async function signInAs(
  page: Page,
  roles: Array<"client" | "admin">,
  roleStatuses: Record<string, string>,
  activeRole: "client" | "admin" = roles.includes("admin") ? "admin" : "client",
) {
  const token = roles.includes("admin") ? "admin-jwt-fixture" : "client-jwt-fixture";
  await page.addInitScript(
    ({ token, roles, roleStatuses, activeRole }) => {
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: token,
          refresh_token: "fixture-refresh",
          roles,
          active_role: activeRole,
          role_statuses: roleStatuses,
          status: roleStatuses[activeRole] ?? roleStatuses.client ?? "active",
        }),
      );
    },
    { token, roles, roleStatuses, activeRole },
  );

  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "user-1",
        external_id: "user-1",
        phone: "5511999999999",
        name: activeRole === "admin" ? "Admin Teste" : "Aluno Teste",
        roles,
        active_role: activeRole,
        role_statuses: roleStatuses,
        status: roleStatuses[activeRole] ?? roleStatuses.client ?? "active",
        substatus: null,
      },
    }),
  );
}

test.describe("Módulo Administrativo Unificado (/admin/*)", () => {
  test("GET /admin redireciona 302 para /admin/dashboard", async ({ request }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    expect(res.headers().location).toBe("/admin/dashboard");
  });

  test("usuário com role exclusiva client é bloqueado em /admin/* e redirecionado para rota do aluno", async ({ page }) => {
    await signInAs(page, ["client"], { client: "enrolled" }, "client");
    await page.route("**/api/v1/student/me", (route) =>
      route.fulfill({
        json: {
          user: { id: "u1", phone: "5511999999999", cpf: "11144477735", name: "Aluno", full_name: "Aluno", gender: "M", blood_type: "O+" },
          role: { id: "r1", role: "client", status: "enrolled", substatus: "siga_active", paid_at: Date.now() },
          siga_credentials: null,
          document_progress: { blood_type_registered: true, military_exempt: false, academic_documents_ready: false, checklist: {} },
        },
      }),
    );
    await page.route("**/api/v1/student/documents", (route) => route.fulfill({ json: { documents: [], pending_requirements: [] } }));
    await page.route("**/api/v1/student/exams", (route) =>
      route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
    );
    await page.route("**/api/v1/catalog/contact", (route) =>
      route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
    );

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/student\/active\/dashboard$/);
  });

  test("usuário com roles client e admin exibe RoleTabsHeader interno sem sair do domínio", async ({ page }) => {
    await signInAs(page, ["client", "admin"], { client: "enrolled", admin: "active" }, "admin");
    await page.route("**/api/v1/admin/**", (route) =>
      route.fulfill({
        json: {
          success: true,
          total: 0,
          page: 1,
          limit: 15,
          total_pages: 1,
          items: [],
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
    const roleNav = page.getByRole("navigation", { name: "Seleção de Perfil" });
    await expect(roleNav).toBeVisible();
    await expect(roleNav.getByRole("button", { name: /Aluno/i })).toBeVisible();
    await expect(roleNav.getByRole("button", { name: /Administrador/i })).toBeVisible();
  });

  test("/admin/dashboard filtra alunos, abre ficha com mídia privada e executa reconsultas/estorno", async ({ page }) => {
    await signInAs(page, ["admin"], { admin: "active" });

    const mediaAuthHeaders: string[] = [];
    await page.route("**/media/**", (route) => {
      mediaAuthHeaders.push(route.request().headers().authorization ?? "");
      return route.fulfill({ status: 200, contentType: "image/png", body: TINY_PNG });
    });

    const summaryUrls: string[] = [];
    await page.route("**/api/v1/admin/payments/summary**", (route) => {
      summaryUrls.push(route.request().url());
      return route.fulfill({
        json: {
          success: true,
          metrics: {
            total_revenue_cents: 199800,
            total_revenue: "R$ 1.998,00",
            total_paid_count: 2,
            total_pending_count: 1,
            total_failed_count: 0,
            total_refunded_count: 0,
            total_refunded_cents: 0,
            total_refunded_amount: "R$ 0,00",
          },
        },
      });
    });

    const studentListUrls: string[] = [];
    await page.route("**/api/v1/admin/students?**", (route) => {
      studentListUrls.push(route.request().url());
      return route.fulfill({
        json: {
          success: true,
          total: 1,
          page: 1,
          limit: 15,
          total_pages: 1,
          items: [
            {
              role_id: "role-std-1",
              user_id: "usr-std-1",
              name: "Maria",
              full_name: "Maria Oliveira",
              cpf: "11144477735",
              phone: "5543999990001",
              email: "maria@example.test",
              gender: "F",
              blood_type: "A+",
              status: "pre_enrolled",
              substatus: "pending_siga",
              paid_at: Date.now(),
              pending_docs_count: 1,
              has_siga: false,
              created_at: Date.now(),
              updated_at: Date.now(),
            },
          ],
        },
      });
    });

    let paymentStatus = "pending";
    await page.route("**/api/v1/admin/payments?**", (route) =>
      route.fulfill({
        json: {
          success: true,
          total: 1,
          page: 1,
          limit: 15,
          total_pages: 1,
          items: [
            {
              id: "pay-adm-1",
              user_id: "usr-std-1",
              student_name: "Maria Oliveira",
              student_phone: "5543999990001",
              amount: "R$ 999,00",
              status: paymentStatus,
              created_at: Date.now(),
            },
          ],
        },
      }),
    );

    await page.route("**/api/v1/admin/students/role-std-1", (route) =>
      route.fulfill({
        json: {
          success: true,
          student: {
            user: {
              id: "usr-std-1",
              phone: "5543999990001",
              cpf: "11144477735",
              email: "maria@example.test",
              name: "Maria",
              full_name: "Maria Oliveira",
              birth_date: "1995-04-10",
              gender: "F",
              blood_type: "A+",
            },
            role: { id: "role-std-1", role: "client", status: "pre_enrolled", substatus: "pending_siga", paid_at: Date.now(), created_at: Date.now(), updated_at: Date.now() },
            payment_attempts: [],
            documents: [
              { id: "doc-1", doc_type: "rg", status: "approved", file_url: "/v1/media/enrollments/rg/maria.png", r2_key: "enrollments/rg/maria.png" },
            ],
            siga_credentials: null,
            student_exams: [],
            student_diplomas: null,
            partner_fees: [],
          },
        },
      }),
    );

    await page.route("**/api/v1/admin/payments/pay-adm-1/recheck", (route) => {
      paymentStatus = "paid";
      return route.fulfill({ json: { success: true, status: "paid", message: "Pagamento confirmado na InfinitePay." } });
    });

    let refundPayload: Record<string, unknown> | null = null;
    await page.route("**/api/v1/admin/payments/pay-adm-1/mark-refunded", (route) => {
      refundPayload = route.request().postDataJSON();
      paymentStatus = "refunded";
      return route.fulfill({ json: { success: true, status: "refunded", message: "Estorno registrado com sucesso." } });
    });

    await page.goto("/admin/dashboard");
    await expect(page.getByText("R$ 1.998,00")).toBeVisible();
    await expect(page.getByText("Maria Oliveira").first()).toBeVisible();

    const dashboardStatusValues = await page
      .locator("select")
      .nth(1)
      .locator("option")
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
    expect(dashboardStatusValues).toEqual([
      "",
      "lead",
      "payment_pending",
      "pre_enrolled",
      "enrolled",
      "exam_scheduled",
      "awaiting_pickup",
      "graduated",
      "cancelled",
    ]);

    await page.getByPlaceholder("Buscar por nome, CPF ou telefone").fill("Maria");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect.poll(() => studentListUrls.some((u) => u.includes("search=Maria"))).toBe(true);

    await page.getByRole("button", { name: "Abrir ficha" }).click();
    const detailDialog = page.getByRole("dialog");
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.locator("img[src^='blob:']")).toHaveCount(1);
    expect(mediaAuthHeaders[0]).toBe("Bearer admin-jwt-fixture");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Reconsultar" }).click();
    await expect(page.getByText("Pagamento confirmado na InfinitePay.")).toBeVisible();

    await page.getByRole("button", { name: "Registrar estorno" }).click();
    await page.locator("#refund-reason").fill("Desistência formal do aluno");
    await page.getByRole("button", { name: "Confirmar estorno" }).click();
    await expect(page.getByText("Estorno registrado com sucesso.")).toBeVisible();
    expect(refundPayload).toEqual({
      refund_reason: "Desistência formal do aluno",
      refund_action: "revert_to_pending",
    });
  });

  test("/admin/documentos (MED-01) usa blob: com Bearer JWT nas duas abas, aprova e reprova com motivo", async ({ page }) => {
    await signInAs(page, ["admin"], { admin: "active" });

    const mediaAuthHeaders: string[] = [];
    await page.route("**/media/**", (route) => {
      mediaAuthHeaders.push(route.request().headers().authorization ?? "");
      return route.fulfill({ status: 200, contentType: "image/png", body: TINY_PNG });
    });

    let initialDocs = [
      {
        id: "doc-init-1",
        student_role_id: "r1",
        student_name: "Lucas Inicial",
        student_cpf: "11144477735",
        student_phone: "5543999990002",
        document_type: "proof_of_residence",
        file_url: "/v1/media/enrollments/addr/lucas.png",
        status: "review",
        ai_confidence: 0.65,
        ai_readable: true,
        ai_extracted_data: {},
        divergences: ["Nome divergente"],
        fast_ok_eligible: false,
        submitted_at: Date.now(),
      },
    ];
    let academicStudents = [
      {
        student_role_id: "r2",
        user_id: "u2",
        student_name: "Carla Pós-SIGA",
        cpf: "22255588811",
        phone: "5543999990003",
        gender: "F",
        blood_type: "O+",
        current_status: "enrolled",
        submitted_at: Date.now(),
        pending_documents: [
          {
            doc_id: "acad-doc-1",
            document_type: "school_records",
            file_url_temporary: "/v1/media/students/u2/historico.png",
            status: "pending",
            submitted_at: Date.now(),
          },
        ],
      },
    ];

    await page.route("**/api/v1/admin/documents/review-desk", (route) =>
      route.fulfill({ json: { success: true, total: initialDocs.length, documents: initialDocs } }),
    );
    await page.route("**/api/v1/admin/student-documents/pending", (route) =>
      route.fulfill({ json: { total_students: academicStudents.length, students: academicStudents } }),
    );

    let rejectedInitialBody: Record<string, unknown> | null = null;
    await page.route("**/api/v1/admin/documents/doc-init-1/reject", (route) => {
      rejectedInitialBody = route.request().postDataJSON();
      initialDocs = [];
      return route.fulfill({ json: { success: true } });
    });

    let approvedAcademic = false;
    await page.route("**/api/v1/admin/student-documents/acad-doc-1/approve", (route) => {
      approvedAcademic = true;
      academicStudents = [];
      return route.fulfill({ json: { success: true, message: "Histórico aprovado." } });
    });

    await page.goto("/admin/documentos");
    await expect(page.getByText("Lucas Inicial")).toBeVisible();
    await expect(page.locator("img[src^='blob:']")).toHaveCount(1);
    await expect(page.locator("img[src*='/v1/media/']")).toHaveCount(0);
    await expect(page.locator("a[href*='/media/']")).toHaveCount(0);
    expect(mediaAuthHeaders[0]).toBe("Bearer admin-jwt-fixture");

    await page.getByRole("button", { name: "Reprovar" }).click();
    await page.locator("#reject-reason").fill("Comprovante sem CEP visível.");
    await page.getByRole("button", { name: "Confirmar reprovação" }).click();
    await expect(page.getByText("Documento reprovado e aluno notificado para reenvio.")).toBeVisible();
    expect(rejectedInitialBody).toEqual({ rejection_reason: "Comprovante sem CEP visível." });

    await page.getByRole("button", { name: /Documentos pós-SIGA/i }).click();
    await expect(page.getByText("Carla Pós-SIGA")).toBeVisible();
    await expect(page.locator("img[src^='blob:']")).toHaveCount(1);
    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Histórico aprovado.")).toBeVisible();
    expect(approvedAcademic).toBe(true);
  });

  test("/admin/credenciais-siga lista prontos, alterna filtro e emite acesso SIGA", async ({ page }) => {
    await signInAs(page, ["admin"], { admin: "active" });

    const enrollmentQueries: string[] = [];
    let issued = false;
    await page.route("**/api/v1/admin/enrollments?**", (route) => {
      enrollmentQueries.push(route.request().url());
      return route.fulfill({
        json: {
          success: true,
          total: 1,
          page: 1,
          limit: 30,
          total_pages: 1,
          items: [
            {
              role_id: "role-siga-1",
              user_id: "u-siga-1",
              name: "Pedro",
              full_name: "Pedro Henrique",
              cpf: "111.444.777-35",
              phone: "5543999990004",
              status: issued ? "enrolled" : "pre_enrolled",
              substatus: issued ? "siga_active" : "pending_siga",
              ready_for_siga: !issued,
              has_siga: issued,
              doc_statuses: { rg: "approved", proof_of_residence: "approved", education_level: "approved", selfie: "review" },
              fee_1_status: "paid",
            },
          ],
        },
      });
    });

    let postedSiga: Record<string, unknown> | null = null;
    await page.route("**/api/v1/admin/siga/credentials", (route) => {
      postedSiga = route.request().postDataJSON();
      issued = true;
      return route.fulfill({ json: { success: true, siga_username: "11144477735", message: "Acesso SIGA liberado!" } });
    });

    await page.goto("/admin/credenciais-siga");
    await expect(page.getByText("Pedro Henrique")).toBeVisible();
    expect(enrollmentQueries[0]).toContain("ready_for_siga=true");

    await page.getByRole("button", { name: "Emitir acesso SIGA" }).click();
    await expect(page.locator("#siga-user")).toHaveValue("11144477735");
    await page.locator("#siga-pass").fill("SenhaInicial#2026");
    await page.locator("#siga-url").fill("https://siga.supletivo.net.br");
    await page.getByRole("button", { name: "Salvar e liberar acesso" }).click();

    await expect(page.getByText("Acesso SIGA liberado!")).toBeVisible();
    expect(postedSiga).toEqual({
      student_role_id: "role-siga-1",
      siga_username: "11144477735",
      siga_password: "SenhaInicial#2026",
      siga_url: "https://siga.supletivo.net.br",
    });
  });

  test("/admin/taxa-parceira decodifica QR, paga 1ª parcela, agenda 2ª e reconcilia", async ({ page }) => {
    await signInAs(page, ["admin"], { admin: "active" });

    await page.route("**/api/v1/admin/enrollments?**", (route) =>
      route.fulfill({
        json: {
          success: true,
          total: 1,
          page: 1,
          limit: 25,
          total_pages: 1,
          items: [
            {
              role_id: "role-fee-1",
              user_id: "u-fee-1",
              name: "Fernanda",
              full_name: "Fernanda Costa",
              cpf: "33366699900",
              phone: "5543999990005",
              status: "enrolled",
              substatus: "siga_active",
              fee_1_status: null,
              fee_2_status: null,
              doc_statuses: {},
            },
          ],
        },
      }),
    );

    const feesList: Array<Record<string, unknown>> = [];
    await page.route("**/api/v1/admin/fees/enrollments/role-fee-1", (route) =>
      route.fulfill({ json: { fees: feesList } }),
    );
    await page.route("**/api/v1/admin/fees/decode-qr", (route) =>
      route.fulfill({
        json: {
          amount_cents: 15000,
          receiverName: "Instituto Parceiro EJA",
          receiverCpfCnpj: "12.345.678/0001-99",
          dueDate: "2026-12-01",
          canBePaid: true,
        },
      }),
    );
    await page.route("**/api/v1/admin/fees/pay-first", (route) => {
      feesList.push({ id: "fee-1", installment_number: 1, amount_cents: 15000, status: "paid", paid_at: Date.now() });
      return route.fulfill({ json: { success: true } });
    });
    let scheduledBody: Record<string, unknown> | null = null;
    await page.route("**/api/v1/admin/fees/schedule-second", (route) => {
      scheduledBody = route.request().postDataJSON();
      feesList.push({ id: "fee-2", installment_number: 2, amount_cents: 15000, status: "scheduled", due_date: "2026-12-30" });
      return route.fulfill({ json: { success: true } });
    });
    await page.route("**/api/v1/admin/fees/fee-2/reconcile", (route) =>
      route.fulfill({ json: { id: "fee-2", status: "paid" } }),
    );

    await page.goto("/admin/taxa-parceira");
    await page.getByRole("button", { name: /Fernanda Costa/i }).click();

    await page.locator("#fee-qr").fill("00020101021226880014br.gov.bcb.pix");
    await page.getByRole("button", { name: "Decodificar QR Code" }).click();
    await expect(page.getByText(/Instituto Parceiro EJA/)).toBeVisible();
    await expect(page.getByText(/R\$\s*150,00/)).toBeVisible();

    await page.getByRole("button", { name: "Pagar 1ª parcela agora" }).click();
    await expect(page.getByText("1ª parcela da taxa parceira enviada via Asaas PIX!")).toBeVisible();

    await page.locator("#fee-qr").fill("00020101021226880014br.gov.bcb.pix2");
    await page.locator("#fee-schedule-date").fill("2026-12-30");
    await page.getByRole("button", { name: "Agendar 2ª parcela" }).click();
    await expect(page.getByText("2ª parcela da taxa parceira agendada via Asaas PIX!")).toBeVisible();
    expect(scheduledBody).toMatchObject({
      student_role_id: "role-fee-1",
      schedule_date: "2026-12-30",
    });

    await page.getByRole("button", { name: "Reconciliar" }).nth(1).click();
    await expect(page.getByText("Parcela atualizada para status: paid.")).toBeVisible();
  });

  test("/admin/provas lança correção binária e anexa PDF corrigido protegido", async ({ page }) => {
    await signInAs(page, ["admin"], { admin: "active" });

    const mediaHeaders: string[] = [];
    await page.route("**/media/**", (route) => {
      mediaHeaders.push(route.request().headers().authorization ?? "");
      return route.fulfill({ status: 200, contentType: "application/pdf", body: TINY_PDF });
    });

    let examResult = "pending";
    let correctedKey: string | null = null;
    await page.route("**/api/v1/admin/exams/scheduled**", (route) =>
      route.fulfill({
        json: {
          exams: [
            {
              id: "ex-adm-1",
              student_name: "Rafael Provas",
              cpf: "44477711100",
              phone: "5543999990006",
              subject: "Prova Geral EJA",
              attempt_number: 1,
              scheduled_at: "2026-11-28T14:00:00.000Z",
              result: examResult,
              notes: null,
              corrected_exam_file_key: correctedKey,
            },
          ],
        },
      }),
    );

    let gradedBody: Record<string, unknown> | null = null;
    await page.route("**/api/v1/admin/exams/ex-adm-1/grade", (route) => {
      gradedBody = route.request().postDataJSON();
      examResult = "passed";
      return route.fulfill({ json: { success: true, message: "Aluno aprovado na prova!" } });
    });

    await page.route("**/api/v1/admin/exams/ex-adm-1/corrected-pdf", (route) => {
      expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
      correctedKey = "/v1/media/students/u1/exams/ex-adm-1-graded.pdf";
      return route.fulfill({ json: { success: true, message: "Espelho corrigido anexado." } });
    });

    await page.goto("/admin/provas");
    await expect(page.getByText(/Rafael Provas — Prova Geral EJA/)).toBeVisible();

    await page.getByPlaceholder("Observações da correção (opcional)").fill("Aprovado sem pendências");
    await page.getByRole("button", { name: "Aprovar aluno" }).click();
    await expect(page.getByText("Aluno aprovado na prova!")).toBeVisible();
    expect(gradedBody).toEqual({ passed: true, notes: "Aprovado sem pendências" });

    await page.locator('input[type="file"]').setInputFiles({
      name: "espelho-corrigido.pdf",
      mimeType: "application/pdf",
      buffer: TINY_PDF,
    });
    await expect(page.getByText("Espelho corrigido anexado.")).toBeVisible();
    await expect(page.getByText("Documento em PDF pronto para visualização.")).toBeVisible();
    expect(mediaHeaders[0]).toBe("Bearer admin-jwt-fixture");
  });

  test("/admin/diplomas emite diploma enxuto apenas com 2 PDFs e registra retirada com foto", async ({ page }) => {
    await signInAs(page, ["admin"], { admin: "active" });

    const mediaHeaders: string[] = [];
    await page.route("**/media/**", (route) => {
      const url = route.request().url();
      mediaHeaders.push(route.request().headers().authorization ?? "");
      if (url.endsWith(".pdf")) {
        return route.fulfill({ status: 200, contentType: "application/pdf", body: TINY_PDF });
      }
      return route.fulfill({ status: 200, contentType: "image/png", body: TINY_PNG });
    });

    let currentStatus = "awaiting_pickup";
    let issuedDiploma: Record<string, unknown> | null = null;

    await page.route("**/api/v1/admin/students?**", (route) =>
      route.fulfill({
        json: {
          success: true,
          total: 1,
          page: 1,
          limit: 25,
          total_pages: 1,
          items: [
            {
              role_id: "role-dip-1",
              user_id: "u-dip-1",
              name: "Juliana",
              full_name: "Juliana Santos",
              cpf: "55588822200",
              phone: "5543999990007",
              status: currentStatus,
              substatus: currentStatus === "graduated" ? null : "pending_documents",
              pending_docs_count: 0,
              has_siga: true,
              created_at: Date.now(),
              updated_at: Date.now(),
            },
          ],
        },
      }),
    );

    await page.route("**/api/v1/admin/students/role-dip-1/diploma", (route) =>
      route.fulfill({
        json: {
          user: { id: "u-dip-1", phone: "5543999990007", name: "Juliana", full_name: "Juliana Santos" },
          role: { id: "role-dip-1", status: currentStatus, substatus: currentStatus === "graduated" ? null : "ready_for_pickup" },
          diploma: issuedDiploma,
        },
      }),
    );

    await page.route("**/api/v1/admin/students/role-dip-1/diploma/issue", (route) => {
      expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
      issuedDiploma = {
        registration_number: null,
        process_number: null,
        official_gazette_date: null,
        diploma_file_key: "/v1/media/students/u-dip-1/diploma.pdf",
        transcript_file_key: "/v1/media/students/u-dip-1/transcript.pdf",
        pickup_photo_key: null,
        issued_at: Date.now(),
        picked_up_at: null,
      };
      return route.fulfill({ json: { success: true, message: "Diploma e histórico emitidos!" } });
    });

    await page.route("**/api/v1/admin/students/role-dip-1/diploma/pickup", (route) => {
      currentStatus = "graduated";
      if (issuedDiploma) {
        issuedDiploma.pickup_photo_key = "/v1/media/students/u-dip-1/pickup.png";
        issuedDiploma.picked_up_at = Date.now();
      }
      return route.fulfill({ json: { success: true, message: "Retirada presencial registrada." } });
    });

    await page.goto("/admin/diplomas");
    await page.getByRole("button", { name: /Juliana Santos/i }).click();

    await expect(page.getByText("PDF do Diploma (até 15 MB)")).toBeVisible();
    await page.locator("#dip-pdf").setInputFiles({
      name: "nao-pdf.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });
    await expect(page.getByText("Envie um arquivo PDF válido.")).toBeVisible();

    await page.locator("#dip-pdf").setInputFiles({
      name: "diploma.pdf",
      mimeType: "application/pdf",
      buffer: TINY_PDF,
    });
    await page.locator("#trans-pdf").setInputFiles({
      name: "historico.pdf",
      mimeType: "application/pdf",
      buffer: TINY_PDF,
    });
    await page.getByRole("button", { name: "Salvar emissão de diploma / histórico" }).click();

    await expect(page.getByText("Diploma e histórico emitidos!", { exact: true })).toBeVisible();
    await expect(page.getByText("Diploma emitido", { exact: true })).toBeVisible();
    await expect(page.getByText("Histórico emitido", { exact: true })).toBeVisible();
    await expect(page.getByText("Documento em PDF pronto para visualização.")).toHaveCount(2);

    const pickupInput = page.locator('label:has-text("Registrar retirada com foto") input[type="file"]');
    await pickupInput.setInputFiles({
      name: "retirada.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });
    await expect(page.getByText("Retirada presencial registrada.")).toBeVisible();
    await expect(page.locator("img[src^='blob:']")).toHaveCount(1);
    expect(mediaHeaders.every((h) => h === "Bearer admin-jwt-fixture")).toBe(true);

    const diplomaFilterValues = await page.locator("select option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(diplomaFilterValues).toEqual(["", "awaiting_pickup", "graduated"]);
  });
});
