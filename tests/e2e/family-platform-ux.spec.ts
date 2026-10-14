import { expect, test } from "@playwright/test";

test("documents catalog supports search, tags, reset and empty results", async ({ page }) => {
  await page.goto("/documents/");
  await expect(page.getByRole("heading", { level: 1, name: "Юридические документы" })).toBeVisible();
  await expect(page.getByText(/Найдите нужный документ по названию или жизненной ситуации/)).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Поиск документов" });
  await search.fill("алименты");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByRole("combobox", { name: "Вид права" }).selectOption("Семейное право");
  await expect(page.locator("article").first()).toBeVisible();

  await search.fill("документ-которого-точно-нет");
  await expect(page.getByText("Документы не найдены")).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).last().click();
  await expect(page.locator("article").first()).toBeVisible();
});

test("problems page is concise and family cards use instruction CTA", async ({ page }) => {
  await page.goto("/problems/");
  await expect(page.getByRole("heading", { level: 1, name: "Юридические ситуации" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Доступные ситуации" })).toHaveCount(0);

  await page.goto("/problems/semya-i-deti/");
  await expect(page.getByRole("link", { name: "Понять, что делать" }).first()).toBeVisible();
});

test("document preparation keeps scenario and opens a new tab", async ({ page }) => {
  await page.goto("/problems/semya-i-deti/obshchenie-rodstvennikov-s-rebenkom/?scenario=court");
  const link = page.getByRole("link", { name: "Подготовить материал" });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(link).toHaveAttribute("href", /variant=court/);
});

test("tools catalog exposes only implemented tools and a working route", async ({ page }) => {
  await page.goto("/tools/");
  await expect(page.getByRole("heading", { name: "Доступные инструменты" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Калькулятор срока отмены судебного приказа/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Калькулятор госпошлины/ })).toHaveCount(0);
  await page.goto("/tools/sudebnyy-prikaz-deadline/");
  await expect(page.getByRole("heading", { level: 1, name: "Калькулятор срока отмены судебного приказа" })).toBeVisible();
});

test("documents catalog and implemented tools fit supported mobile widths", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/documents/", "/tools/sudebnyy-prikaz-deadline/"]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => { const box = el.getBoundingClientRect(); return box.width > 0 && (box.right > document.documentElement.clientWidth + 1 || box.left < -1); }).slice(0, 12).map((el) => ({ tag: el.tagName, className: typeof el.className === "string" ? el.className.slice(0, 100) : "", text: el.textContent?.trim().slice(0, 65), right: Math.round(el.getBoundingClientRect().right) }))))).toBe(false);
    }
  }
});

test("unknown family tool is a real 404", async ({ request }) => {
  const response = await request.get("/tools/not-a-tool/");
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain("noindex");
});
