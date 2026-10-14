import { expect, test } from "@playwright/test";
import { getLegalRouteRegistry } from "../../src/data/legal-route-standard";

const routes = getLegalRouteRegistry();

for (const route of routes) {
  test(`shared accessible journey: ${route.categorySlug}/${route.problemSlug}`, async ({ page }) => {
    const response = await page.goto(route.problemUrl);
    expect(response?.status()).toBe(200);
    const journey = page.getByRole("navigation", { name: "Этапы юридического маршрута" });
    await expect(journey).toBeVisible();
    await expect(journey.getByRole("listitem")).toHaveCount(5);
    await expect(journey.locator('[aria-current="step"]')).toContainText("Ситуация");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
}

test("document pages retain the same route stages", async ({ page }) => {
  await page.goto("/documents/mesto-zhitelstva-rebenka-posle-razvoda/");
  const journey = page.getByRole("navigation", { name: "Этапы юридического маршрута" });
  await expect(journey).toBeVisible();
  await expect(journey.locator('[aria-current="step"]')).toContainText("Анкета");
});

test("labor document pages use the shared journey too", async ({ page }) => {
  await page.goto("/documents/zapros-osnovaniy-planiruemogo-uvolneniya/");
  const journey = page.getByRole("navigation", { name: "Этапы юридического маршрута" });
  await expect(journey).toBeVisible();
  await expect(journey.locator('[aria-current="step"]')).toContainText("Анкета");
});
