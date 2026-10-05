import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const token = "x".repeat(43);
function berlinToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone:"Europe/Berlin", year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(new Date());
  const get=(type:string)=>parts.find(p=>p.type===type)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}
const availableDay=berlinToday();
const view = { startUtc: "2027-01-06T08:00:00Z", endUtc: "2027-01-06T08:30:00Z", status: "CONFIRMED", version: 0, serviceName: "Testberatung", durationMinutes: 30, participantNames: ["Testberater"], meetingMode: "PHONE", allowedModes: ["PHONE", "ONLINE"], canChange: true, phoneDirection: "ADVISOR_CALLS_CLIENT" };

test("capability stays out of URL/storage/referrer; unavailable days are disabled; accessible at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.url()); });
  await page.route("**/api/customer-appointment", async route => {
    const body=route.request().postDataJSON();
    expect(body.token).toBe(token);
    expect(route.request().headers().referer).toBeUndefined();
    if(body.action==="days") return route.fulfill({json:{value:[availableDay]}});
    await route.fulfill({ json: { value: view } });
  });
  const response = await page.goto("/manage#token="+token);
  await expect(page.getByRole("heading", { name: "Testberatung" })).toBeVisible();
  await expect(page.getByRole("button",{name:availableDay+" verfügbar"})).toBeEnabled();
  const [y,m,d]=availableDay.split("-").map(Number), count=new Date(Date.UTC(y,m,0)).getUTCDate();
  const unavailable=d<count?availableDay.slice(0,8)+String(d+1).padStart(2,"0"):availableDay.slice(0,8)+String(Math.max(1,d-1)).padStart(2,"0");
  if(unavailable!==availableDay) await expect(page.getByRole("button",{name:unavailable+" nicht verfügbar"})).toBeDisabled();
  expect(page.url()).not.toContain("#");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  expect(requests.every(url => !url.includes(token) && url.startsWith("http://127.0.0.1:3218"))).toBe(true);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("slot offsets and explicit cancellation confirmation are usable", async ({ page }) => {
  let cancelled = false;
  await page.route("**/api/customer-appointment", async route => {
    const body = route.request().postDataJSON();
    if (body.action === "days") return route.fulfill({json:{value:[availableDay]}});
    if (body.action === "slots") return route.fulfill({ json: { value: [
      { startUtc: "2027-10-31T00:30:00Z", localTime: "02:30", offset: "+02:00" },
      { startUtc: "2027-10-31T01:30:00Z", localTime: "02:30", offset: "+01:00" },
    ] } });
    if (body.action === "change") { expect(body.command.type).toBe("cancel"); cancelled = true; return route.fulfill({ json: { value: { status: "CANCELLED", version: 1 } } }); }
    await route.fulfill({ json: { value: view } });
  });
  await page.goto("/manage#token="+token);
  await page.getByRole("button",{name:availableDay+" verfügbar"}).click();
  await expect(page.getByRole("option", { name: "02:30 Uhr (UTC+02:00)" })).toHaveCount(1);
  await expect(page.getByRole("option", { name: "02:30 Uhr (UTC+01:00)" })).toHaveCount(1);
  await page.getByRole("button", { name: "Absage bestätigen" }).click(); expect(cancelled).toBe(false);
  await page.getByRole("checkbox").check(); await page.getByRole("button", { name: "Absage bestätigen" }).click();
  await expect(page.getByRole("status")).toHaveText("Ihr Termin wurde abgesagt.");
  await expect(page.getByRole("heading", { name: "Testberatung" })).toHaveCount(0);
});

test("invalid link displays no appointment or management form", async ({ page }) => {
  await page.route("**/api/customer-appointment", route => route.fulfill({ status: 404, json: { error: "NOT_FOUND", message: "Verwaltungslink nicht verfügbar." } }));
  await page.goto("/manage#token=invalid"); await expect(page.getByRole("status")).toHaveText("Verwaltungslink nicht verfügbar.");
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("network retry preserves command identity and reload keeps the in-memory capability", async ({ page }) => {
  const keys: string[] = []; let changed = false;
  await page.route("**/api/customer-appointment", async route => {
    const body = route.request().postDataJSON();
    if(body.action==="days") return route.fulfill({json:{value:[availableDay]}});
    if (body.action === "change") {
      keys.push(body.commandKey); expect(body.command.meetingMode).toBe("ONLINE");
      if (keys.length === 1) return route.fulfill({ status: 503, json: { message: "Vorübergehend nicht verfügbar." } });
      changed = true; return route.fulfill({ json: { value: { status: "CONFIRMED", version: 1, replay: true } } });
    }
    await route.fulfill({ json: { value: { ...view, version: changed ? 1 : 0, meetingMode: changed ? "ONLINE" : "PHONE" } } });
  });
  await page.goto("/manage#token="+token);
  await page.getByLabel("Besprechungsart").selectOption("ONLINE");
  await page.getByRole("button", { name: "Änderung bestätigen" }).click();
  await expect(page.getByRole("status")).toHaveText("Vorübergehend nicht verfügbar.");
  await page.getByRole("button", { name: "Änderung bestätigen" }).click();
  await expect(page.getByRole("status")).toHaveText("Ihr Termin wurde aktualisiert.");
  expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
  await page.getByRole("button", { name: "Termin neu laden" }).click();
  await expect(page.getByRole("status")).toHaveText("Aktueller Termin geladen.");
});
