import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public home is accessible and responsive at 320px", async ({ page }) => {
  await page.setViewportSize({ width:320, height:700 });
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/Beratung beginnt mit einem Termin/})).toBeVisible();
  await expect(page.getByRole("link",{name:"Termin buchen"}).first()).toBeVisible();
  const faq=page.getByRole("searchbox",{name:"FAQ durchsuchen"});
  await expect(faq).toBeVisible();
  await faq.fill("Unterlagen");
  await expect(page.getByText("Brauche ich für die Terminbuchung Unterlagen?")).toBeVisible();
  await faq.fill("nichtvorhanden");
  await expect(page.getByRole("status")).toHaveText("Keine passende Frage gefunden.");
  await faq.fill("");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag22aa"]).analyze();
  expect(result.violations).toEqual([]);
});
