import { test, expect, type Page } from "@playwright/test";

const userId = "55555555-5555-4555-8555-555555555555";
const artifactDir = "C:/Users/maestri33/.gemini/antigravity/brain/6b0d2140-f7a1-491e-a802-6cee741a8ed6";

async function authCandidate(page: Page, candidateState: any, docState: any) {
  await page.addInitScript(({ userId }) => {
    sessionStorage.setItem("fixture-session-seeded", "true");
    localStorage.setItem("supletivo.login", JSON.stringify({
      access_token: "test-token-real", refresh_token: "test-refresh-real", roles: ["candidate"],
    }));
    localStorage.setItem("supletivo.session", JSON.stringify({
      phone: "11988887777", externalId: userId,
    }));
  }, { userId });

  await page.route("**/api/v1/clients/whoami", route => route.fulfill({ json: {
    external_id: userId, roles: ["candidate"], name: "Carlos Promotor",
    role_statuses: { promoter: "candidate" },
  } }));

  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: candidateState }));
  await page.route("**/api/v1/collaborators/candidate/document", route => route.fulfill({ json: docState }));
}

test("fluxo real: candidato preenche endereço e pix de forma assíncrona e não-bloqueante", async ({ page }) => {
  // 1. Início: candidato enviou documento (análise ainda pendente, sem número aprovado)
  let candidateData = {
    external_id: userId, hub_external_id: userId, status: "documents",
    ref_url: `https://supletivo.net.br/?ref=${userId}`,
    pix_validated: false, selfie_verified: false,
    profile: { name: "Carlos Promotor", cpf: "123.456.789-00", education_level: null },
    address: null,
    address_proof: { exists: false, status: null },
    documents: { external_id: userId, rg: { full_photo: "documents/rg_pending.jpg", validation_status: "pending" } },
    selfie: { exists: false }, blocks: [],
  };

  let docData = {
    doc_type: "rg", number: null, full_photo: "documents/rg_pending.jpg",
    analysis_status: "pending", validation_status: "pending", missing_fields: ["number"], next_slot: null,
    photos: { rg_full: { status: "pending" } }
  };

  await authCandidate(page, candidateData, docData);

  // Rota de endereço manual
  let patchedAddress: any = null;
  await page.route("**/api/v1/collaborators/candidate/address", route => {
    if (route.request().method() === "PATCH") {
      patchedAddress = route.request().postDataJSON();
      candidateData.address = {
        street: patchedAddress.street,
        number: patchedAddress.number,
        neighborhood: patchedAddress.neighborhood || "Centro",
        city: patchedAddress.city,
        state: patchedAddress.state,
        zipcode: "01310-100",
        missing_fields: []
      };
      return route.fulfill({ json: candidateData });
    }
    return route.fulfill({ json: candidateData });
  });

  // Rota de Pix
  let savedPix: any = null;
  await page.route("**/api/v1/collaborators/candidate/pix", route => {
    savedPix = route.request().postDataJSON();
    candidateData.pix_validated = true;
    return route.fulfill({ json: candidateData });
  });

  // 1. Visita tela de documentos
  await page.goto("/promoter/candidate#documents");
  await page.waitForLoadState("networkidle");

  // Screenshot 1: Tela de documentos com campo de número manual e link não-bloqueante para endereço
  await page.screenshot({ path: `${artifactDir}/01-documentos-pendente-nao-bloqueante.png`, fullPage: true });

  const linkEndereco = page.getByRole("link", { name: "Continuar para endereço" });
  await expect(linkEndereco).toBeVisible();

  // 2. Clica para ir para endereço (não bloqueado pela pendência do documento)
  await linkEndereco.click();
  await page.waitForURL(/#address$/);

  // Screenshot 2: Tela de endereço aberta e editável sem travas
  await page.screenshot({ path: `${artifactDir}/02-endereco-aberto-sem-travar.png`, fullPage: true });

  await expect(page.getByRole("heading", { name: "Comprovante de residência" })).toBeVisible();

  // Preenche endereço manualmente
  await page.fill("#address-street", "Avenida Paulista");
  await page.fill("#address-number", "1000");
  await page.fill("#address-neighborhood", "Bela Vista");
  await page.fill("#address-city", "São Paulo");
  await page.fill("#address-state", "SP");

  // Salva endereço
  await page.getByRole("button", { name: "Salvar endereço" }).click();
  await page.waitForTimeout(500);

  expect(patchedAddress).toEqual({
    street: "Avenida Paulista",
    number: "1000",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP"
  });

  // Screenshot 3: Endereço salvo e opções de avançar
  await page.screenshot({ path: `${artifactDir}/03-endereco-salvo-sucesso.png`, fullPage: true });

  // 3. Avança para o Pix
  await page.goto("/promoter/candidate#pix");
  await page.waitForTimeout(500);

  // Screenshot 4: Tela de Pix com botão "Usar meu CPF"
  await page.screenshot({ path: `${artifactDir}/04-pix-tela-com-cpf.png`, fullPage: true });

  const btnUsarCpf = page.getByRole("button", { name: /Usar meu CPF como chave Pix/ });
  await expect(btnUsarCpf).toBeVisible();
  await btnUsarCpf.click();

  // Verifica preenchimento automático do CPF na chave Pix
  const inputPix = page.getByLabel("Chave PIX", { exact: true });
  await expect(inputPix).toHaveValue("123.456.789-00");

  // Salva a chave Pix
  await page.getByRole("button", { name: "Salvar e Continuar" }).click();
  await page.waitForTimeout(500);

  expect(savedPix).toEqual({
    key: "123.456.789-00",
    key_type: "CPF"
  });

  // Screenshot 5: Pix validado com sucesso
  await page.screenshot({ path: `${artifactDir}/05-pix-validado.png`, fullPage: true });

  // 4. Cenário de Aprovação Manual pelo Polo:
  candidateData.status = "approved";
  await page.route("**/api/v1/collaborators/candidate/me", route => route.fulfill({ json: candidateData }));
  await page.route("**/api/v1/clients/promoter/me", route => route.fulfill({ json: { locked: false, status: "active" } }));

  // Clica em atualizar status
  await page.getByRole("button", { name: "Atualizar status" }).click();
  await page.waitForTimeout(1000);

  // Screenshot 6: Visualização após aprovação manual
  await page.screenshot({ path: `${artifactDir}/06-candidato-aprovado-liberado.png`, fullPage: true });
});
