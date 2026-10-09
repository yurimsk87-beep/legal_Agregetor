import { expect, test, type Page } from "@playwright/test";
import { LABOR_DOCUMENTS } from "../../src/data/labor-documents";
import { LABOR_ROUTES } from "../../src/data/labor-routes";

const categoryPath = "/problems/trudovoe-pravo/";
const routePath = "/problems/trudovoe-pravo/uvolnenie-po-iniciative-rabotodatelya/?scenario=redundancy";
const plannedRoutePath = "/problems/trudovoe-pravo/uvolnenie-po-iniciative-rabotodatelya/?scenario=planned";
const plannedDocumentPath = "/documents/zapros-osnovaniy-planiruemogo-uvolneniya/";
const dismissedDocumentPath = "/documents/isk-o-vosstanovlenii-na-rabote/";
const documentPath = "/documents/zamechaniya-k-sokrashcheniyu/";
const plannedSeoTitle = "Запрос письменных оснований планируемого увольнения: образец, скачать PDF и запросить документы";
const dismissedSeoTitle = "Иск о восстановлении на работе: образец, скачать PDF и оспорить увольнение";

for (const viewport of [
  { width: 320, height: 780 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 }
]) {
  test(`labor route is stable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(routePath);
    await dismissAnalytics(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Увольнение по инициативе работодателя");
    expect(await hasHorizontalOverflow(page)).toBe(false);
    await expectMinimumControlHeight(page);
  });
}

test("category contains 6 popular and 8 other routes", async ({ page }) => {
  await page.goto(categoryPath);
  await dismissAnalytics(page);
  await expect(page.getByRole("heading", { name: "Популярные ситуации" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Остальные трудовые ситуации" })).toBeVisible();
  const routeLinks = await page.locator(`a[href^="${categoryPath}"]`).evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))].filter(Boolean));
  expect(routeLinks).toHaveLength(14);
});

test("route opens one complete document form without a preliminary result branch", async ({ page }) => {
  await page.goto(routePath);
  await dismissAnalytics(page);
  await expect(page.getByRole("heading", { name: "Подготовка документа" })).toBeVisible();
  expect(await page.locator("#fill-online textarea").count()).toBeGreaterThan(10);
  await expect(page.getByRole("button", { name: "Получить порядок действий" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Сформировать документ" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Сформировать документ", exact: true })).toHaveCount(1);
});

test("planned dismissal document exposes an exact SEO title, benefit, sample and download intent", async ({ page }) => {
  for (const path of [plannedRoutePath, plannedDocumentPath]) {
    await page.goto(path);
    await expect(page).toHaveTitle(`${plannedSeoTitle} | ПравоПоиск`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Образец запроса письменных оснований.+скачайте PDF.+запросить у работодателя/i);
  }
  await page.goto(plannedRoutePath);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/problems\/trudovoe-pravo\/uvolnenie-po-iniciative-rabotodatelya\/$/);
  await page.goto(plannedDocumentPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Запрос письменных оснований планируемого увольнения");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/documents\/zapros-osnovaniy-planiruemogo-uvolneniya\/$/);
});

test("reinstatement claim exposes its exact SEO title and search intent", async ({ page }) => {
  await page.goto(dismissedDocumentPath);
  await expect(page).toHaveTitle(`${dismissedSeoTitle} | ПравоПоиск`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Иск о восстановлении на работе");
  await expect(page.getByText(/Подготовьте проект иска, если считаете увольнение незаконным.+использовать как образец и скачать в PDF/i)).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Образец иска о восстановлении.+скачайте PDF.+оспаривания увольнения в суде/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/documents\/isk-o-vosstanovlenii-na-rabote\/$/);
  await expect(page.getByRole("heading", { name: "Что войдет в иск" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Какие доказательства приложить" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Проверенные правовые основания" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Что делать после скачивания" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Связанные материалы" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Запрос письменных оснований планируемого увольнения" })).toHaveAttribute("href", "/documents/zapros-osnovaniy-planiruemogo-uvolneniya/");
  const structuredData = await page.locator('script[type="application/ld+json"]').evaluateAll((elements) => elements.map((element) => element.textContent).join("\n"));
  expect(structuredData).toContain('"@type":"WebPage"');
});

test("document preserves the current version until explicit regeneration", async ({ page }) => {
  let generation = 0;
  await page.route("**/api/labor-documents/", async (route) => {
    generation += 1;
    const version = generation;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: {
        documentTitle: "Замечания к процедуре сокращения",
        draftText: `В адрес работодателя\n\nЗАМЕЧАНИЯ К ПРОЦЕДУРЕ СОКРАЩЕНИЯ\n\nВерсия ${version}. Подтвержденные заявителем обстоятельства и требования изложены без предположений. Прошу предоставить документы о процедуре сокращения и письменный ответ.\n\nПриложения: подтверждающие документы.\nДата: 05.10.2026\nПодпись: ____________`,
        usedRuleIds: ["tc-178-180-redundancy"],
        placeholders: [],
        versionId: version === 1 ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222",
        filingReady: false,
        requiresLegalReview: true,
        legalRegistryReviewedAt: "2026-10-05",
        generatorVersion: "labor-v1"
      } })
    });
  });

  await page.goto(documentPath);
  await dismissAnalytics(page);
  const fields = page.locator("#fill-online textarea");
  expect(await fields.count()).toBeGreaterThan(10);
  for (let index = 0; index < await fields.count(); index += 1) await fields.nth(index).fill(`Подтвержденные сведения ${index + 1}`);
  await page.getByRole("button", { name: "Сформировать документ", exact: true }).click();
  await expect(page.getByText("Версия 1.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Редактировать данные" })).toBeVisible();

  await page.getByRole("button", { name: "Редактировать данные" }).click();
  await page.locator("#fill-online textarea").first().fill("Измененные сведения");
  await expect(page.getByText("Версия 1.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Сформировать новый документ" }).click();
  await expect(page.getByText("Версия 2.", { exact: false })).toBeVisible();
  await expect(page.getByText("Версия 1.", { exact: false })).toHaveCount(0);

  const finalSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Итоговый результат" }) }).last();
  await expect(page.locator('[data-result-section="generated-document"] + [data-result-section="final-actions"]')).toHaveCount(1);
  await expect(finalSection.getByRole("button", { name: "Скачать PDF" })).toBeVisible();
  await expect(finalSection.getByRole("button", { name: "Отправить на проверку юристу" })).toBeVisible();
  await expect(finalSection.getByRole("button")).toHaveCount(2);
  await expect(finalSection.getByRole("heading", { name: "Передать PDF на проверку" })).toHaveCount(0);
  await finalSection.getByRole("button", { name: "Отправить на проверку юристу" }).click();
  await expect(finalSection.getByRole("heading", { name: "Передать PDF на проверку" })).toBeVisible();
  await expect(finalSection.getByLabel("Имя")).toBeVisible();
  await finalSection.getByRole("button", { name: "Отправить на проверку юристу" }).click();
  await expect(finalSection.getByRole("heading", { name: "Передать PDF на проверку" })).toHaveCount(0);
  const downloadPromise = page.waitForEvent("download");
  await finalSection.getByRole("button", { name: "Скачать PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("zamechaniya-k-sokrashcheniyu-proekt.pdf");
  await expect(page.getByText("PDF сформирован из текущей версии документа.")).toBeVisible();
  await expect(page.getByText("Версия 2.", { exact: false })).toBeVisible();
});

test("all labor routes and documents return canonical HTML and are in sitemaps", async ({ request }) => {
  test.setTimeout(180_000);
  const scenarios = LABOR_ROUTES.flatMap((route) => route.scenarios);
  const documentSlugs = new Set(LABOR_DOCUMENTS.map(({ slug }) => slug));
  expect(scenarios).toHaveLength(50);
  expect(scenarios.every(({ documentSlug }) => Boolean(documentSlug) && documentSlugs.has(documentSlug!))).toBe(true);
  const routePaths = LABOR_ROUTES.map(({ slug }) => `/problems/trudovoe-pravo/${slug}/`);
  const scenarioPaths = LABOR_ROUTES.flatMap((route) => route.scenarios.map((scenario) => `${categoryPath}${route.slug}/?scenario=${scenario.key}`));
  const documentPaths = LABOR_DOCUMENTS.map(({ slug }) => `/documents/${slug}/`);
  const responses = await Promise.all([...routePaths, ...documentPaths].map(async (path) => ({ path, response: await request.get(path) })));
  for (const { path, response } of responses) {
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).toContain(`rel="canonical"`);
    expect(html, path).toContain(path);
  }
  const scenarioResponses = await Promise.all(scenarioPaths.map(async (path) => ({ path, response: await request.get(path) })));
  for (const { path, response } of scenarioResponses) {
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).toContain("Подготовка документа");
    expect(html, path).toContain("Сформировать документ");
    expect(html, path).not.toContain("Получить порядок действий");
  }
  const [problemSitemap, documentSitemap] = await Promise.all([
    request.get("/sitemap-problems.xml").then((response) => response.text()),
    request.get("/sitemap-documents.xml").then((response) => response.text())
  ]);
  for (const path of routePaths) expect(problemSitemap).toContain(path);
  for (const path of documentPaths) expect(documentSitemap).toContain(path);
});

test("unknown labor pages return a real noindex 404", async ({ request }) => {
  for (const path of ["/problems/trudovoe-pravo/ne-sushchestvuet/", "/documents/trudovoy-dokument-ne-sushchestvuet/"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    const html = await response.text();
    expect(html).toMatch(/noindex/);
    expect(html).toMatch(/nofollow/);
  }
});

async function dismissAnalytics(page: Page) {
  const reject = page.getByRole("button", { name: "Отклонить" });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

async function expectMinimumControlHeight(page: Page) {
  const undersized = await page.locator("main button:visible, main textarea:visible, main input:not([type=checkbox]):visible, main select:visible").evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.height < 44;
  }).map((element) => element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName));
  expect(undersized).toEqual([]);
}
