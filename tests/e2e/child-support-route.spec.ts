import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/alimenty-na-rebenka/";

test("child support landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Алименты на ребёнка" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Взыскать алименты впервые/ })).toBeVisible();
  await page.goto(`${route}?scenario=first`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});

test("child support document starts deterministic questionnaire", async ({ page }) => {
  await page.goto("/documents/vzyskanie-alimentov-na-rebenka/");
  await expect(page.getByRole("heading", { level: 1, name: "Взыскание алиментов на ребёнка" })).toHaveCount(1);
  await expect(page.getByLabel("Ребёнок младше 18 лет?" )).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});

test("child support route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
