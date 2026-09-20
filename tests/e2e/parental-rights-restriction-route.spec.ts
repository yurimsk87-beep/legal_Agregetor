import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/ogranichenie-roditelskih-prav/";

test("parental rights restriction landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Ограничение родительских прав" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Опасность не зависит от родителя/ })).toBeVisible();
  await page.goto(`${route}?scenario=court`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});

test("restriction document starts with emergency safety question", async ({ page }) => {
  await page.goto("/documents/isk-ob-ogranichenii-roditelskih-prav/");
  await expect(page.getByRole("heading", { level: 1, name: "Иск об ограничении родительских прав" })).toHaveCount(1);
  await expect(page.getByLabel("Сейчас есть непосредственная угроза жизни или здоровью ребёнка?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});

test("restriction route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

