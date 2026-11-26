import { test, expect, type Page } from "@playwright/test";

async function openSelfie(page: Page) {
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
          selfie: { submitted: false, status: "pending", needs_manual_review: 0 },
        },
      },
    }),
  );
  await page.route("**/api/v1/student/contract", (route) =>
    route.fulfill({
      json: {
        text: "Texto extenso do contrato para exercício de rolagem.\n".repeat(45),
        version: "v2",
        hash: "fixture-hash",
      },
    }),
  );

  await page.goto("/student/enrollment/selfie");
  await expect(page.getByRole("checkbox")).toBeVisible();
}

async function appScrollTop(page: Page) {
  return page.evaluate(() => document.querySelector<HTMLElement>("#conteudo")?.scrollTop ?? window.scrollY);
}

test("student lead keeps logout only in header and InfinitePay button ready", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "supletivo.login",
      JSON.stringify({
        access_token: "fixture",
        refresh_token: "fixture",
        roles: ["client"],
        role_statuses: { client: "lead" },
      }),
    ),
  );
  await page.route("**/api/v1/auth/whoami", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        id: "u-lead",
        external_id: "u-lead",
        phone: "5511999999999",
        cpf: "11144477735",
        email: "aluno@example.test",
        name: "Aluno de teste",
        roles: ["client"],
        active_role: "client",
        role_statuses: { client: "lead" },
        status: "lead",
      },
    }),
  );
  await page.route("**/api/v1/catalog/pricing", (route) =>
    route.fulfill({ json: { pix: "999.00", promo_pix: "999.00", card: null, promo_card: null } }),
  );
  await page.route("**/api/v1/catalog/contact", (route) =>
    route.fulfill({ json: { email: "contato@supletivo.net.br", whatsapp_number: null } }),
  );
  await page.route("**/api/v1/student/payment/current", (route) =>
    route.fulfill({ status: 404, json: { error: "none" } }),
  );

  await page.goto("/student/lead/payment");
  await expect(page.getByRole("button", { name: /Ir para pagamento seguro InfinitePay/i })).toBeEnabled();
  const dock = page.getByRole("navigation", { name: "Navegação principal do student" });
  await expect(dock.getByRole("link", { name: "Pagamento", exact: true })).toBeVisible();
  await expect(dock.getByRole("button", { name: "Sair", exact: true })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("button", { name: "Sair", exact: true })).toBeVisible();
});

test("student: wheel scrolls the page outside the contract", async ({ page }) => {
  await page.setViewportSize({ width: 502, height: 648 });
  await openSelfie(page);
  await page.mouse.move(350, 180);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => appScrollTop(page), { timeout: 3000 }).toBeGreaterThan(30);
  await page.getByRole("checkbox").scrollIntoViewIfNeeded();
  const box = await page.getByRole("checkbox").boundingBox();
  const dock = await page.locator('nav[aria-label="Navegação principal do student"]').boundingBox();
  await expect(page.locator("[data-app-dock]").getByRole("button", { name: "Sair", exact: true })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  const main = await page.locator("#conteudo").boundingBox();
  expect(box).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(main!.y + main!.height).toBeLessThanOrEqual(dock!.y + 1);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
});

test("student: touch gesture scrolls the page", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 700 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await openSelfie(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 270, y: 250 }] });
  for (const y of [220, 190, 160, 130, 100]) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 270, y }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => appScrollTop(page), { timeout: 3000 }).toBeGreaterThan(30);
  await context.close();
});

for (const width of [320, 390, 1280]) {
  test(`student enrollment dock stays aligned without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await openSelfie(page);
    const dock = page.getByRole("navigation", { name: "Navegação principal do student" });
    await expect(dock.getByRole("link", { name: "RG", exact: true })).toBeVisible();
    await expect(dock.getByRole("link", { name: "Endereço", exact: true })).toBeVisible();
    await expect(dock.getByRole("link", { name: "Escolaridade", exact: true })).toBeVisible();
    await expect(dock.getByRole("link", { name: "Selfie", exact: true })).toHaveAttribute("aria-current", "page");

    const geometry = await page.evaluate(() => {
      const main = document.querySelector("#conteudo")!.getBoundingClientRect();
      const dockRect = document.querySelector("[data-app-dock]")!.getBoundingClientRect();
      return {
        mainBottom: main.bottom,
        dockTop: dockRect.top,
        pageWidth: document.documentElement.scrollWidth,
        width: innerWidth,
      };
    });
    expect(geometry.mainBottom).toBeLessThanOrEqual(geometry.dockTop + 1);
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.width);
  });
}

test("student: scrolling past the contract end continues on the page", async ({ page }) => {
  await page.setViewportSize({ width: 502, height: 648 });
  await openSelfie(page);
  const contract = page.locator(".max-h-60.overflow-y-auto");
  await contract.scrollIntoViewIfNeeded();
  const rect = await contract.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, Math.min(450, rect!.y + 60));
  await page.mouse.wheel(0, 3000);
  await expect.poll(() => contract.evaluate((el) => el.scrollTop), { timeout: 3000 }).toBeGreaterThan(0);
  const before = await appScrollTop(page);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => appScrollTop(page), { timeout: 3000 }).toBeGreaterThan(before);
});
