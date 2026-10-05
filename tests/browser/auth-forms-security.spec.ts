import { test, expect } from "@playwright/test";

test("sensitive auth forms fail closed before hydration", async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();

  await page.goto("/login");
  await expect(page.locator("form")).toHaveAttribute("method","post");
  await expect(page.getByRole("button",{name:"Anmelden"})).toBeDisabled();

  await page.goto("/forgot-password");
  await expect(page.locator("form")).toHaveAttribute("method","post");
  await expect(page.getByRole("button",{name:"Link anfordern"})).toBeDisabled();

  await page.goto("/reset-password?token=probe-token");
  await expect(page.locator("form")).toHaveAttribute("method","post");
  await expect(page.getByRole("button",{name:"Passwort speichern"})).toBeDisabled();
  await context.close();
});

test("reset token is removed from the browser URL after hydration", async ({ page }) => {
  await page.goto("/reset-password?token=probe-token");
  await expect(page.getByRole("button",{name:"Passwort speichern"})).toBeEnabled();
  await expect(page).toHaveURL(/\/reset-password$/);
  expect(page.url()).not.toContain("probe-token");
});

test("login waits for hydration and never submits credentials through the URL", async ({ page }) => {
  await page.goto("/login");
  const button=page.getByRole("button",{name:"Anmelden"});
  await expect(button).toBeEnabled();
  await page.getByLabel("E-Mail-Adresse").fill("nobody@example.test");
  await page.getByLabel("Passwort").fill("not-a-valid-password");
  await button.click();
  await expect(page.locator("form p[role=\"alert\"]")).toHaveText("E-Mail-Adresse oder Passwort ist falsch.");
  expect(page.url()).toBe("http://127.0.0.1:3218/login");
  expect(page.url()).not.toContain("nobody");
  expect(page.url()).not.toContain("not-a-valid-password");
});
