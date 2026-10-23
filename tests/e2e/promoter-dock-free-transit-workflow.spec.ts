import { test, expect, type Page } from "@playwright/test";

const userId = "77777777-7777-4777-8777-777777777777";
const artifactDir = "C:/Users/maestri33/.gemini/antigravity/brain/6b0d2140-f7a1-491e-a802-6cee741a8ed6";

test("candidato transita livremente entre todos os icones do dock sem bloqueios", async ({ page }) => {
  // Simula exatamente o estado do print do usuário:
  // Documento aprovado pelo coordenador, sem endereço, sem escolaridade, sem selfie
  const candidateState = {
    external_id: userId,
    hub_external_id: userId,
    status: "documents",
    ref_url: `https://supletivo.net.br/?ref=${userId}`,
    pix_validated: false,
    selfie_verified: false,
    profile: { name: "Usuário Teste", cpf: "123.456.789-00", education_level: null },
    address: null,
    address_proof: { exists: false, status: null },
    documents: {
      external_id: userId,
      rg: {
        doc_type: "rg",
        number: null,
        full_photo: "documents/rg.jpg",
        validation_status: "approved",
        analysis_status: "approved",
        analysis_reason: "aprovado pelo coordenador",
      },
    },
    selfie: { exists: false },
    blocks: [],
  };

  const docSectionState = {
    doc_type: "rg",
    number: null,
    full_photo: "documents/rg.jpg",
    validation_status: "approved",
    analysis_status: "approved",
    analysis_reason: "aprovado pelo coordenador",
    missing_fields: ["number"],
    next_slot: null,
    photos: { rg_full: { status: "approved" } },
  };

  await page.addInitScript(({ userId }) => {
    sessionStorage.setItem("fixture-session-seeded", "true");
    localStorage.setItem("supletivo.login", JSON.stringify({
      access_token: "test-token-free-transit", refresh_token: "test-refresh-free", roles: ["candidate"],
    }));
    localStorage.setItem("supletivo.session", JSON.stringify({
      phone: "11977778888", externalId: userId,
    }));
  }, { userId });

  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles: ["candidate"], name: "Usuário Teste",
    role_statuses: { promoter: "candidate" },
  } }));

  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: candidateState }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: docSectionState }));
  await page.route("**/api/v1/collaborators/contract/current", route => route.fulfill({ json: { version: "2026.1", text: "Termo de Adesão de Teste" } }));

  // Abre em mobile viewport similar ao print do usuário (390 x 844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/promoter/candidate");
  await page.waitForLoadState("networkidle");

  const dock = page.getByRole("navigation", { name: "Navegação principal do promoter" });
  const linkDoc = dock.getByRole("link", { name: /RG ou CNH/ });
  const linkAddr = dock.getByRole("link", { name: /Endereço/ });
  const linkEdu = dock.getByRole("link", { name: /Escolaridade/ });
  const linkSelfie = dock.getByRole("link", { name: /Selfie/ });
  const linkRef = dock.getByRole("link", { name: /Indicar/ });

  // 1. Como documento já está aprovado, a aplicação posiciona em endereço
  await expect(page.getByRole("heading", { name: "Comprovante de residência" })).toBeVisible();

  // Verifica que NENHUM item do dock está desabilitado
  await expect(linkDoc).not.toHaveAttribute("aria-disabled", "true");
  await expect(linkAddr).not.toHaveAttribute("aria-disabled", "true");
  await expect(linkEdu).not.toHaveAttribute("aria-disabled", "true");
  await expect(linkSelfie).not.toHaveAttribute("aria-disabled", "true");
  await expect(linkRef).not.toHaveAttribute("aria-disabled", "true");

  await page.screenshot({ path: `${artifactDir}/dock-01-inicial-endereco.png` });

  // 2. Transita livremente para Documentos clicando no ícone do Dock
  await linkDoc.click();
  await expect(page).toHaveURL(/#documents$/);
  await expect(page.getByRole("heading", { name: "Documento de identidade" })).toBeVisible();
  await expect(page.getByText("aprovado pelo coordenador", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continuar para endereço" })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/dock-02-transicao-documentos-aprovado.png` });

  // 3. Transita livremente para Escolaridade clicando no ícone do Dock
  await linkEdu.click();
  await expect(page).toHaveURL(/#education$/);
  await expect(page.getByRole("heading", { name: "Sua escolaridade" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chave PIX de Comissões" })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/dock-03-transicao-escolaridade-pix.png` });

  // 4. Transita livremente para Selfie clicando no ícone do Dock
  await linkSelfie.click();
  await expect(page).toHaveURL(/#selfie$/);
  await expect(page.getByRole("heading", { name: "Termo de adesão e selfie" })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/dock-04-transicao-selfie.png` });

  // 5. Transita livremente para Indicar clicando no ícone do Dock
  await linkRef.click();
  await expect(page).toHaveURL(/#referral$/);
  await expect(page.getByRole("heading", { name: "Você já pode indicar" })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/dock-05-transicao-indicar.png` });

  // 6. Transita livremente de volta para Endereço clicando no ícone do Dock
  await linkAddr.click();
  await expect(page).toHaveURL(/#address$/);
  await expect(page.getByRole("heading", { name: "Comprovante de residência" })).toBeVisible();
  await page.screenshot({ path: `${artifactDir}/dock-06-retorno-endereco.png` });
});
