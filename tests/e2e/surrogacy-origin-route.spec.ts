import { expect, test } from "@playwright/test";

const problemPath = "/problems/semya-i-deti/surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka/";
const documentPath = "/documents/surrogatnoe-materinstvo-list-dannyh/";

test("surrogacy landing has one H1 and five paths", async ({ page }) => {
  await page.goto(problemPath);
  await expect(page.getByRole("heading", { level: 1, name: "Суррогатное материнство и происхождение ребёнка" })).toHaveCount(1);
  for (const key of ["registration", "consents", "origin", "dispute", "foreign"]) {
    await expect(page.locator(`a[href$="?scenario=${key}"]`)).toBeVisible();
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${problemPath}$`));
});

test("surrogacy query state is not indexed", async ({ page }) => {
  await page.goto(`${problemPath}?scenario=dispute`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Подготовить лист сведений" })).toHaveAttribute("href", `${documentPath}?variant=dispute#fill-online`);
});

test("surrogacy helper never declares filing readiness", async ({ page }) => {
  await page.route("**/api/legal-review-lawyers/**", async (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ ok: true, service: "semeynye-spory", items: [{ id: "lawyer-1", slug: "lawyer-1", fullName: "Иванова Анна", specialization: "Семейное право", cityId: "city-1" }], message: null })
  }));
  await page.goto(`${documentPath}?variant=registration`);
  await page.getByLabel("Ребёнок уже родился?").selectOption("yes");
  await page.getByLabel("Кто предполагает обратиться: супруги, одинокая женщина или другое лицо?").selectOption("spouses");
  await page.getByLabel("Запись о рождении уже составлена?").selectOption("no");
  await page.getByLabel("Есть медицинский документ о рождении?").selectOption("yes");
  await page.getByLabel("Есть подтверждённое согласие суррогатной матери на запись заявителей родителями?").selectOption("no");
  await page.getByRole("button", { name: "Получить чек-лист" }).click();
  await expect(page.getByText("Готово к подаче: нет. Юридическая проверка обязательна.")).toBeVisible();
  await expect(page.getByText(/Согласие суррогатной матери на запись родителей не подтверждено/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Скачать PDF" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Профильные юристы" })).toBeVisible();
  await expect(page.getByText("Онлайн", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Задать вопрос" }).click();
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
  await page.getByRole("button", { name: "Закрыть" }).click();
  const reviewButton = page.getByRole("button", { name: "Спросить юриста" });
  await expect(reviewButton).toBeVisible();
  await reviewButton.click();
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
});

test("immediate danger stops PDF flow", async ({ page }) => {
  await page.goto(`${documentPath}?variant=dispute`);
  await page.getByLabel("О чём возник спор?").selectOption("record");
  await page.getByLabel("Ребёнок уже родился?").selectOption("yes");
  await page.getByLabel("Есть действующая запись о рождении?").selectOption("yes");
  await page.getByLabel("Есть судебный акт или уже открыто дело?").selectOption("no");
  await page.getByLabel("Есть непосредственная угроза жизни или здоровью ребёнка?").selectOption("yes");
  await page.getByRole("button", { name: "Получить чек-лист" }).click();
  await expect(page.getByRole("link", { name: "112", exact: true })).toHaveAttribute("href", "tel:112");
  await expect(page.getByRole("button", { name: "Скачать PDF" })).toHaveCount(0);
});

test("surrogacy pages fit 320, 375, 768 and 1440px", async ({ page }) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [problemPath, documentPath]) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false);
    }
  }
});

test("surrogacy scenario can be chosen by keyboard", async ({ page }) => {
  await page.goto(documentPath);
  const select = page.getByLabel("Что вам нужно сделать?");
  await select.focus();
  await select.press("ArrowDown");
  await expect(select).toHaveValue("registration");
  await select.press("Tab");
  await expect(page.getByLabel("Ребёнок уже родился?")).toBeVisible();
});

test("unknown surrogacy URL is a real 404", async ({ page }) => {
  const response = await page.goto(`${problemPath}ne-izvestno/`);
  expect(response?.status()).toBe(404);
});
