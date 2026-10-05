import { test, expect } from "@playwright/test";

function berlinToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

test("sequential customer and guest changes use the latest draft version", async ({ page }) => {
  const date = berlinToday();
  const startUtc = `${date}T18:00:00Z`;
  let version = 0;
  let payload: Record<string, unknown> = {};
  const seenVersions: number[] = [];

  await page.route("**/api/public/catalog*", route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("kind") === "participants") {
      return route.fulfill({ json: { ok:true, value:{
        primary:{ id:"p1", name:"Test Advisor", title:"Berater", shortDescription:"Test" },
        requiredParticipants:[], options:[],
      } } });
    }
    if (url.searchParams.get("profile")) {
      return route.fulfill({ json:{ ok:true, value:[{
        id:"s1", name:"Erstberatung", description:"Test", durationMinutes:60,
        allowedMeetingModes:["PHONE"],
      }] } });
    }
    return route.fulfill({ json:{ ok:true, value:[{
      id:"p1", name:"Test Advisor", title:"Berater", shortDescription:"Test",
    }] } });
  });

  await page.route("**/api/public/availability*", route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("kind") === "days") {
      return route.fulfill({ json:{ ok:true, value:[date] } });
    }
    return route.fulfill({ json:{ ok:true, value:[{
      startUtc, endUtc:`${date}T19:00:00Z`, localDate:date, localTime:"20:00", offset:"+02:00",
    }] } });
  });

  await page.route("**/api/booking/draft", async route => {
    if (route.request().method() === "GET") return route.fulfill({ status:404, json:{} });
    const body = route.request().postDataJSON();

    if (body.action === "create") {
      version = 0;
      payload = {};
      return route.fulfill({ status:201, json:{ ok:true, value:{ payload, version, expiresAt:"2027-01-01T00:00:00Z" } } });
    }

    if (body.action === "change") {
      seenVersions.push(body.version);
      if (body.version !== version) {
        return route.fulfill({ status:409, json:{ ok:false, error:{ code:"CONFLICT", message:"Entwurf wurde inzwischen geändert." } } });
      }
      version += 1;
      switch (body.command.type) {
        case "primary":
          payload = { primaryProfileId:"p1", participantIds:["p1"] };
          break;
        case "service":
          payload = { ...payload, serviceId:"s1", meetingMode:null, date:null, startUtc:null };
          break;
        case "participants":
          payload = { ...payload, participantIds:["p1"] };
          break;
        case "date":
          payload = { ...payload, date:body.command.date, startUtc:null };
          break;
        case "slot":
          payload = { ...payload, startUtc:body.command.startUtc };
          break;
        case "mode":
          payload = { ...payload, meetingMode:body.command.meetingMode };
          break;
        case "customer":
          payload = { ...payload, customer:body.command.customer };
          break;
        case "guests":
          payload = { ...payload, guests:body.command.guests };
          break;
      }
      return route.fulfill({ json:{ ok:true, value:{ payload, version, expiresAt:"2027-01-01T00:00:00Z" } } });
    }

    if (body.action === "review") {
      return route.fulfill({ json:{ ok:true, value:{
        payload,
        version,
        expiresAt:"2027-01-01T00:00:00Z",
        payloadHash:"a".repeat(64),
        service:{ name:"Erstberatung", durationMinutes:60 },
        participants:[{ name:"Test Advisor", title:"Berater" }],
      } } });
    }
    return route.fulfill({ status:400, json:{ error:"INVALID_ACTION" } });
  });

  await page.goto("/book");
  await page.getByRole("button",{name:/Test Advisor/}).click();
  await page.getByRole("button",{name:/Erstberatung/}).click();
  await page.getByRole("button",{name:"Weiter"}).click();
  await page.getByRole("button",{name:`${date} verfügbar`}).click();
  await page.getByRole("button",{name:/20:00 Uhr/}).click();
  await page.getByRole("button",{name:"Telefon"}).click();

  await page.getByLabel("Vorname *").fill("Max");
  await page.getByLabel("Nachname *").fill("Mustermann");
  await page.getByLabel("E-Mail *").fill("max@example.test");
  await page.getByLabel("Telefon *").fill("+491234567");
  await page.getByLabel("Gäste-E-Mails (optional)").fill("gast@example.test");
  await page.getByRole("button",{name:"Weiter zur Prüfung"}).click();

  await expect(page.getByRole("heading",{name:"Angaben prüfen"})).toBeVisible();
  await expect(page.locator("#booking p[role=\"alert\"]")).toHaveCount(0);
  expect(seenVersions.slice(-2)).toEqual([6,7]);
});
