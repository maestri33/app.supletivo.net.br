import { test, expect, type Page } from "@playwright/test";

async function session(
  page: Page,
  roles: string[],
  statuses: Record<string, string>,
  extra: Record<string, unknown> = {},
) {
  await page.addInitScript(
    ({ roles, statuses, extra }) =>
      localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "test-access",
          refresh_token: "test-refresh",
          roles,
          role_statuses: statuses,
          ...extra,
        }),
      ),
    { roles, statuses, extra },
  );
  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "test-user",
        external_id: "test-user",
        phone: "5511999999999",
        name: "Pessoa Teste",
        roles,
        active_role: roles[0] ?? "client",
        role_statuses: statuses,
        status: statuses[roles[0] ?? "client"] ?? "active",
        substatus: (extra.substatus as string | null | undefined) ?? null,
      },
    }),
  );
}

test("an enrolled student resumes at the student active dashboard", async ({ page }) => {
  await session(page, ["client"], { client: "enrolled" });
  await page.route("**/api/v1/student/me", (route) =>
    route.fulfill({
      json: {
        user: { id: "test-user", phone: "5511999999999", name: "Pessoa Teste", full_name: "Pessoa Teste", cpf: null, gender: null, blood_type: null },
        role: { id: "r1", role: "client", status: "enrolled", substatus: null },
        siga_credentials: null,
        document_progress: { blood_type_registered: false, military_exempt: false, academic_documents_ready: false, checklist: {} },
      },
    }),
  );
  await page.route("**/api/v1/student/documents", (route) => route.fulfill({ json: { documents: [] } }));
  await page.route("**/api/v1/student/exams", (route) => route.fulfill({ json: { eligibility: { exam_can_schedule: false, exam_available_at: "" }, exams: [] } }));
  await page.goto("/student");
  await expect(page).toHaveURL(/\/student\/active\/dashboard$/);
});

test("unknown role state shows recovery instead of a successful default", async ({ page }) => {
  await session(page, ["client"], { client: "unrecognized" });
  await page.goto("/student");
  await expect(page.getByRole("alert")).toContainText("identificar a etapa");
  await expect(page).toHaveURL(/\/student$/);
});

test("temporary refresh outage preserves the session for retry", async ({ page }) => {
  await session(page, ["client"], { client: "lead" });
  await page.route("**/api/v1/auth/whoami", (route) => route.fulfill({ status: 401, json: { error: "Unauthorized" } }));
  await page.route("**/api/v1/auth/refresh", (route) => route.fulfill({ status: 503, json: { error: "Serviço indisponível" } }));
  await page.goto("/student");
  await expect(page.getByRole("alert")).toContainText("Serviço indisponível");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("supletivo.login") || "{}").refresh_token)).toBe("test-refresh");
});

test("administrator-only login routes to unified /admin/dashboard", async ({ page }) => {
  await session(page, ["admin"], { admin: "active" });
  await page.route("**/api/v1/admin/**", (route) => route.fulfill({ json: { success: true, total: 0, page: 1, limit: 15, total_pages: 1, items: [], metrics: { total_revenue_cents: 0, total_revenue: "R$ 0,00", total_paid_count: 0, total_pending_count: 0, total_failed_count: 0, total_refunded_count: 0, total_refunded_cents: 0, total_refunded_amount: "R$ 0,00" } } }));
  await page.goto("/");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
});
