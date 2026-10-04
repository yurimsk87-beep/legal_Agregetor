import { expect, test } from "@playwright/test";
const path = "/problems/semya-i-deti/priznanie-braka-nedeystvitelnym/";
test("invalid marriage landing is canonical", async ({ page }) => { await page.goto(path); await expect(page.getByRole("heading", { level: 1, name: "Признание брака недействительным" })).toHaveCount(1); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`)); });
test("invalid marriage has five paths", async ({ page }) => { await page.goto(path); for (const scenario of ["consent", "underage", "obstacle", "fictitious", "concealed-health"]) await expect(page.locator(`a[href$="?scenario=${scenario}"]`).first()).toBeVisible(); });
test("invalid marriage has no overflow at 320px", async ({ page }) => { await page.setViewportSize({ width: 320, height: 900 }); await page.goto(path); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false); });
