import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/imya-familiya-otchestvo-rebenka/";

test("child name landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Имя, фамилия и отчество ребёнка" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Ребёнку нет 14 лет, родители согласны/ })).toBeVisible();
  await page.goto(`${route}?scenario=fourteen-to-seventeen`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});

test("child name document starts with the age question", async ({ page }) => {
  await page.goto("/documents/peremena-imeni-rebenkom-ot-14-do-18-let/");
  await expect(page.getByRole("heading", { level: 1, name: "Перемена имени ребёнком от 14 до 18 лет" })).toHaveCount(1);
  await expect(page.getByLabel("Возраст")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});

test("child name route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
