import { chromium } from '@playwright/test';
import path from 'path';

async function capture() {
  const artifactDir = "C:\\Users\\maestri33\\.gemini\\antigravity\\brain\\69c0e170-a426-469c-aa35-2417fe5f5ed7";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3030/tabs-demo...");
  await page.goto("http://localhost:3030/tabs-demo", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Print 1: Aba 1 (Matrícula)
  const print1Path = path.join(artifactDir, "tabs_approved_matricula.png");
  await page.screenshot({ path: print1Path, fullPage: true });
  console.log("Saved print 1:", print1Path);

  // Click Aba 2: Certificação Oficial MEC
  const tab2 = page.locator("button[role='tab']", { hasText: "Certificação Oficial MEC" });
  await tab2.click();
  await page.waitForTimeout(600);

  // Print 2: Aba 2 (Certificação)
  const print2Path = path.join(artifactDir, "tabs_approved_certificacao.png");
  await page.screenshot({ path: print2Path, fullPage: true });
  console.log("Saved print 2:", print2Path);

  // Click Aba 3: Exame Presencial no Polo
  const tab3 = page.locator("button[role='tab']", { hasText: "Exame Presencial no Polo" });
  await tab3.click();
  await page.waitForTimeout(600);

  // Print 3: Aba 3 (Polo)
  const print3Path = path.join(artifactDir, "tabs_approved_polo.png");
  await page.screenshot({ path: print3Path, fullPage: true });
  console.log("Saved print 3:", print3Path);

  // Mobile Viewport Print
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const printMobilePath = path.join(artifactDir, "tabs_approved_mobile.png");
  await page.screenshot({ path: printMobilePath, fullPage: true });
  console.log("Saved mobile print:", printMobilePath);

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch(err => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
