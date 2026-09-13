import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/ustanovlenie-otcovstva/";
test("paternity establishment landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Установление отцовства" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Установить отцовство добровольно/ })).toBeVisible();
  await page.goto(`${route}?scenario=court`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});
test("paternity document starts with record check", async ({ page }) => {
  await page.goto("/documents/isk-ob-ustanovlenii-otcovstva/");
  await expect(page.getByRole("heading", { level: 1, name: "Иск об установлении отцовства" })).toHaveCount(1);
  await expect(page.getByLabel("В записи о рождении уже указан другой отец?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});
test("paternity route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
