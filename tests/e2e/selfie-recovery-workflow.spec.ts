import { test, expect, type Page } from "@playwright/test";

async function setup(
  page: Page,
  selfieStatus: { submitted: boolean; status: string; rejection_reason?: string } = {
    submitted: false,
    status: "pending",
  },
) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "supletivo.login",
      JSON.stringify({
        access_token: "fixture",
        refresh_token: "fixture",
        roles: ["client"],
        role_statuses: { client: "pre_enrolled" },
      }),
    );
    localStorage.setItem("supletivo.session", JSON.stringify({ phone: "11900000000", externalId: "fixture" }));
  });

  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "fixture",
        external_id: "fixture",
        phone: "5511900000000",
        roles: ["client"],
        active_role: "client",
        role_statuses: { client: "pre_enrolled" },
        status: "pre_enrolled",
        substatus: "selfie_pending",
      },
    }),
  );

  await page.route("**/api/v1/enrollment/status", (route) =>
    route.fulfill({
      json: {
        student_role_id: "r1",
        current_status: "pre_enrolled",
        substatus: "selfie_pending",
        step: 4,
        all_basic_docs_ready: false,
        checklist: {
          rg: { submitted: true, status: "approved", needs_manual_review: 0 },
          proof_of_residence: { submitted: true, status: "approved", needs_manual_review: 0 },
          education_level: { submitted: true, status: "approved", needs_manual_review: 0 },
          contract_signature: { submitted: false, status: "pending", needs_manual_review: 0 },
          selfie: { ...selfieStatus, needs_manual_review: 0 },
        },
      },
    }),
  );

  await page.route("**/api/v1/contract/current", (route) =>
    route.fulfill({
      json: { text: "Contrato exclusivo de teste", version: "v2", hash: "hash-v2" },
    }),
  );

  await page.goto("/student/enrollment/selfie");
}

test("student: live camera frame is captured and sent once with contract sign", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, permissions: ["camera"] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(10);
      setInterval(() => ctx.fillRect(0, 0, 640, 480), 100);
      return stream;
    };
  });

  let signCalls = 0;
  let uploads = 0;
  await setup(page);
  await page.route("**/api/v1/student/contract/sign", (route) => {
    signCalls += 1;
    expect(route.request().postDataJSON()).toEqual({ contract_version_hash: "hash-v2", accepted: true });
    return route.fulfill({ json: { id: "sig-1", document_type: "contract_signature", status: "approved", signed_at: Date.now() } });
  });
  await page.route("**/api/v1/enrollment/selfie", (route) => {
    uploads += 1;
    expect(route.request().headers()["content-type"]).toContain("multipart/form-data");
    return route.fulfill({ status: 503, json: { error: "Falha controlada de teste" } });
  });

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Abrir câmera para selfie" }).click();
  await expect(page.getByRole("button", { name: "Fotografar e enviar selfie" })).toBeEnabled();
  await page.getByRole("button", { name: "Fotografar e enviar selfie" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Falha controlada de teste" })).toBeVisible();
  expect(signCalls).toBe(1);
  expect(uploads).toBe(1);
  await expect(page.getByRole("button", { name: "Abrir câmera para selfie" })).toBeEnabled();
  await context.close();
});

test("student: permission ignored allows cancellation and retry", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {});
  });
  await setup(page);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Abrir câmera para selfie" }).click();
  await page.getByRole("button", { name: "Cancelar abertura" }).click();
  await expect(page.getByRole("button", { name: "Abrir câmera para selfie" })).toBeEnabled();
  await page.getByRole("button", { name: "Abrir câmera para selfie" }).click();
  await expect(page.getByRole("alert")).toContainText("A câmera não respondeu", { timeout: 18000 });
  await expect(page.getByRole("button", { name: "Abrir câmera para selfie" })).toBeEnabled();
});

test("student: occupied camera explains recovery", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("busy", "NotReadableError"));
  });
  await setup(page);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Abrir câmera para selfie" }).click();
  await expect(page.getByRole("alert")).toContainText("Feche outros apps");
  await expect(page.getByRole("button", { name: "Abrir câmera para selfie" })).toBeEnabled();
});

test("student: displays rejection reason when selfie needs resubmission", async ({ page }) => {
  await setup(page, {
    submitted: true,
    status: "rejected",
    rejection_reason: "Foto escura. Tire em ambiente iluminado.",
  });
  await expect(page.getByText("Motivo da reprovação da selfie")).toBeVisible();
  await expect(page.getByText("Foto escura. Tire em ambiente iluminado.")).toBeVisible();
});

test("student: CONTRACT_HASH_MISMATCH reloads contract and prompts re-acceptance", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, permissions: ["camera"] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(10);
      setInterval(() => ctx.fillRect(0, 0, 640, 480), 100);
      return stream;
    };
  });

  await setup(page);
  let contractReads = 0;
  await page.route("**/api/v1/contract/current", (route) => {
    contractReads += 1;
    return route.fulfill({
      json: { text: "Contrato atualizado v3", version: "v3", hash: "hash-v3" },
    });
  });
  await page.route("**/api/v1/student/contract/sign", (route) =>
    route.fulfill({
      status: 409,
      json: { error: "Hash desatualizado", code: "CONTRACT_HASH_MISMATCH" },
    }),
  );

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Abrir câmera para selfie" }).click();
  await expect(page.getByRole("button", { name: "Fotografar e enviar selfie" })).toBeEnabled();
  await page.getByRole("button", { name: "Fotografar e enviar selfie" }).click();

  await expect(page.getByRole("alert")).toContainText("O texto do contrato foi atualizado");
  await expect(page.getByText("Contrato atualizado v3")).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  expect(contractReads).toBeGreaterThanOrEqual(1);
  await context.close();
});
