import { chromium } from '@playwright/test';
import path from 'path';

async function capture() {
  const artifactDir = "C:\\Users\\maestri33\\.gemini\\antigravity\\brain\\69c0e170-a426-469c-aa35-2417fe5f5ed7";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3050/tabs-demo...");
  await page.goto("http://localhost:3050/tabs-demo", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Cenário Duplo: Aluno + Promotor (Aluno ativo)
  const print1Path = path.join(artifactDir, "trirole_aluno_ativo.png");
  await page.screenshot({ path: print1Path, fullPage: true });
  console.log("Saved print 1:", print1Path);

  // 2. Cenário Duplo: Promotor ativo
  const promotorTab = page.locator("button[role='tab']", { hasText: "Promotor" });
  await promotorTab.click();
  await page.waitForTimeout(600);
  const print2Path = path.join(artifactDir, "trirole_promotor_ativo.png");
  await page.screenshot({ path: print2Path, fullPage: true });
  console.log("Saved print 2:", print2Path);

  // 3. Cenário Triplo: Aluno + Promotor + Coordenador do Polo (Coordenador ativo)
  const btnTriplo = page.locator("button:has-text('Aluno + Promotor + Coordenador do Polo')");
  await btnTriplo.click();
  await page.waitForTimeout(600);

  const poloTab = page.locator("button[role='tab']", { hasText: "Coordenador do Polo" });
  await poloTab.click();
  await page.waitForTimeout(600);
  const print3Path = path.join(artifactDir, "trirole_coordenador_polo_ativo.png");
  await page.screenshot({ path: print3Path, fullPage: true });
  console.log("Saved print 3:", print3Path);

  // 4. Cenário de 1 Role: Apenas Aluno (Zero Tabs)
  const btnApenasAluno = page.locator("button:has-text('Apenas Aluno')");
  await btnApenasAluno.click();
  await page.waitForTimeout(600);
  const print4Path = path.join(artifactDir, "trirole_apenas_aluno_zero_tabs.png");
  await page.screenshot({ path: print4Path, fullPage: true });
  console.log("Saved print 4:", print4Path);

  // 5. Cenário de 1 Role: Apenas Coordenador do Polo (Zero Tabs)
  const btnApenasPolo = page.locator("button:has-text('Apenas Coordenador do Polo')");
  await btnApenasPolo.click();
  await page.waitForTimeout(600);
  const print5Path = path.join(artifactDir, "trirole_apenas_polo_zero_tabs.png");
  await page.screenshot({ path: print5Path, fullPage: true });
  console.log("Saved print 5:", print5Path);

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch(err => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
