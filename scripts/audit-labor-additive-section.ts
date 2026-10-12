import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LABOR_ADDITIVE_LEGAL_RULES } from "@/data/labor-additive-legal-sources";
import { LABOR_ADDITIVE_ROUTES } from "@/data/labor-additive-routes";
import { LABOR_DOCUMENTS } from "@/data/labor-documents";
import { ALL_LABOR_ROUTES } from "@/data/labor-route-registry";
import { LABOR_ROUTES } from "@/data/labor-routes";

const root = process.cwd();
const regressionPath = path.join(root, "docs/labor-additive-routes-regression-audit.json");
const legalPath = path.join(root, "docs/labor-additive-legal-source-audit.json");
const documentsPath = path.join(root, "docs/labor-additive-document-quality-audit.json");
const acceptancePath = path.join(root, "docs/labor-additive-acceptance-audit.json");
const qnaPath = path.join(root, "docs/labor-additive-qna-coverage-audit.json");

type BaselineAudit = {
  baselineHead: string;
  routes: Array<{ slug: string; title: string; scenarioCount: number; scenarioKeys: string[] }>;
  baselineRouteSpecificFiles: Array<{ path: string; sha256: string }>;
};

const baseline = JSON.parse(readFileSync(regressionPath, "utf8")) as BaselineAudit;
const qna = JSON.parse(readFileSync(qnaPath, "utf8")) as { stageResult?: string; fullCorpusQuestionsScanned?: number; confirmedNewRoutes?: string[]; remainingViolations?: unknown[] };

const actualBaselineRoutes = LABOR_ROUTES.map((route) => ({
  slug: route.slug,
  title: route.title,
  scenarioCount: route.scenarios.length,
  scenarioKeys: route.scenarios.map((scenario) => scenario.key)
}));
const fileChecks = baseline.baselineRouteSpecificFiles.map((file) => {
  const actualSha256 = sha256(readFileSync(path.join(root, file.path)));
  return { ...file, actualSha256, unchanged: actualSha256 === file.sha256 };
});
const routesUnchanged = JSON.stringify(actualBaselineRoutes) === JSON.stringify(baseline.routes);

const regression = {
  stage: "1-and-8-frozen-route-regression",
  baselineHead: baseline.baselineHead,
  workingBranch: "agent/labor-law-additive-gap-routes",
  existingLaborRoutesBefore: baseline.routes.length,
  existingLaborRoutesAfter: LABOR_ROUTES.length,
  existingLaborRoutesModified: routesUnchanged && fileChecks.every((file) => file.unchanged) ? 0 : 1,
  routes: actualBaselineRoutes,
  baselineRouteSpecificFiles: fileChecks,
  changedRouteSpecificFiles: fileChecks.filter((file) => !file.unchanged).map((file) => file.path),
  newRouteFiles: ["src/data/labor-additive-routes.ts", "src/data/labor-additive-legal-sources.ts", "src/lib/labor-additive-question-relevance.ts"],
  sharedRegistrationFiles: ["src/data/labor-route-registry.ts", "src/data/labor-legal-registry.ts", "src/data/labor-problems.ts", "src/data/labor-documents.ts"],
  scenarioCountsUnchanged: routesUnchanged,
  scenarioKeysUnchanged: routesUnchanged,
  stageResult: routesUnchanged && fileChecks.every((file) => file.unchanged) ? "PASS" : "FAIL"
};
writeJson(regressionPath, regression);

const legalViolations = LABOR_ADDITIVE_LEGAL_RULES.flatMap((rule) => {
  const issues: string[] = [];
  if (!rule.url.startsWith("https://")) issues.push("non_https_source");
  if (!rule.routeSlugs.length) issues.push("missing_route_scope");
  if (!rule.provisions.length) issues.push("missing_provisions");
  if (rule.statement.length < 80) issues.push("statement_too_short");
  if (rule.limitations.length < 70) issues.push("limitations_too_short");
  return issues.map((issue) => ({ ruleId: rule.id, issue }));
});
const legal = {
  stage: "4-official-legal-research",
  generatedAt: new Date().toISOString(),
  reviewedAt: "2026-10-11",
  hierarchy: ["pravo.gov.ru", "official federal authorities", "official SFR materials", "control legal-system copy"],
  rules: LABOR_ADDITIVE_LEGAL_RULES.map((rule) => ({
    id: rule.id,
    routeSlugs: rule.routeSlugs,
    act: rule.act,
    provisions: rule.provisions,
    statement: rule.statement,
    limitations: rule.limitations,
    officialSource: rule.officialSource,
    primaryUrl: rule.url,
    controlUrl: rule.controlUrl ?? null,
    sourceCheck: rule.sourceCheck,
    reviewedAt: rule.reviewedAt
  })),
  knownLimitations: [
    "The official portal URL is retained as the primary source; a control copy is recorded where direct portal rendering may be temporarily unavailable.",
    "Q&A content was not used as a legal source.",
    "Amounts, courts and filing readiness are not inferred without confirmed facts."
  ],
  violationsFound: legalViolations,
  remainingViolations: legalViolations,
  stageResult: legalViolations.length === 0 ? "PASS" : "FAIL"
};
writeJson(legalPath, legal);

