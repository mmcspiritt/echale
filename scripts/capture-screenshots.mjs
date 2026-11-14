import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium, devices } from "playwright";

const baseUrl = "http://localhost:43123";
const outputDir = "/opt/cursor/artifacts";

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  // Home (desktop 1440)
  const homeContext = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const homePage = await homeContext.newPage();
  await homePage.goto(baseUrl, { waitUntil: "networkidle" });

  // Styling validation guardrails.
  const homeStyles = await homePage.evaluate(() => {
    const cta = Array.from(document.querySelectorAll("a,button")).find((element) =>
      element.textContent?.includes("Crea tu página") ||
      element.textContent?.includes("Crear mi página"),
    );
    const heroTitle = document.querySelector("h1");
    const ctaStyle = cta ? getComputedStyle(cta) : null;
    const titleStyle = heroTitle ? getComputedStyle(heroTitle) : null;
    return {
      ctaBg: ctaStyle?.backgroundColor ?? "",
      titleFontSize: titleStyle?.fontSize ?? "0px",
      titleFontFamily: titleStyle?.fontFamily ?? "",
    };
  });

  if (!homeStyles.ctaBg.includes("228, 0, 124")) {
    throw new Error(`Expected pink CTA background, got ${homeStyles.ctaBg}`);
  }
  if (Number.parseFloat(homeStyles.titleFontSize) < 44) {
    throw new Error(`Expected large hero title style, got ${homeStyles.titleFontSize}`);
  }

  await homePage.screenshot({
    path: `${outputDir}/echale-home.png`,
    fullPage: true,
  });
  await homeContext.close();

  // Crear página
  const createContext = await browser.newContext({
    viewport: { width: 1440, height: 980 },
  });
  const createPage = await createContext.newPage();
  await createPage.goto(`${baseUrl}/crear`, { waitUntil: "networkidle" });
  await createPage.getByRole("heading", { name: /cuéntanos tu historia/i }).first().waitFor();
  await createPage.screenshot({
    path: `${outputDir}/echale-crear.png`,
    fullPage: true,
  });
  await createContext.close();

  // Create a pending story from API (mock mode)
  const pendingPayload = {
    beneficiaryName: "Historia Pendiente Demo",
    accountHolderName: "Historia Pendiente Demo",
    contactEmail: "demo@echale.mx",
    city: "CDMX",
    category: "vivienda",
    story:
      "Esta es una historia de prueba para validar el estado en revisión y capturar pantalla de la vista previa privada para el flujo de moderación.",
    goalAmount: 18000,
    milestones: [
      { label: "Material básico", targetAmount: 5000 },
      { label: "Mano de obra", targetAmount: 11000 },
      { label: "Cierre de obra", targetAmount: 18000 },
    ],
    photoUrl: "/images/lupita-oaxaca.jpg",
    clabe: "000000000000000001",
    entity: "PERSON",
    taxId: null,
  };
  const pendingResponse = await fetch(`${baseUrl}/api/stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pendingPayload),
  });
  if (!pendingResponse.ok) {
    const body = await pendingResponse.text();
    throw new Error(`Failed to create pending story: ${pendingResponse.status} ${body}`);
  }
  const pendingResult = await pendingResponse.json();
  if (!pendingResult.previewPath) {
    throw new Error("Pending story response did not include previewPath");
  }

  const pendingContext = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
  });
  const pendingPage = await pendingContext.newPage();
  await pendingPage.goto(`${baseUrl}${pendingResult.previewPath}`, { waitUntil: "networkidle" });
  await pendingPage.getByText("está en revisión por la organización aliada").waitFor();
  await pendingPage.screenshot({
    path: `${outputDir}/echale-story-pending-mobile.png`,
    fullPage: true,
  });
  await pendingContext.close();

  // Story page (mobile 390)
  const mobileContext = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${baseUrl}/miriam`, { waitUntil: "networkidle" });
  await mobilePage.evaluate(() => window.scrollTo(0, 500));
  await mobilePage.waitForTimeout(300);

  const stickyVisible = await mobilePage.getByRole("button", { name: /Apoyar con CoDi/i }).first().isVisible();
  if (!stickyVisible) {
    throw new Error("Sticky support button is not visible on mobile story page");
  }

  await mobilePage.screenshot({
    path: `${outputDir}/echale-story-mobile.png`,
    fullPage: true,
  });
  await mobileContext.close();

  // Support flow + thank you
  const supportContext = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
  });
  const supportPage = await supportContext.newPage();
  await supportPage.goto(`${baseUrl}/adrian`, { waitUntil: "networkidle" });
  await supportPage.getByRole("button", { name: /Apoyar con CoDi/i }).first().click();
  await supportPage.getByRole("button", { name: /Apoyar con CoDi ·/i }).click();
  await supportPage.getByText("Escanea el código con tu app bancaria").waitFor();

  const modalBg = await supportPage.locator('[data-testid="support-modal-panel"]').evaluate((node) => {
    return getComputedStyle(node).backgroundColor;
  });
  if (modalBg !== "rgb(255, 255, 255)") {
    throw new Error("Support modal styles look broken");
  }

  await supportPage.screenshot({
    path: `${outputDir}/echale-support-flow.png`,
    fullPage: true,
  });

  await supportPage.getByRole("button", { name: /Simular pago exitoso/i }).click();
  await supportPage.getByText("¡Gracias por echar la mano!").waitFor();
  await supportPage.screenshot({
    path: `${outputDir}/echale-thank-you.png`,
    fullPage: true,
  });
  await supportContext.close();

  // Admin
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
  });
  const adminPassword = process.env.ADMIN_PASSWORD ?? "echale-demo-admin";
  const adminSalt = process.env.ADMIN_SESSION_SALT ?? "echale";
  const token = createHash("sha256").update(adminPassword).update(adminSalt).digest("hex");
  await adminContext.addCookies([
    {
      name: "echale-admin-session",
      value: token,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await adminPage.getByRole("heading", { name: /Admin/i }).first().waitFor();
  await adminPage.screenshot({
    path: `${outputDir}/echale-admin.png`,
    fullPage: true,
  });
  await adminPage.screenshot({
    path: `${outputDir}/echale-admin-moderacion.png`,
    fullPage: true,
  });
  await adminContext.close();
} finally {
  await browser.close();
}

console.log("Screenshots saved in /opt/cursor/artifacts");
