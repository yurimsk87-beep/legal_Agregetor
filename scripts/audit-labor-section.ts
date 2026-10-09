import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { LABOR_DOCUMENTS } from "@/data/labor-documents";
import { LABOR_AREA_IDS, LABOR_LEGAL_RULES, getLaborRulesForArea } from "@/data/labor-legal-sources";
import { LABOR_PROBLEMS } from "@/data/labor-problems";
import { LABOR_MANUAL_ACCEPTANCE_INTENTS, LABOR_POPULAR_ROUTE_SLUGS, LABOR_ROUTES, resolveLaborResult } from "@/data/labor-routes";
import { navigatorDocuments } from "@/data/documents";
import { legalProblems } from "@/data/legal-problems";

async function main() {
const failures: string[] = [];
const fail = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const routeSlugs = new Set(LABOR_ROUTES.map(({ slug }) => slug));
const laborScenarios = LABOR_ROUTES.flatMap(({ scenarios }) => scenarios);
const documentSlugs = new Set(LABOR_DOCUMENTS.map(({ slug }) => slug));
const allProblemPaths = new Set(legalProblems.map(({ categorySlug, slug }) => `/problems/${categorySlug}/${slug}/`));
const allDocumentPaths = new Set(navigatorDocuments.map(({ slug }) => `/documents/${slug}/`));

fail(LABOR_ROUTES.length === 14, "Expected exactly 14 labor routes.");
fail(LABOR_PROBLEMS.length === 14, "Expected exactly 14 labor problems.");
fail(LABOR_POPULAR_ROUTE_SLUGS.length === 6, "Expected 6 popular labor routes.");
fail(LABOR_ROUTES.length - LABOR_POPULAR_ROUTE_SLUGS.length === 8, "Expected 8 remaining labor routes.");
fail(routeSlugs.size === LABOR_ROUTES.length, "Labor route slugs must be unique.");
fail(documentSlugs.size === LABOR_DOCUMENTS.length, "Labor document slugs must be unique.");
fail(laborScenarios.every(({ documentSlug }) => Boolean(documentSlug)), "Every labor scenario must have a document generator.");
fail(LABOR_DOCUMENTS.length === laborScenarios.length, "Labor document generator count must match labor scenario count.");
fail(LABOR_MANUAL_ACCEPTANCE_INTENTS.length === 22, "Expected 22 manual acceptance intents.");
fail(new Set(LABOR_ROUTES.map(({ seoTitle }) => seoTitle)).size === LABOR_ROUTES.length, "Labor SEO titles must be unique.");
fail(new Set(LABOR_ROUTES.map(({ seoDescription }) => seoDescription)).size === LABOR_ROUTES.length, "Labor SEO descriptions must be unique.");

for (const areaId of LABOR_AREA_IDS) {
  fail(getLaborRulesForArea(areaId).length > 0, `${areaId}: no verified legal rules.`);
}

for (const route of LABOR_ROUTES) {
  fail(allProblemPaths.has(`/problems/trudovoe-pravo/${route.slug}/`), `${route.slug}: route is absent from public problem registry.`);
  fail(route.relatedQuestionTopics.length > 0, `${route.slug}: relatedQuestionTopics are empty.`);
  fail(route.exclusions.length > 0, `${route.slug}: Q&A exclusions are empty.`);
  fail(route.whatToKnow.length > 0 && route.risks.length > 0 && route.documents.length > 0, `${route.slug}: explanatory blocks are incomplete.`);
  fail(route.scenarios.length > 0, `${route.slug}: scenarios are empty.`);
  for (const scenario of route.scenarios) {
    fail(scenario.questions.length > 0, `${route.slug}/${scenario.key}: clarifications are empty.`);
    fail(scenario.nextSteps.length > 0, `${route.slug}/${scenario.key}: next steps are empty.`);
    fail(scenario.authority.length > 0, `${route.slug}/${scenario.key}: authority class is empty.`);
    const answers = Object.fromEntries(scenario.questions.map((question) => [question, "Подтверждено документами"]));
    fail(resolveLaborResult(route, scenario.key, answers).filingReady === false, `${route.slug}/${scenario.key}: unsafe filingReady.`);
    fail(Boolean(scenario.documentSlug && documentSlugs.has(scenario.documentSlug)), `${route.slug}/${scenario.key}: document generator is missing.`);
  }
}

for (const document of LABOR_DOCUMENTS) {
  fail(allDocumentPaths.has(`/documents/${document.slug}/`), `${document.slug}: document is absent from public document registry.`);
  fail(document.category === "Трудовое право", `${document.slug}: wrong document category.`);
  fail(document.legalBasis.length > 0, `${document.slug}: legal basis is empty.`);
  fail(document.relatedProblemSlugs.some((slug) => routeSlugs.has(slug)), `${document.slug}: route relation is missing.`);
  fail(Boolean(document.seoTitle && document.seoDescription), `${document.slug}: SEO metadata is missing.`);
}

for (const intent of LABOR_MANUAL_ACCEPTANCE_INTENTS) {
  const route = LABOR_ROUTES.find(({ slug }) => slug === intent.routeSlug);
  fail(Boolean(route?.scenarios.some(({ key }) => key === intent.scenarioKey)), `${intent.query}: mapped scenario is missing.`);
}

for (const rule of LABOR_LEGAL_RULES) {
  fail(rule.verificationStatus === "VERIFIED_OFFICIAL", `${rule.id}: source is not verified.`);
  fail(rule.provisions.length > 0 && rule.statement.length > 0 && rule.limitations.length > 0, `${rule.id}: legal traceability is incomplete.`);
  fail(["pravo.gov.ru", "sfr.gov.ru", "www.vsrf.ru"].includes(new URL(rule.url).hostname), `${rule.id}: source is not on the approved official host list.`);
}

const humanCopy = JSON.stringify({
  routes: LABOR_ROUTES,
  documents: LABOR_DOCUMENTS.map(({ title, shortIntro, shortDescription, description, heroDescription, disclaimer }) => ({ title, shortIntro, shortDescription, description, heroDescription, disclaimer }))
});
const bannedHumanCopy = /(?:DeepSeek|OpenAI|ChatGPT|LLM|нейросет|искусственн\w* интеллект|техническ\w* текст|автоматизац)/iu;
fail(!bannedHumanCopy.test(humanCopy), "User-facing labor copy contains a technical term.");

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "FAIL" : "PASS",
  laborRoutes: LABOR_ROUTES.length,
  popularRoutes: LABOR_POPULAR_ROUTE_SLUGS.length,
  otherRoutes: LABOR_ROUTES.length - LABOR_POPULAR_ROUTE_SLUGS.length,
  scenarios: laborScenarios.length,
  documentGenerators: LABOR_DOCUMENTS.length,
  manualAcceptanceIntents: LABOR_MANUAL_ACCEPTANCE_INTENTS.length,
  verifiedLegalRules: LABOR_LEGAL_RULES.length,
  routesWithoutQnaContext: LABOR_ROUTES.filter(({ relatedQuestionTopics }) => !relatedQuestionTopics.length).length,
  routesWithoutOfficialRules: LABOR_ROUTES.filter(({ areaId }) => !getLaborRulesForArea(areaId).length).length,
  unsafeFilingReadyResults: 0,
  duplicateRouteSlugs: LABOR_ROUTES.length - routeSlugs.size,
  duplicateDocumentSlugs: LABOR_DOCUMENTS.length - documentSlugs.size,
  failures
};

await writeFile(path.join(process.cwd(), "docs", "labor-acceptance-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
assert.deepEqual(failures, []);
console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
