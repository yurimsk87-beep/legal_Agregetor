import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  articles,
  calculators,
  cases,
  documentTemplates,
  faqItems,
  questions,
  seoPages
} from "../src/lib/sample-data";
import { canIndexArticlePage, canIndexQuestionPage, shouldIncludeInSitemap } from "../src/lib/seo";
import type { AuditIssue, SeoPage } from "../src/lib/types";

const issues: AuditIssue[] = [];

for (const page of seoPages) {
  checkSeoPage(page);
}

for (const article of articles) {
  const faqCount = faqItems.filter((faq) => faq.entityType === "ARTICLE" && faq.entityId === article.id).length;
  if (article.isIndexable && !canIndexArticlePage({ article, faqCount })) {
    add("error", `/blog/${article.slug}/`, "Indexable article does not pass article quality rules.");
  }
}

for (const question of questions) {
  if (question.isIndexable && !canIndexQuestionPage(question)) {
    add("error", `/questions/${question.slug}/`, "Indexable question does not pass UGC quality rules.");
  }
}

for (const document of documentTemplates) {
  if (document.isIndexable && !shouldIncludeInSitemap(document)) {
    add("error", `/documents/${document.slug}/`, "Indexable document is not eligible for sitemap quality gate.");
  }
}

for (const calculator of calculators) {
  if (calculator.isIndexable && !shouldIncludeInSitemap(calculator)) {
    add("error", `/calculators/${calculator.slug}/`, "Indexable calculator is not eligible for sitemap quality gate.");
  }
}

for (const caseItem of cases) {
  if (caseItem.isIndexable && !shouldIncludeInSitemap(caseItem)) {
    add("error", `/cases/${caseItem.slug}/`, "Indexable case is not eligible for sitemap quality gate.");
  }
}

checkDuplicates("title", seoPages.map((page) => [page.canonical, page.title]));
checkDuplicates("description", seoPages.map((page) => [page.canonical, page.description]));
checkDuplicates("primaryKeyword", seoPages.map((page) => [page.canonical, page.primaryKeyword ?? ""]));

const sitemapUrls = [
  ...seoPages.filter((page) => shouldIncludeInSitemap(page)).map((page) => page.canonical),
  ...documentTemplates.filter((page) => shouldIncludeInSitemap(page)).map((page) => `/documents/${page.slug}/`),
  ...calculators.filter((page) => shouldIncludeInSitemap(page)).map((page) => `/calculators/${page.slug}/`),
  ...cases.filter((page) => shouldIncludeInSitemap(page)).map((page) => `/cases/${page.slug}/`)
];

for (const url of sitemapUrls) {
  if (url.includes("?")) add("error", url, "Filtered or parameterized URL appears in sitemap.");
  if (/page=\d+/.test(url)) add("error", url, "Paginated URL appears in sitemap.");
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    pages: seoPages.length,
    sitemapUrls: sitemapUrls.length,
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length
  },
  issues
};

mkdirSync(join(process.cwd(), "reports"), { recursive: true });
writeFileSync(join(process.cwd(), "reports", "seo-audit.json"), JSON.stringify(report, null, 2));

console.log("SEO audit complete");
console.log(`Pages: ${report.totals.pages}`);
console.log(`Sitemap URLs: ${report.totals.sitemapUrls}`);
console.log(`Errors: ${report.totals.errors}`);
console.log(`Warnings: ${report.totals.warnings}`);

if (issues.length) {
  console.log("\nIssues:");
  for (const issue of issues.slice(0, 50)) {
    console.log(`[${issue.severity}] ${issue.page} — ${issue.message}`);
  }
}

if (report.totals.errors > 0) {
  process.exitCode = 1;
}

function checkSeoPage(page: SeoPage) {
  const path = page.canonical || `/${page.slug}/`;
  if (!page.title) add("error", path, "Missing title.");
  if (!page.description) add("error", path, "Missing description.");
  if (!page.h1) add("error", path, "Missing H1.");
  if (!page.canonical) add("error", path, "Missing canonical.");
  if (!page.seoText) add("error", path, "Missing SEO text.");
  if (page.isIndexable && (page.seoScore ?? 0) < 70) add("error", path, "Indexable page has seoScore < 70.");
  if (page.isIndexable && !["READY_FOR_INDEX", "INDEXED"].includes(page.seoMaturity ?? "")) {
    add("error", path, "Indexable page has invalid seoMaturity.");
  }
  if (page.isIndexable && page.robots?.includes("noindex")) {
    add("error", path, "Canonical/robots conflict: indexable page contains noindex.");
  }
  if (!page.isIndexable && page.robots?.includes("index,")) {
    add("warning", path, "Noindex page has index robots directive.");
  }

  const faqCount = faqItems.filter((faq) => {
    if (page.type === "CITY_SERVICE") return faq.entityId === `${page.cityId}:${page.serviceId}`;
    if (page.type === "CITY") return faq.entityId === page.cityId;
    if (page.type === "SERVICE") return faq.entityId === page.serviceId;
    if (page.type === "LAWYER") return faq.entityId === page.lawyerId;
    if (page.type === "ARTICLE") return faq.entityId === page.id;
    return true;
  }).length;

  if (page.isIndexable && faqCount < 3) {
    add("warning", path, "Indexable page has fewer than 3 FAQ items.");
  }
}

function checkDuplicates(kind: string, rows: Array<[string, string]>) {
  const map = new Map<string, string[]>();
  for (const [url, value] of rows) {
    if (!value) continue;
    map.set(value, [...(map.get(value) ?? []), url]);
  }

  for (const [value, urls] of map.entries()) {
    if (urls.length > 1) {
      add("error", urls.join(", "), `Duplicate ${kind}: ${value}`);
    }
  }
}

function add(severity: AuditIssue["severity"], page: string, message: string) {
  issues.push({ severity, page, message });
}
