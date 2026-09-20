import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/lishenie-roditelskih-prav/";

test("parental rights deprivation landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Лишение родительских прав" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Проверить предполагаемое основание/ })).toBeVisible();
  await page.goto(`${route}?scenario=court`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});

test("deprivation document starts with emergency safety question", async ({ page }) => {
  await page.goto("/documents/isk-o-lishenii-roditelskih-prav/");
  await expect(page.getByRole("heading", { level: 1, name: "Иск о лишении родительских прав" })).toHaveCount(1);
  await expect(page.getByLabel("Сейчас есть непосредственная угроза жизни или здоровью ребёнка?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});

test("deprivation route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
