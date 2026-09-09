import { expect, test } from "@playwright/test";

const route = "/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/";

test("canonical route is usable on mobile", async ({ page }) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Родители и ребёнок после развода");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Определить, с кем будет жить ребёнок" }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const boxes = await page.locator('section[aria-label="Сценарии родителей и ребёнка после развода"] a').evaluateAll((links) => links.map((link) => ({ width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height })));
    expect(boxes.length).toBe(4);
    expect(boxes.every((box) => box.width >= 44 && box.height >= 44)).toBe(true);
  }
});

test("urgent answer stops ordinary document flow", async ({ page }) => {
  await page.goto(`${route}?scenario=residence`);
  await page.getByRole("link", { name: "Подготовить документ" }).click();
  await page.getByLabel(/непосредственная угроза/).selectOption("yes");
  await page.getByRole("button", { name: "Подготовить документ" }).click();
  await expect(page.getByRole("heading", { name: "Не откладывайте обращение ради документа" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Позвонить 112" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Скачать PDF" })).toHaveCount(0);
});

test("query pages are noindex with clean canonical", async ({ page }) => {
  await page.goto(`${route}?scenario=communication`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route.replaceAll("/", "\\/")}$`));
});

test("scenario is keyboard reachable", async ({ page }) => {
  await page.goto(route);
  const choice = page.getByRole("link", { name: "Определить порядок общения с ребёнком" }).first();
  await choice.focus();
  await expect(choice).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Определить порядок общения с ребёнком" })).toBeVisible();
});

test("sitemap and unknown route have correct HTTP behavior", async ({ request }) => {
  const sitemap = await request.get("/sitemap-problems.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(route);
  const missing = await request.get("/problems/semya-i-deti/neizvestnyy-marshrut/");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("noindex");
});
