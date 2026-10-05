import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/osparivanie-otcovstva/";
test("paternity contest landing and canonical scenario", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1, name: "Оспаривание отцовства" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Вы записаны отцом или матерью/ })).toBeVisible();
  await page.goto(`${route}?scenario=biological-parent`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});
test("paternity contest document starts with record subject", async ({ page }) => {
  await page.goto("/documents/isk-ob-osparivanii-otcovstva-zapisannym-roditelem/");
  await expect(page.getByRole("heading", { level: 1, name: "Иск записанного родителя об оспаривании отцовства" })).toHaveCount(1);
  await expect(page.getByLabel("Чью запись нужно оспорить?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});
test("paternity contest route has no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(route);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
