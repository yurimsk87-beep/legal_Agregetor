import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { getLegalRouteRegistry } from "@/data/legal-route-standard";
import { getNavigatorDocument } from "@/data/documents";

const registry = getLegalRouteRegistry();
const errors: string[] = [];
const record = registry.map((route) => {
  const scenarioKeys = new Set<string>();
  const scenarios = route.scenarios.map((scenario) => {
    const identifier = `${route.categorySlug}/${route.problemSlug}/${scenario.key}`;
    const issues: string[] = [];
    if (!scenario.key || scenarioKeys.has(scenario.key)) issues.push("DUPLICATE_OR_EMPTY_KEY");
    scenarioKeys.add(scenario.key);
    if (!scenario.title.trim()) issues.push("EMPTY_TITLE");
    if (scenario.documentSlug && !getNavigatorDocument(scenario.documentSlug)) issues.push("UNREGISTERED_DOCUMENT");
    if (scenario.documentSlug && scenario.documentUrl !== `/documents/${scenario.documentSlug}/`) issues.push("DOCUMENT_LINK_MISMATCH");
    if (!scenario.documentSlug && scenario.outcome === "DRAFT") issues.push("DRAFT_WITHOUT_DOCUMENT");
    if (scenario.scenarioUrl !== `${route.problemUrl}?scenario=${encodeURIComponent(scenario.key)}`) issues.push("SCENARIO_LINK_MISMATCH");
    if (new Set(scenario.inputs.map((input) => input.key)).size !== scenario.inputs.length) issues.push("DUPLICATE_QUESTION_KEYS");
    if (issues.length) errors.push(`${identifier}: ${issues.join(", ")}`);
    return {
      scenarioKey: scenario.key, documentSlug: scenario.documentSlug,
      outcome: scenario.outcome, questionCount: scenario.inputs.length,
      checks: { registry: issues.length ? "FAIL" : "PASS", legalValidation: "REQUIRES_CASE_MATRIX", questionnaire: "REQUIRES_BROWSER_ACCEPTANCE", pdf: "REQUIRES_CONTENT_AUDIT", legalExpert: "NOT_SIGNED_OFF" },
      issues
    };
  });
  if (!route.legalReviewedAt || !/^\d{4}-\d{2}-\d{2}$/.test(route.legalReviewedAt)) errors.push(`${route.problemSlug}: NO_REVIEW_DATE`);
  if (!route.scenarios.length) errors.push(`${route.problemSlug}: NO_SCENARIOS`);
  return {
    category: route.categorySlug, route: route.problemSlug, source: route.source,
    migrationStatus: route.migrationStatus, legalReviewedAt: route.legalReviewedAt,
    routeUrl: route.problemUrl,
    acceptance: {
      scenarioNavigation: errors.some((item) => item.startsWith(`${route.categorySlug}/${route.problemSlug}/`)) ? "BLOCKED" : "STRUCTURAL_CHECK_ONLY",
      legalRulesAndExceptions: "EXPERT_AND_CASE_MATRIX_REQUIRED",
      questionnaireAndAnswers: "BROWSER_AND_VALIDATION_REQUIRED",
      generatedDocumentType: "SCENARIO_BY_SCENARIO_REVIEW_REQUIRED",
      versionedPdf: "CONTENT_AND_VERSION_REVIEW_REQUIRED",
      safeFailuresAndUrgency: "NEGATIVE_CASE_MATRIX_REQUIRED",
      seoMobileAndAccessibility: "BROWSER_AND_ACCESSIBILITY_REVIEW_REQUIRED",
      automatedAndLegalSignoff: "EXPERT_SIGNOFF_REQUIRED"
    },
    scenarios
  };
});
assert.ok(registry.length >= 43, "Expected baseline of 43 legal situations.");
assert.equal(new Set(record.map((r) => `${r.category}/${r.route}`)).size, record.length, "Duplicate legal route");
const report = {
  kind: "LEGAL_ROUTE_ACCEPTANCE_MATRIX_V1",
  generatedAt: new Date().toISOString(),
  inventory: { routes: record.length, scenarios: record.reduce((sum, route) => sum + route.scenarios.length, 0) },
  scope: "AUTOMATED_CONTRACT_CHECKS_ONLY",
  expertLegalReview: "PENDING",
  important: "PASS does not certify legal correctness, PDF fidelity, UI behavior or readiness to file.",
  errors, routes: record
};
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/legal-route-acceptance.json", JSON.stringify(report, null, 2) + "\n");
if (errors.length) { console.error(errors.slice(0, 20).join("\n")); process.exitCode = 1; }
console.log(`Acceptance matrix: ${record.length} routes, ${report.inventory.scenarios} scenarios, ${errors.length} structural issues; legal expert sign-off pending.`);
