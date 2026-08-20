import { expect, test, type Page } from "@playwright/test";

const problemPath = "/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/";
const appointmentPath = "/documents/zayavlenie-o-naznachenii-opekuna-rebenku/";

for (const viewport of [
  { width: 320, height: 780 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 }
]) {
  test(`route is stable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(problemPath);
    await dismissAnalytics(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Опека и попечительство");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const smallTargets = await page.locator("article a:visible, article button:visible, article input:visible, article select:visible, article textarea:visible").evaluateAll((elements) =>
      elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.height < 44 || rect.width < 44);
      }).map((element) => element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName)
    );
    expect(smallTargets).toEqual([]);
  });
}

test("searchable territory cascade works by keyboard and resets dependent values", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(appointmentPath);
  await dismissAnalytics(page);
  await answerSelect(page, "Есть непосредственная угроза", "Нет");
  await answerInput(page, "Возраст ребёнка", "8");
  await answerSelect(page, "Ребёнок остался без попечения", "Да");
  await answerSelect(page, "Нужно назначить опекуна немедленно", "Нет");
  await answerSelect(page, "Известен конкретный ребёнок", "Да");
  await answerInput(page, "Возраст кандидата", "35");
  await answerSelect(page, "Кандидат полностью дееспособен", "Да");
  for (const label of [
    "лишён или ограничен",
    "ранее отстраняли",
    "Усыновление кандидата",
    "судимости или уголовном",
    "заболевания из установленного"
  ]) await answerSelect(page, label, "Нет");
  await answerSelect(page, "Кандидат состоит в браке", "Нет");
  await answerSelect(page, "Какое основание относится к подготовке", "Кандидат прошёл подготовку");
  await answerSelect(page, "совместно проживают совершеннолетние", "Нет");
  await answerInput(page, "ФИО, дата рождения, адрес и паспорт кандидата", "Иванов Иван Иванович, 01.01.1990, Москва, паспорт 0000 000000");
  await answerInput(page, "ФИО, дата рождения и место жительства ребёнка", "Иванов Пётр Иванович, 01.01.2018, Москва");

  await chooseCombobox(page, "Регион", "Новосибирская область");
  await page.getByRole("combobox", { name: "Муниципальное образование" }).press("ArrowDown");
  const municipalitySearch = page.getByPlaceholder("Поиск муниципального образования");
  await municipalitySearch.fill("Новосибирск");
  await expect(page.getByRole("option", { name: /Новосибирск/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /официальный каталог сайтов регионов/i })).toHaveCount(0);
  await municipalitySearch.press("Escape");
  await page.getByRole("button", { name: "Назад" }).click();

  await chooseCombobox(page, "Регион", "Москва");
  await chooseCombobox(page, "Муниципальное образование", "Гагаринский");
  await chooseCombobox(page, "Орган опеки и попечительства", "Администрация");
  await expect(page.getByText("Лист подготовленных данных для официальной формы", { exact: true })).toBeVisible();
  await expect(page.getByText("Иванов Иван Иванович", { exact: false })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("opeka-appointment-standard-child.pdf");
  await page.getByRole("button", { name: "Проверить у юриста" }).click();
  await expect(page.getByText("очереди на назначение", { exact: false })).toBeVisible();
  await expect(page.getByText("до 30 дней", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Согласен на обработку персональных данных", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Отдельно соглашаюсь", { exact: false })).toBeVisible();

  if (process.env.E2E_SUBMIT_REVIEW === "true") {
    const reviewForm = page.locator("form").filter({ hasText: "Передать PDF на проверку" });
    await reviewForm.getByLabel("Имя").fill("Тестовый заявитель");
    await reviewForm.getByLabel("Телефон").fill("+70000000000");
    await reviewForm.getByLabel("Согласен на обработку персональных данных", { exact: false }).check();
    await reviewForm.getByLabel("Отдельно соглашаюсь", { exact: false }).check();
    await reviewForm.getByRole("button", { name: "Проверить у юриста" }).click();
    await expect(reviewForm.getByText("ожидает назначения юриста", { exact: false })).toBeVisible();
    await reviewForm.getByRole("button", { name: "Отозвать согласие и удалить PDF" }).click();
    await expect(reviewForm.getByText("PDF удалён", { exact: false })).toBeVisible();
  }
});

test("urgent path stops document preparation", async ({ page }) => {
  await page.goto(appointmentPath);
  await dismissAnalytics(page);
  await answerSelect(page, "Есть непосредственная угроза", "Да");
  await expect(page.getByText("Не откладывайте обращение ради документа")).toBeVisible();
  await expect(page.getByRole("link", { name: "Позвонить 112" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Скачать PDF" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Проверить у юриста" })).toHaveCount(0);
});

test("unknown navigator URLs return real 404 and noindex", async ({ request }) => {
  for (const path of [
    "/documents/ne-sushchestvuet/",
    "/problems/ne-sushchestvuet/",
    "/problems/semya-i-deti/ne-sushchestvuet/"
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    const body = await response.text();
    expect(body).toContain("Страница не найдена");
    expect(body).toMatch(/noindex/);
    expect(body).toMatch(/nofollow/);
  }
});

test("canonical content is present without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(problemPath);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Опека и попечительство");
  await expect(page.getByText("Оформить опеку или попечительство", { exact: true })).toBeVisible();
  await context.close();
});

async function answerSelect(page: Page, label: string, option: string) {
  await page.getByLabel(label, { exact: false }).selectOption({ label: option });
  await page.getByRole("button", { name: /Продолжить|Подготовить документ/ }).click();
}

async function answerInput(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByRole("button", { name: /Продолжить|Подготовить документ/ }).click();
}

async function chooseCombobox(page: Page, label: string, query: string) {
  await page.getByRole("combobox", { name: label }).press("ArrowDown");
  const placeholder = label === "Регион" ? "Поиск региона" : label === "Муниципальное образование" ? "Поиск муниципального образования" : "Поиск органа опеки";
  const search = page.getByPlaceholder(placeholder);
  await search.fill(query);
  await search.press("ArrowDown");
  await search.press("ArrowUp");
  await search.press("Enter");
  await page.getByRole("button", { name: /Продолжить|Подготовить документ/ }).click();
}

async function dismissAnalytics(page: Page) {
  const reject = page.getByRole("button", { name: "Отклонить" });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}
