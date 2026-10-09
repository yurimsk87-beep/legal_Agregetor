import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { navigatorDocuments, type NavigatorDocument } from "@/data/documents";

type Status = "PASS" | "FAIL" | "MANUAL_REVIEW" | "NOT_APPLICABLE";
type Check = { id: string; status: Status; message: string };
type DocumentResult = { slug: string; title: string; category: string; status: "PASS" | "FAIL"; checks: Check[] };

const baseUrl = (process.env.DOCUMENT_AUDIT_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
const results: DocumentResult[] = [];
const titleOwners = duplicateOwners(navigatorDocuments, (document) => resolvedSeoTitle(document));
const descriptionOwners = duplicateOwners(navigatorDocuments, (document) => resolvedSeoDescription(document));
const heroOwners = duplicateOwners(navigatorDocuments, (document) => document.heroDescription);
let sitemap = { ok: false, status: 0, text: "" };
let liveEnabled = false;

async function main() {
  sitemap = await fetchText(`${baseUrl}/sitemap-documents.xml`);
  liveEnabled = sitemap.ok;

  for (const batch of chunk(navigatorDocuments, 8)) {
    const audited = await Promise.all(batch.map((document) => auditDocument(document)));
    results.push(...audited);
  }

  const ruleSummary = new Map<string, { pass: number; fail: number; manualReview: number; notApplicable: number }>();
  for (const result of results) {
    for (const check of result.checks) {
      const summary = ruleSummary.get(check.id) ?? { pass: 0, fail: 0, manualReview: 0, notApplicable: 0 };
      if (check.status === "PASS") summary.pass += 1;
      if (check.status === "FAIL") summary.fail += 1;
      if (check.status === "MANUAL_REVIEW") summary.manualReview += 1;
      if (check.status === "NOT_APPLICABLE") summary.notApplicable += 1;
      ruleSummary.set(check.id, summary);
    }
  }

  const report = {
    standard: "SEO_ACCEPTANCE_RULES.md §19",
    generatedAt: new Date().toISOString(),
    baseUrl,
    mode: liveEnabled ? "catalog+live" : "catalog-only",
    totals: {
      documents: results.length,
      pass: results.filter((result) => result.status === "PASS").length,
      fail: results.filter((result) => result.status === "FAIL").length,
      manualReviewChecks: results.flatMap((result) => result.checks).filter((check) => check.status === "MANUAL_REVIEW").length,
      livePagesAudited: liveEnabled ? results.length : 0
    },
    ruleSummary: Object.fromEntries([...ruleSummary.entries()].sort(([left], [right]) => left.localeCompare(right, "ru"))),
    failures: results.filter((result) => result.status === "FAIL").map((result) => ({
      slug: result.slug,
      title: result.title,
      category: result.category,
      reasons: result.checks.filter((check) => check.status === "FAIL").map((check) => `${check.id}: ${check.message}`)
    })),
    documents: results
  };

  mkdirSync(join(process.cwd(), "reports"), { recursive: true });
  writeFileSync(join(process.cwd(), "reports", "document-seo-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Document SEO audit complete");
  console.log(`Standard: ${report.standard}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Documents: ${report.totals.documents}`);
  console.log(`PASS: ${report.totals.pass}`);
  console.log(`FAIL: ${report.totals.fail}`);
  console.log(`MANUAL_REVIEW checks: ${report.totals.manualReviewChecks}`);
  console.log(`Live pages audited: ${report.totals.livePagesAudited}`);
  console.log("\nRule failures:");
  for (const [id, summary] of Object.entries(report.ruleSummary)) {
    if (summary.fail) console.log(`${id} = ${summary.fail}`);
  }
  console.log("\nFailed documents:");
  for (const item of report.failures.slice(0, 30)) console.log(`${item.slug}: ${item.reasons.join(" | ")}`);
  if (report.failures.length > 30) console.log(`...and ${report.failures.length - 30} more. See reports/document-seo-audit.json`);
  if (report.totals.fail > 0) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function auditDocument(document: NavigatorDocument): Promise<DocumentResult> {
  const checks: Check[] = [];
  const path = `/documents/${document.slug}/`;
  const seoTitle = resolvedSeoTitle(document);
  const seoDescription = resolvedSeoDescription(document);

  requireValue(checks, "identity", document.slug && document.title && document.category, "Есть slug, название и категория.", "Не заполнены slug, название или категория.");
  requireValue(checks, "title-name", containsDocumentName(seoTitle, document), "Title содержит название документа.", "Title не содержит узнаваемое название документа.");
  requireValue(checks, "title-sample", /образец/iu.test(seoTitle), "Title содержит слово «образец».", "В title нет обязательного слова «образец».");
  requireValue(checks, "title-download", /скач/iu.test(seoTitle), "Title содержит намерение скачать результат.", "В title нет обязательного слова «скачать».");
  requireValue(checks, "meta-description", Boolean(seoDescription.trim()), "Meta description заполнена.", "Meta description отсутствует.");
  requireValue(checks, "unique-title", (titleOwners.get(normalize(seoTitle))?.length ?? 0) === 1, "Title уникален.", "Title дублируется у другого документа.");
  requireValue(checks, "unique-description", (descriptionOwners.get(normalize(seoDescription))?.length ?? 0) === 1, "Meta description уникальна.", "Meta description дублируется у другого документа.");
  requireValue(checks, "unique-introduction", (heroOwners.get(normalize(document.heroDescription))?.length ?? 0) === 1, "Вводное описание уникально.", "Вводное описание дублируется у другого документа.");
  requireList(checks, "introduction", [document.heroDescription], "Есть содержательное вводное описание.", "Нет вводного описания.");
  requireList(checks, "when-to-use", document.whenToUse, "Заполнен блок «Когда подходит».", "Не заполнен блок «Когда подходит».");
  requireList(checks, "what-to-prepare", document.whatToPrepare, "Заполнен блок «Что подготовить».", "Не заполнен блок «Что подготовить».");
  requireValue(checks, "recipient", document.whereToSubmit?.trim(), "Указан адресат или порядок обращения.", "Не указан адресат или порядок его определения.");
  requireValue(checks, "deadlines-costs", hasItems(document.deadlinesAndFees) || hasItems(document.deadlines) || hasItems(document.stateDuty), "Описаны сроки и расходы либо границы их проверки.", "Нет сроков и расходов либо правила их проверки.");
  requireList(checks, "document-content", document.whatToInclude, "Описан состав документа.", "Не описан состав документа.");
  requireList(checks, "evidence-attachments", document.documentsToAttach, "Описаны доказательства и приложения.", "Не описаны доказательства и приложения.");
  requireList(checks, "legal-basis", document.legalBasis, "Есть правовые основания.", "Нет правовых оснований.");
  requireValue(checks, "legal-review-date", document.lastReviewedAt && /^\d{4}-\d{2}-\d{2}$/.test(document.lastReviewedAt), "Есть дата правовой сверки.", "Нет корректной даты правовой сверки.");
  requireList(checks, "after-download", document.afterFiling, "Есть действия после формирования или скачивания.", "Нет действий после формирования или скачивания.");
  requireValue(checks, "internal-route", document.relatedProblems.length + document.relatedSituations.length > 0, "Есть связь с правовой ситуацией.", "Нет crawlable связи с правовой ситуацией.");
  checks.push({ id: "qna-relevance", status: "MANUAL_REVIEW", message: "Если блок Q&A отображается, нужны проверка отрасли, intent, дублей и PII по QNA_CONTENT_RULES.md." });
  checks.push({ id: "generated-document-quality", status: "MANUAL_REVIEW", message: "Качество сформированного результата проверяется отдельно по DOCUMENT_ACCEPTANCE_RULES.md." });

  if (liveEnabled) {
    const live = await fetchText(`${baseUrl}${path}`);
    requireValue(checks, "http-200", live.status === 200, "Страница возвращает HTTP 200.", `Получен HTTP ${live.status}.`);
    requireValue(checks, "canonical", hasCanonical(live.text, path), "Self-canonical корректен.", "Self-canonical отсутствует или не совпадает с URL.");
    requireValue(checks, "robots", hasIndexFollow(live.text), "Robots разрешает индексацию.", "Нет однозначного index, follow.");
    requireValue(checks, "h1", /<h1\b[^>]*>[\s\S]*?<\/h1>/iu.test(live.text), "На странице есть H1.", "H1 не найден.");
    requireValue(checks, "generator", /id=["']fill-online["']/iu.test(live.text), "Доступен блок подготовки результата.", "Не найден действующий блок подготовки результата.");
    requireValue(checks, "official-source", /Официальн(?:ый|ая) (?:источник|информация)|Правовой реестр/iu.test(live.text), "Официальные источники видимы пользователю.", "На странице не найден видимый официальный источник.");
    requireValue(checks, "visible-review-date", /Последн(?:яя|ей) (?:правовая|документированная) (?:сверка|проверка)/iu.test(live.text), "Дата правовой сверки видима.", "Дата правовой сверки не отображается пользователю.");
    requireValue(checks, "visible-after-download", /Что делать (?:дальше|после скачивания)/iu.test(live.text), "Дальнейшие действия видимы.", "На странице не найден видимый блок дальнейших действий.");
    requireValue(checks, "breadcrumb-jsonld", live.text.includes('\\"@type\\":\\"BreadcrumbList\\"') || live.text.includes('"@type":"BreadcrumbList"'), "Есть BreadcrumbList.", "BreadcrumbList не найден.");
    requireValue(checks, "webpage-jsonld", live.text.includes('\\"@type\\":\\"WebPage\\"') || live.text.includes('"@type":"WebPage"'), "Есть WebPage.", "WebPage не найден.");
    requireValue(checks, "sitemap", sitemap.text.includes(path), "URL присутствует в sitemap-documents.xml.", "URL отсутствует в sitemap-documents.xml.");
    if (/Похожие вопросы/iu.test(live.text)) {
      requireValue(checks, "qna-not-qapage", !live.text.includes('"@type":"QAPage"') && !live.text.includes('\\"@type\\":\\"QAPage\\"'), "Похожий Q&A не размечен как QAPage.", "Страница с похожими вопросами ошибочно размечена как QAPage.");
    } else {
      checks.push({ id: "qna-not-qapage", status: "NOT_APPLICABLE", message: "Блок похожих вопросов не отображается." });
    }
  } else {
    checks.push({ id: "live-technical", status: "MANUAL_REVIEW", message: `Локальный хост ${baseUrl} недоступен; HTTP, canonical, robots, schema и sitemap не проверены.` });
  }

  return { slug: document.slug, title: document.title, category: document.category, status: checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS", checks };
}

function resolvedSeoTitle(document: NavigatorDocument) {
  return document.seoTitle?.trim() || document.title;
}

function resolvedSeoDescription(document: NavigatorDocument) {
  return document.seoDescription?.trim() || document.shortDescription;
}

function containsDocumentName(title: string, document: NavigatorDocument) {
  const name = normalize(document.shortTitle?.trim() || document.title);
  const candidate = normalize(title);
  if (candidate.includes(name)) return true;
  const words = name.split(" ").filter((word) => word.length >= 5);
  return words.length > 0 && words.filter((word) => candidate.includes(word)).length / words.length >= 0.7;
}

function duplicateOwners(documents: NavigatorDocument[], value: (document: NavigatorDocument) => string) {
  const owners = new Map<string, string[]>();
  for (const document of documents) {
    const key = normalize(value(document));
    if (!key) continue;
    owners.set(key, [...(owners.get(key) ?? []), document.slug]);
  }
  return owners;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/giu, " ").trim();
}

function requireList(checks: Check[], id: string, values: string[], pass: string, fail: string) {
  requireValue(checks, id, hasItems(values), pass, fail);
}

function requireValue(checks: Check[], id: string, condition: unknown, pass: string, fail: string) {
  checks.push({ id, status: condition ? "PASS" : "FAIL", message: condition ? pass : fail });
}

function hasItems(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

function hasCanonical(html: string, path: string) {
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/iu)?.[1]
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/iu)?.[1];
  return Boolean(canonical && new URL(canonical, baseUrl).pathname === path);
}

function hasIndexFollow(html: string) {
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/iu)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/iu)?.[1];
  return Boolean(robots && /\bindex\b/iu.test(robots) && /\bfollow\b/iu.test(robots) && !/\bnoindex\b/iu.test(robots));
}

async function fetchText(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    return { ok: response.ok, status: response.status, text: await response.text() };
  } catch {
    return { ok: false, status: 0, text: "" };
  }
}

function chunk<T>(values: T[], size: number) {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += size) batches.push(values.slice(index, index + size));
  return batches;
}