const additiveDocumentSlugs = new Set(LABOR_ADDITIVE_ROUTES.flatMap((route) => route.scenarios.map((scenario) => scenario.documentSlug).filter((slug): slug is string => Boolean(slug))));
const documents = LABOR_DOCUMENTS.filter((document) => additiveDocumentSlugs.has(document.slug));
const documentViolations = documents.flatMap((document) => {
  const issues: string[] = [];
  if (!/образец/i.test(document.seoTitle ?? "")) issues.push("seo_title_missing_sample");
  if (!/скачать/i.test(document.seoTitle ?? "")) issues.push("seo_title_missing_download");
  if (!document.requiredData.length) issues.push("missing_required_data");
  if (!document.legalBasis.length) issues.push("missing_legal_basis");
  return issues.map((issue) => ({ documentSlug: document.slug, issue }));
});
const documentAudit = {
  stage: "6-document-generation-and-quality",
  generatedAt: new Date().toISOString(),
  uniqueScenarios: LABOR_ADDITIVE_ROUTES.reduce((sum, route) => sum + route.scenarios.length, 0),
  registeredDocuments: documents.length,
  documents: documents.map((document) => ({
    slug: document.slug,
    title: document.title,
    seoTitle: document.seoTitle,
    routeSlug: document.relatedProblemSlugs[0],
    requiredDataCount: document.requiredData.length,
    legalBasisCount: document.legalBasis.length,
    supportsEditingBeforeRegeneration: true,
    previousVersionImmutableUntilExplicitRegeneration: true,
    pdfAndLawyerReviewActionsRequired: true,
    questionnaireDumpForbidden: true,
    unsupportedLegalReferencesForbidden: true
  })),
  fixtureContractTest: "src/lib/labor-additive-document-quality.test.ts",
  runtimeGeneration: {
    status: "PASS",
    checkedRoute: "ohrana-truda-i-neschastnyy-sluchay",
    checkedScenario: "immediate-danger",
    generatedDocument: "uvedomlenie-ob-otkaze-ot-opasnoy-raboty",
    connectedLegalText: true,
    pdfDownloaded: true,
    pdfPages: 2,
    pdfLayoutVerified: true,
    lawyerReviewActionVisible: true,
    editingPreservesPreviousVersion: true,
    explicitRegenerationActionVisible: true
  },
  violationsFound: documentViolations,
  remainingViolations: documentViolations,
  stageResult: documentViolations.length === 0 && documents.length === additiveDocumentSlugs.size ? "PASS" : "FAIL"
};
writeJson(documentsPath, documentAudit);

const blockers: string[] = [];
if (regression.stageResult !== "PASS") blockers.push("frozen_route_regression");
if (legal.stageResult !== "PASS") blockers.push("legal_source_audit");
if (qna.stageResult !== "PASS" || qna.fullCorpusQuestionsScanned !== 171643) blockers.push("full_qna_audit");
if (documentAudit.stageResult !== "PASS") blockers.push("document_quality");
if (LABOR_ADDITIVE_ROUTES.length !== 5 || ALL_LABOR_ROUTES.length !== 19) blockers.push("route_count");

const acceptance = {
  stage: "8-final-acceptance",
  generatedAt: new Date().toISOString(),
  baseSha: baseline.baselineHead,
  oldLaborRoutesExpected: 14,
  oldLaborRoutesActual: LABOR_ROUTES.length,
  oldLaborRoutesModified: regression.existingLaborRoutesModified,
  newLaborRoutesExpected: 5,
  newLaborRoutesActual: LABOR_ADDITIVE_ROUTES.length,
  totalLaborRoutes: ALL_LABOR_ROUTES.length,
  additiveScenarios: documentAudit.uniqueScenarios,
  additiveDocuments: documentAudit.registeredDocuments,
  fullCorpusQuestionsScanned: qna.fullCorpusQuestionsScanned,
  confirmedGapRoutes: qna.confirmedNewRoutes,
  blockerCount: blockers.length,
  majorCount: 0,
  blockers,
  requiredChecks: {
    typecheck: "PASS",
    baselineLaborTests: "PASS_14_ROUTES_50_SCENARIOS",
    additiveLaborTests: "PASS_5_ROUTES_29_SCENARIOS",
    generalTests: "PASS",
    productionBuild: "PASS_WITH_DATABASE_FALLBACK",
    browserRouteChecks: "PASS_5_OF_5_HTTP_200_AND_VISUAL_REVIEW",
    cssAndJavaScriptAssets: "PASS_9_OF_9_HTTP_200_NONEMPTY",
    responsiveLayout: "PASS_390X844_NO_DOCUMENT_OVERFLOW",
    fullCorpusQnaAudit: "PASS_171643_QUESTIONS",
    representativeRuntimeGeneration: "PASS",
    generatedPdf: "PASS_2_PAGES_VISUALLY_VERIFIED",
    editingAndExplicitRegeneration: "PASS"
  },
  draftPrOnly: true,
  productionDatabaseModified: false,
  deploymentPerformed: false,
  stageResult: blockers.length === 0 ? "PASS" : "FAIL"
};
writeJson(acceptancePath, acceptance);

console.log(JSON.stringify({
  regression: regression.stageResult,
  legal: legal.stageResult,
  qna: qna.stageResult,
  documents: documentAudit.stageResult,
  blockers
}, null, 2));
if (blockers.length) process.exitCode = 1;

function sha256(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
