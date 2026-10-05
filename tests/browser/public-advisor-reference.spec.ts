import "dotenv/config";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for browser tests.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const profileId = "playwright-public-advisor-profile";
const serviceId = "playwright-public-advisor-service";
const slug = "playwright-reference-advisor";

test.beforeAll(async () => {
  await db.service.deleteMany({ where: { advisorProfileId: profileId } });
  await db.advisorProfile.deleteMany({ where: { OR: [{ id: profileId }, { publicSlug: slug }] } });

  await db.advisorProfile.create({
    data: {
      id: profileId,
      name: "Reference Test Advisor",
      title: "Beratung",
      shortDescription: "Synthetisches öffentliches Profil für Browsertests.",
      notificationEmail: "reference-advisor@example.test",
      imageKey: "playwright-reference.webp",
      publicSlug: slug,
      aboutText: "Persönliche und strukturierte Begleitung für einen reproduzierbaren Browsertest.",
      publicEmail: "public-advisor@example.test",
      publicPhone: "+49 6000 123456",
      publicWebsite: "https://example.test",
      publicAddress: "Teststraße 1, 00000 Teststadt",
      accentColor: "#1F5F8B",
      showDvagPartners: false,
      digitalCardEnabled: true,
      status: "ACTIVE",
    },
  });

  await db.service.create({
    data: {
      id: serviceId,
      advisorProfileId: profileId,
      name: "Erstgespräch",
      description: "Öffentlich buchbare Testleistung.",
      durationMinutes: 30,
      active: true,
      meetingModePolicy: "FIXED",
      allowedMeetingModes: ["PHONE"],
      phoneDirection: "ADVISOR_CALLS_CLIENT",
    },
  });
});

test.afterAll(async () => {
  await db.service.deleteMany({ where: { advisorProfileId: profileId } }).catch(() => {});
  await db.advisorProfile.deleteMany({ where: { id: profileId } }).catch(() => {});
  await db.$disconnect();
});

test("advisor microsite routes are linked, responsive and accessible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  const routes = [
    ["", "Reference Test Advisor"],
    ["/ueber-mich", "Persönlich begleiten. Verständlich bleiben."],
    ["/ansatz", "Erst Klarheit, dann der nächste Schritt."],
    ["/themen", "Das Gespräch passend zum Anliegen auswählen."],
    ["/kontakt", "Der passende Weg für Ihr Anliegen."],
    ["/karte", "Reference Test Advisor"],
    ["/kundenbereich", "Termin, Vorbereitung und externe Kundenservices."],
    ["/rechner", "Zahlen zuerst selbst einordnen."],
    ["/karriere", "Mehr über Einstiegsmöglichkeiten bei der DVAG erfahren."],
    ["/vorbereitung", "Mit den richtigen Fragen in das Gespräch gehen."],
    ["/service-hilfe", "Für jedes Anliegen die richtige Anlaufstelle."],
    ["/sos", "Bei Gefahr zuerst die richtige Hilfe erreichen."],
  ] as const;

  for (const [suffix, heading] of routes) {
    const response = await page.goto("/berater/" + slug + suffix, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Reference Test Advisor | Beratung");
    await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  const compatibility = await page.goto("/berater/" + slug + "/service", { waitUntil: "networkidle" });
  expect(compatibility?.status()).toBe(200);
  expect(page.url()).toContain("/service-hilfe");

  await page.goto("/berater/" + slug + "/kontakt");
  await expect(page.getByRole("link", { name: /public-advisor@example\.test/ })).toHaveAttribute("href", "mailto:public-advisor@example.test");
  await expect(page.getByRole("link", { name: /\+49 6000 123456/ })).toHaveAttribute("href", "tel:+496000123456");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/496000123456");

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("digital card exposes only public contact data through local QR and vCard", async ({ request, page }) => {
  const qr = await request.get("/api/public/advisors/" + slug + "/qr");
  expect(qr.status()).toBe(200);
  expect(qr.headers()["content-type"]).toContain("image/svg+xml");
  const svg = await qr.text();
  expect(svg).toContain("<svg");
  expect(svg).not.toContain("google");
  expect(svg).not.toContain("qrserver");

  const vcard = await request.get("/api/public/advisors/" + slug + "/vcard");
  expect(vcard.status()).toBe(200);
  const card = await vcard.text();
  expect(card).toContain("FN:Reference Test Advisor");
  expect(card).toContain("public-advisor@example.test");
  expect(card).toContain("+49 6000 123456");
  expect(card).not.toContain("reference-advisor@example.test");

  await page.goto("/berater/" + slug + "/karte");
  await expect(page.getByRole("img", { name: /QR-Code zur digitalen Karte/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kontakt speichern (.vcf)" })).toHaveAttribute("href", "/api/public/advisors/" + slug + "/vcard");
});

test("calculator stays client-side and does not transmit entered values", async ({ page }) => {
  await page.goto("/berater/" + slug + "/rechner");
  await page.waitForLoadState("networkidle");

  const applicationRequests: { method: string; url: string; body: string }[] = [];
  page.on("request", request => {
    if (request.url().includes("/api/") || request.method() !== "GET") {
      applicationRequests.push({ method: request.method(), url: request.url(), body: request.postData() ?? "" });
    }
  });

  await expect(page.getByText("500 €", { exact: true })).toBeVisible();
  await page.getByLabel("Nettoeinnahmen pro Monat").fill("3000");
  await expect(page.getByText("1.000 €", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Reserve" }).click();
  await expect(page.getByText("4.500 €", { exact: true })).toBeVisible();

  expect(applicationRequests).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});
