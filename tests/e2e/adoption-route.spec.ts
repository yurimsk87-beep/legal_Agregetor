import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/usynovlenie-rebenka/";

test("adoption landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Усыновление ребёнка" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Усыновление супругом родителя/ })).toBeVisible();
  await page.goto(`${route}?scenario=domestic`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});

test("adoption document starts with scenario-specific eligibility", async ({ page }) => {
  await page.goto("/documents/usynovlenie-rebenka-suprugom-roditelya/");
  await expect(page.getByRole("heading", { level: 1, name: "Усыновление ребёнка супругом родителя" })).toHaveCount(1);
  await expect(page.getByLabel("Кандидат состоит в зарегистрированном браке с родителем ребёнка?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});

test("adoption route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
