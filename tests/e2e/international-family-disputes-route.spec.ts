import { expect, test } from "@playwright/test";

const problemPath = "/problems/semya-i-deti/mezhdunarodnye-semeynye-spory/";
const documentPath = "/documents/mezhdunarodnyy-semeynyy-spor-list-dannyh/";

test("international family disputes landing has one H1 and five paths", async ({ page }) => {
  await page.goto(problemPath);
  await expect(page.getByRole("heading", { level: 1, name: "Международные семейные споры" })).toHaveCount(1);
  for (const key of ["child", "parental", "recognition", "maintenance", "documents"]) await expect(page.locator(`a[href$="?scenario=${key}"]`)).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${problemPath}$`));
});

test("international query state is not indexed", async ({ page }) => {
  await page.goto(`${problemPath}?scenario=recognition`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Подготовить лист сведений" })).toHaveAttribute("href", `${documentPath}?variant=recognition#fill-online`);
});

test("helper never selects law or court", async ({ page }) => {
  await page.goto(`${documentPath}?variant=documents`);
  for (const label of ["Какие государства связаны с ситуацией?", "Гражданство всех участников", "Где каждый участник обычно и фактически проживает?", "В каком государстве сейчас находится ребёнок?", "Какой иностранный документ нужно использовать?", "Для какого юридического действия он нужен?"]) await page.getByLabel(label).fill("Проверочное значение");
  await page.getByLabel("Есть иностранное решение суда или иного органа?").selectOption("no");
  await page.getByLabel("Проверялось ли действие международного договора между этими государствами?").selectOption("no");
  await page.getByLabel("Есть заверенный перевод на русский язык?").selectOption("yes");
  await page.getByRole("button", { name: "Получить чек-лист" }).click();
  await expect(page.getByText("Готово к подаче: нет. Юридическая проверка обязательна.")).toBeVisible();
  await expect(page.getByText(/не определяет применимое право, компетентный суд/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Скачать PDF" })).toBeVisible();
});

test("immediate child danger stops PDF", async ({ page }) => {
  await page.goto(`${documentPath}?variant=child`);
  const textareas = page.locator("textarea");
  for (let index = 0; index < await textareas.count(); index += 1) await textareas.nth(index).fill("Проверочное значение");
  await page.getByLabel("Есть иностранное решение суда или иного органа?").selectOption("no");
  await page.getByLabel("Проверялось ли действие международного договора между этими государствами?").selectOption("no");
  await page.getByLabel("Было согласие другого родителя на выезд или изменение места проживания?").selectOption("no");
  await page.getByLabel("Есть непосредственная угроза жизни или здоровью ребёнка?").selectOption("yes");
  await page.getByRole("button", { name: "Получить чек-лист" }).click();
  await expect(page.getByRole("link", { name: "112", exact: true })).toHaveAttribute("href", "tel:112");
  await expect(page.getByRole("button", { name: "Скачать PDF" })).toHaveCount(0);
});

test("international pages fit supported widths", async ({ page }) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [problemPath, documentPath]) { await page.goto(path); expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${path} at ${width}px`).toBe(false); }
  }
});

test("scenario can be chosen by keyboard", async ({ page }) => {
  await page.goto(documentPath); const select = page.getByLabel("Что вам нужно сделать?"); await select.focus(); await select.press("ArrowDown");
  await expect(select).toHaveValue("child"); await select.press("Tab"); await expect(page.getByLabel("Какие государства связаны с ситуацией?")).toBeVisible();
});

test("unknown international route is a real 404", async ({ page }) => {
  const response = await page.goto(`${problemPath}ne-izvestno/`); expect(response?.status()).toBe(404);
});
