import { test, expect, type Page } from "@playwright/test";

async function identity(page: Page, role: "client" | "admin", status: string) {
  await page.addInitScript(
    ({ role, status }) =>
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "fixture-token",
          refresh_token: "fixture-refresh",
          roles: [role],
          role_statuses: { [role]: status },
        }),
      ),
    { role, status },
  );
  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "user-id",
        external_id: "user-id",
        phone: "5511999999999",
        name: "Pessoa Teste",
        roles: [role],
        active_role: role,
        role_statuses: { [role]: status },
        status,
      },
    }),
  );
}

test("admin documents desk fetches private images via /media with Bearer JWT and approves both queues", async ({ page }) => {
  await identity(page, "admin", "active");

  const mediaAuthHeaders: string[] = [];
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.route("**/media/**", async (route) => {
    mediaAuthHeaders.push(route.request().headers().authorization ?? "");
    await route.fulfill({ status: 200, contentType: "image/png", body: pngBytes });
  });

  await page.route("**/api/v1/admin/documents/review-desk", (route) =>
    route.fulfill({
      json: {
        success: true,
        total: 1,
        documents: [
          {
            id: "doc-rg-1",
            student_role_id: "role-1",
            student_name: "Aluno Review",
            student_cpf: "11144477735",
            student_phone: "5511999999999",
            document_type: "rg",
            file_url: "/v1/media/enrollments/rg/doc-rg-1.png",
            status: "review",
            ai_confidence: 0.92,
            ai_readable: true,
            ai_extracted_data: {},
            divergences: [],
            fast_ok_eligible: true,
            submitted_at: Date.now(),
          },
        ],
      },
    }),
  );

  await page.route("**/api/v1/admin/student-documents/pending", (route) =>
    route.fulfill({
      json: {
        total_students: 1,
        students: [
          {
            student_role_id: "role-2",
            user_id: "u2",
            student_name: "Aluno Pós-SIGA",
            cpf: "22255588811",
            phone: "5511988887777",
            gender: "M",
            blood_type: "O+",
            current_status: "enrolled",
            submitted_at: Date.now(),
            pending_documents: [
              {
                doc_id: "acad-1",
                document_type: "school_records",
                file_url_temporary: "/v1/media/student/acad-1.png",
                status: "pending",
                submitted_at: Date.now(),
              },
            ],
          },
        ],
      },
    }),
  );

  let fastOkHit = false;
  await page.route("**/api/v1/admin/documents/doc-rg-1/fast-ok", (route) => {
    fastOkHit = true;
    return route.fulfill({ json: { success: true, doc_id: "doc-rg-1", status: "approved", message: "Fast OK aplicado" } });
  });

  await page.goto("/admin/documentos");
  await expect(page.getByText("Aluno Review")).toBeVisible();
  await expect(page.locator("img[src^='blob:']")).toHaveCount(1);
  expect(mediaAuthHeaders[0]).toBe("Bearer fixture-token");

  await page.getByRole("button", { name: "Fast OK" }).click();
  await expect(page.getByText("Fast OK aplicado")).toBeVisible();
  expect(fastOkHit).toBe(true);
});

test("an enrolled student keeps active navigation and sees only school_records and military_certificate", async ({ page }) => {
  await identity(page, "client", "enrolled");
  await page.route("**/api/v1/student/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "u1", phone: "5511999999999", cpf: "11144477735", name: "Aluno Ativo", full_name: "Aluno Ativo", gender: "M", blood_type: "O+" },
        role: { id: "r1", role: "client", status: "enrolled", substatus: "pending_post_siga_docs", paid_at: Date.now() },
        siga_credentials: { username: "11144477735", url: "https://siga.supletivo.net.br" },
        document_progress: {
          blood_type_registered: true,
          military_exempt: false,
          academic_documents_ready: false,
          checklist: {},
        },
      },
    }),
  );
  await page.route("**/api/v1/student/documents", (route) =>
    route.fulfill({ json: { student_role_id: "r1", user_id: "u1", gender: "M", blood_type: "O+", military_exempt: false, is_fully_compliant: false, documents: [], pending_requirements: ["school_records", "military_certificate"] } }),
  );
  await page.route("**/api/v1/student/exams", (route) =>
    route.fulfill({ json: { student_role_id: "r1", current_status: "enrolled", current_substatus: "pending_post_siga_docs", eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }),
  );

  await page.goto("/student/active/documents");
  await expect(page.getByRole("heading", { name: "Histórico escolar anterior" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Certificado militar / Reservista" })).toBeVisible();
  await expect(page.getByText(/Taxa parceira/i)).toHaveCount(0);
});
