import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function berlinToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

test("calendar disables days with no bookable slots before interaction", async ({ page }) => {
  const today = berlinToday();
  const [year, month, day] = today.split("-").map(Number);
  const unavailableDay = day === 1 ? 2 : 1;
  const unavailable = `${year}-${String(month).padStart(2,"0")}-${String(unavailableDay).padStart(2,"0")}`;

  await page.route("**/api/public/catalog*", route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("kind") === "participants") {
      return route.fulfill({ json: { ok: true, value: {
        primary: { id:"p1", name:"Test Advisor", title:"Berater", shortDescription:"Test" },
        requiredParticipants: [], options: [],
      } } });
    }
    if (url.searchParams.get("profile")) {
      return route.fulfill({ json: { ok: true, value: [{
        id:"s1", name:"Erstberatung", description:"Test", durationMinutes:60,
        allowedMeetingModes:["IN_PERSON"],
      }] } });
    }
    return route.fulfill({ json: { ok: true, value: [{
      id:"p1", name:"Test Advisor", title:"Berater", shortDescription:"Test",
    }] } });
  });

  let version = 0;
  let payload: Record<string, unknown> = {};
  await page.route("**/api/booking/draft", async route => {
    if (route.request().method() === "GET") return route.fulfill({ status:404, json:{} });
    const body = route.request().postDataJSON();
    if (body.action === "create") {
      version += 1; payload = {};
    } else if (body.action === "change") {
      version += 1;
      if (body.command.type === "primary") payload = { primaryProfileId:"p1", participantIds:["p1"] };
      if (body.command.type === "service") payload = { ...payload, serviceId:"s1" };
      if (body.command.type === "participants") payload = { ...payload, participantIds:["p1"] };
    }
    return route.fulfill({ json:{ ok:true, value:{ payload, version, expiresAt:"2027-01-01T00:00:00Z" } } });
  });
  await page.route("**/api/public/availability*", route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("kind") === "days") {
      return route.fulfill({ json:{ ok:true, value:[today] } });
    }
    return route.fulfill({ json:{ ok:true, value:[] } });
  });

  await page.goto("/book");
  await page.getByRole("button",{name:/Test Advisor/}).click();
  await page.getByRole("button",{name:/Erstberatung/}).click();
  await page.getByRole("button",{name:"Weiter"}).click();

  await expect(page.getByRole("heading",{name:"Datum und Uhrzeit"})).toBeVisible();
  await expect(page.locator('input[type="date"]')).toHaveCount(0);
  await expect(page.getByRole("button",{name:`${today} verfügbar`})).toBeEnabled();
  await expect(page.getByRole("button",{name:`${unavailable} nicht verfügbar`})).toBeDisabled();

  const accessibility = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag22aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});
