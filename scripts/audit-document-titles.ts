import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { navigatorDocuments } from "@/data/documents";
import { ZAGS_SCENARIOS, ZAGS_SCENARIO_KEYS } from "@/data/zags-route";

const baseUrl = (process.env.DOCUMENT_AUDIT_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
const items = [
  ...navigatorDocuments.map((document) => ({
    id: document.slug,
    url: `${baseUrl}/documents/${document.slug}/`,
    expectedTitle: document.seoTitle?.trim() || document.title
  })),
  ...ZAGS_SCENARIO_KEYS.map((key) => ({
    id: `zayavlenie-v-zags:${key}`,
    url: `${baseUrl}/documents/zayavlenie-v-zags/?variant=${key}`,
    expectedTitle: ZAGS_SCENARIOS[key].seoTitle
  }))
];

type Result = {
  id: string;
  url: string;
  expectedTitle: string;
  status: number;
  title: string;
  h1: string;
  matchesExpected: boolean;
  hasRequiredWords: boolean;
  error?: string;
};

async function main() {
  const documents: Result[] = [];

  for (const batch of chunk(items, 8)) {
    documents.push(...await Promise.all(batch.map(auditPage)));
  }

  const titleOwners = new Map<string, string[]>();
  for (const document of documents) {
    const key = normalize(document.title);
    if (!key) continue;
    titleOwners.set(key, [...(titleOwners.get(key) ?? []), document.id]);
  }

  const duplicates = [...titleOwners.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([title, ids]) => ({ title, ids }));
  const failures = documents.filter((document) => (
    document.status !== 200 ||
    !document.title ||
    !document.h1 ||
    !document.matchesExpected ||
    !document.hasRequiredWords
  ));
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    summary: {
      checked: documents.length,
      catalogDocuments: navigatorDocuments.length,
      zagsVariants: ZAGS_SCENARIO_KEYS.length,
      uniqueTitles: titleOwners.size,
      duplicateTitleGroups: duplicates.length,
      failedPages: failures.length
    },
    duplicates,
    failures,
    documents
  };

  mkdirSync(join(process.cwd(), "reports"), { recursive: true });
  writeFileSync(join(process.cwd(), "reports", "document-seo-title-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Document title audit complete");
  console.log(`Checked: ${report.summary.checked}`);
  console.log(`Unique titles: ${report.summary.uniqueTitles}`);
  console.log(`Duplicate title groups: ${report.summary.duplicateTitleGroups}`);
  console.log(`Failed pages: ${report.summary.failedPages}`);

  if (duplicates.length > 0 || failures.length > 0) process.exitCode = 1;
}

async function auditPage(item: (typeof items)[number]): Promise<Result> {
  try {
    const response = await fetch(item.url);
    const html = await response.text();
    const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/iu)?.[1] ?? "").trim();
    const h1 = decodeHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu)?.[1] ?? "")
      .replace(/<[^>]+>/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();

    return {
      ...item,
      status: response.status,
      title,
      h1,
      matchesExpected: normalize(title).startsWith(normalize(item.expectedTitle)),
      hasRequiredWords: /образец/iu.test(title) && /скач/iu.test(title)
    };
  } catch (error) {
    return {
      ...item,
      status: 0,
      title: "",
      h1: "",
      matchesExpected: false,
      hasRequiredWords: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function chunk<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/giu, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gu, "&")
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
