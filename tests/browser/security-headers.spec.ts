import { test, expect } from "@playwright/test";
test("production CSP has fresh nonces, working hydration and blocks injected scripts", async ({ page, request }) => {
  const violations: string[] = [];
  page.on("console", message => { if (message.type() === "error" && /content security policy/i.test(message.text())) violations.push(message.text()); });
  const first = await page.goto("/manage"), second = await request.get("/manage");
  const csp = first!.headers()["content-security-policy"], other = second.headers()["content-security-policy"];
  expect(csp).toContain("base-uri 'none'"); expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("unsafe-inline"); expect(csp).not.toContain("unsafe-eval"); expect(csp).not.toBe(other);
  expect(first!.headers()["x-content-type-options"]).toBe("nosniff"); expect(first!.headers()["x-frame-options"]).toBe("DENY");
  expect(first!.headers()["referrer-policy"]).toBe("no-referrer"); expect(first!.headers()["cache-control"]).toContain("no-store");
  expect(first!.headers()["permissions-policy"]).toContain("camera=()");
  await expect(page.getByRole("heading")).toBeVisible(); expect(violations).toEqual([]);
  const nonce = csp.match(/'nonce-([^']+)'/)![1];
  expect(await page.locator("script").evaluateAll(scripts => scripts.every(s => ((s as HTMLScriptElement).nonce ?? "").length > 0))).toBe(true);
  expect(await page.locator("script").first().evaluate(s => (s as HTMLScriptElement).nonce)).toBe(nonce);
  // Inject into the actual HTML parser; DevTools evaluation is a privileged execution context.
  await page.route("**/manage?csp-probe", async route => {
    const response = await route.fetch(), html = await response.text();
    await route.fulfill({ response, body: html.replace("</head>", "<script>window.injectedCspProbe = true</script></head>") });
  });
  await page.goto("/manage?csp-probe");
  expect(await page.evaluate(() => Object.hasOwn(window, "injectedCspProbe"))).toBe(false);
  expect(violations.length).toBeGreaterThan(0);
});

test("public rendered pages produce no unexpected CSP violations", async ({ page }) => {
  const violations:string[]=[];
  page.on("console",message=>{if(message.type()==="error"&&/content security policy/i.test(message.text()))violations.push(message.text())});
  for(const path of ["/","/datenschutz","/impressum"]){
    const response=await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading",{level:1})).toBeVisible();
  }
  expect(violations).toEqual([]);
});

test("internal routes redirect anonymous users to the semantic login form", async ({ page }) => {
  for (const path of ["/internal","/internal/admin","/internal/admin/catalog","/internal/advisor","/internal/advisor/services","/internal/appointments"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
  await expect(page.getByRole("heading", { name: "Interne Anmeldung" })).toBeVisible();
  await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
  await expect(page.getByLabel("Passwort")).toBeVisible();
  await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Passwort vergessen?" })).toBeVisible();
});
