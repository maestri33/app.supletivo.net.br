import { test, expect } from "@playwright/test";

test.describe("Ambientes Especializados e Barra de Navegação Dinâmica (Role + Status)", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`[BROWSER ERROR]: ${err.message}\n${err.stack}`));
  });

  test("1. Aluno com exame liberado (exam_released) exibe callout de agendamento e badge na dock", async ({ page }) => {
    const externalId = "student-exam-released-uuid";

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          token_type: "bearer",
          roles: ["student"],
          user: { external_id: "student-exam-released-uuid", roles: ["student"] },
          savedAt: Date.now(),
        })
      );
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["student"],
          name: "Carlos Formando",
        }),
      });
    });

    await page.route("**/api/v1/clients/lead/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "active",
          checkout: { is_paid: true },
        }),
      });
    });

    await page.route("**/api/v1/clients/student/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "exam_released",
          pendencies: [],
        }),
      });
    });

    await page.goto("/painel");

    // Valida saudação e status formatado em PT-BR
    await expect(page.getByText("Olá, Carlos Formando!")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Liberado para Prova")).toBeVisible();

    // Valida callout de agendamento de prova presencial
    await expect(page.getByText("Parabéns! Você está liberado para o exame presencial.")).toBeVisible();
    const scheduleBtn = page.locator("a[href='/provas']").first();
    await expect(scheduleBtn).toBeVisible();

    // Valida badge 'Liberada' na dock de navegação
    const dockExamItem = page.locator("a[href='/provas']").last();
    await expect(dockExamItem).toBeVisible();
    await expect(dockExamItem.getByText("Liberada", { exact: true })).toBeVisible();

    await page.screenshot({
      path: "C:/Users/maestri33/.gemini/antigravity/brain/8e9ce055-238c-4818-9678-9db01ba7f969/role-student-exam-released.png",
      fullPage: true,
    });
  });

  test("2. Promotor com trava de treinamento (training overlay) exibe aviso de bloqueio no ambiente e na dock", async ({ page }) => {
    const externalId = "promoter-training-uuid";

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          token_type: "bearer",
          roles: ["promoter", "training"],
          user: { external_id: "promoter-training-uuid", roles: ["promoter", "training"] },
          savedAt: Date.now(),
        })
      );
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["promoter", "training"],
          name: "Roberto Consultor",
        }),
      });
    });

    await page.goto("/painel");

    // Single-role normalizado para promotor -> sem tabs superiores
    await expect(page.locator("button:has-text('Aluno')")).toHaveCount(0);

    // Valida título do ambiente de promotor em treinamento
    await expect(page.getByText("Treinamento em Andamento")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Trava Ativa: Matérias Obrigatórias Pendentes")).toBeVisible();

    // Valida botão para o LMS de treinamento
    const lmsLink = page.locator("a[href='/promotor/treinamento']").first();
    await expect(lmsLink).toBeVisible();

    // Valida dock adaptada com item de Treinamento Obrigatório
    const dockTrainingItem = page.locator("a[href='/promotor/treinamento']").last();
    await expect(dockTrainingItem).toBeVisible();

    await page.screenshot({
      path: "C:/Users/maestri33/.gemini/antigravity/brain/8e9ce055-238c-4818-9678-9db01ba7f969/role-promoter-training.png",
      fullPage: true,
    });
  });

  test("3. Coordenador de Polo (coordinator) exibe secretaria do polo e métricas da fila", async ({ page }) => {
    const externalId = "coordinator-uuid";

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          token_type: "bearer",
          roles: ["coordinator"],
          user: { external_id: "coordinator-uuid", roles: ["coordinator"] },
          savedAt: Date.now(),
        })
      );
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["coordinator"],
          name: "Fernanda Coordenadora",
        }),
      });
    });

    await page.goto("/painel");

    // Valida título do ambiente do Polo
    await expect(page.getByText("Secretaria do Polo Regional")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Conferência Documental & Turmas")).toBeVisible();
    await expect(page.getByText("Fila de Conferência")).toBeVisible();
    await expect(page.getByText("5 pendências")).toBeVisible();

    // Valida dock do Polo com botão de conferência
    const dockReviews = page.locator("a[href='/polo/matriculas']").first();
    await expect(dockReviews).toBeVisible();

    await page.screenshot({
      path: "C:/Users/maestri33/.gemini/antigravity/brain/8e9ce055-238c-4818-9678-9db01ba7f969/role-polo-coordinator.png",
      fullPage: true,
    });
  });

  test("4. Usuário Multi-Role (student + promoter) exibe tabs superiores e permite transmutação fluida", async ({ page }) => {
    const externalId = "multi-role-user-uuid";

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "supletivo.login",
        JSON.stringify({
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          token_type: "bearer",
          roles: ["student", "promoter"],
          user: { external_id: "multi-role-user-uuid", roles: ["student", "promoter"] },
          savedAt: Date.now(),
        })
      );
    });

    await page.route("**/api/v1/clients/whoami", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          roles: ["student", "promoter"],
          name: "Lucas Duplo Perfil",
        }),
      });
    });

    await page.route("**/api/v1/clients/lead/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "active",
          checkout: { is_paid: true },
        }),
      });
    });

    await page.route("**/api/v1/clients/student/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external_id: externalId,
          status: "awaiting_documents",
          pendencies: [],
        }),
      });
    });

    await page.goto("/painel");

    // Usuário tem 2 roles -> Deve exibir tabs no topo
    const alunoTab = page.locator("button:has-text('Aluno')");
    const promotorTab = page.locator("button:has-text('Promotor')");

    await expect(alunoTab).toBeVisible({ timeout: 10000 });
    await expect(promotorTab).toBeVisible();

    // Inicialmente no ambiente de Aluno -> dock tem itens do Aluno (/documentos)
    await expect(page.getByText("Olá, Lucas Duplo Perfil!")).toBeVisible();
    await expect(page.locator("a[href='/documentos']").first()).toBeVisible();

    await page.screenshot({
      path: "C:/Users/maestri33/.gemini/antigravity/brain/8e9ce055-238c-4818-9678-9db01ba7f969/role-multi-role-student-tab.png",
      fullPage: true,
    });

    // Clica na tab do Promotor
    await promotorTab.click();

    // Transmuta para o ambiente de Promotor
    await expect(page.getByText("Painel do Consultor Educacional")).toBeVisible();
    await expect(page.getByText("Gestão de Indicações & Comissões")).toBeVisible();

    // Dock transmuta e exibe itens do Promotor (/promotor/leads)
    await expect(page.locator("a[href='/promotor/leads']").first()).toBeVisible();

    await page.screenshot({
      path: "C:/Users/maestri33/.gemini/antigravity/brain/8e9ce055-238c-4818-9678-9db01ba7f969/role-multi-role-promoter-tab.png",
      fullPage: true,
    });
  });
});

