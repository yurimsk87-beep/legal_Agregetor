import assert from "node:assert/strict";
import {
  createFamilyAdditiveDocumentResult,
  createLaborDocumentResult,
  documentResultReviewMetadata,
  documentResultSchema,
  DOCUMENT_RESULT_CONTRACT_VERSION
} from "@/lib/document-result-contract";
import { getFamilyAdditiveScenario } from "@/data/family-additive-routes";
import { buildFamilyAdditiveDocument } from "@/lib/family-additive-document";
import { validateFamilyAdditiveScenario } from "@/lib/family-additive-validator";

const route = "alimenty-na-sovershennoletnego-rebenka";
const scenario = getFamilyAdditiveScenario(route, "eligibility");
assert.ok(scenario);
const prepared = Object.fromEntries(scenario.helperFields.map((field) => [
  field.name,
  field.type === "select" ? (field.options?.[0]?.value ?? "yes") : "Подтверждённые сведения"
]));
const decision = validateFamilyAdditiveScenario(route, "eligibility", prepared);
assert.equal(decision.issues.length, 0);

const commonFamilyInput = {
  decision,
  documentSlug: scenario.documentSlug,
  documentText: buildFamilyAdditiveDocument(decision),
  legalReviewedAt: "2026-10-09"
};
const first = createFamilyAdditiveDocumentResult(commonFamilyInput);
const second = createFamilyAdditiveDocumentResult(commonFamilyInput);
assert.equal(first.contractVersion, DOCUMENT_RESULT_CONTRACT_VERSION);
assert.equal(first.categorySlug, "semya-i-deti");
assert.equal(first.routeSlug, route);
assert.equal(first.scenarioKey, "eligibility");
assert.equal(first.resultKind, "CHECKLIST");
assert.equal(first.source, "DETERMINISTIC");
assert.equal(first.filingReady, false);
assert.notEqual(first.versionId, second.versionId, "each generation gets a distinct immutable version");
assert.equal(documentResultSchema.parse(first).versionId, first.versionId);
assert.equal(first.documentText, commonFamilyInput.documentText);

const fakeLaborResult = {
  documentTitle: "Требование работодателю",
  draftText: "Подтверждённые обстоятельства и требования заявителя.",
  usedRuleIds: ["tc-rule-test"],
  placeholders: [],
  versionId: "11111111-1111-4111-8111-111111111111",
  legalRegistryReviewedAt: "2026-10-09",
  generatorVersion: "labor-1",
  filingReady: false as const,
  requiresLegalReview: true as const
};
const labor = createLaborDocumentResult({
  routeSlug: "spory-s-rabotodatelem",
  scenarioKey: "employer",
  documentSlug: "trebovanie-rabotodatelyu",
  result: fakeLaborResult
});
assert.equal(labor.versionId, fakeLaborResult.versionId, "server-generated version is preserved");
assert.equal(labor.categorySlug, "trudovoe-pravo");
assert.equal(labor.resultKind, "DRAFT");
assert.equal(labor.source, "AI_DRAFT");
assert.deepEqual(labor.usedRuleIds, ["tc-rule-test"]);
assert.equal(labor.filingReady, false);
assert.equal(labor.requiresLegalReview, true);

const review = documentResultReviewMetadata(first);
assert.equal(review.documentVersionId, first.versionId);
assert.equal(review.route, first.routeSlug);
assert.equal(review.scenarioKey, first.scenarioKey);
assert.equal(review.resultKind, first.resultKind);
assert.ok(!("documentText" in review), "never submit raw document text as metadata");
assert.ok(!("verifiedFacts" in review), "never submit personal data as metadata");
assert.equal(review.filingReady, false);

assert.throws(() => documentResultSchema.parse({ ...labor, filingReady: true }));
assert.throws(() => documentResultSchema.parse({ ...first, categorySlug: "" }));
assert.throws(() => documentResultSchema.parse({ ...first, versionId: "not-a-uuid" }));
assert.throws(() => documentResultSchema.parse({ ...first, createdAt: "invalid" }));
assert.throws(() => documentResultSchema.parse({ ...first, resultKind: "FAKE_COURT_ORDER" }));
assert.throws(() => createFamilyAdditiveDocumentResult({ ...commonFamilyInput, documentText: "  " }));

console.log("DocumentResult v1 validated: family and labor envelopes, version isolation, safe metadata and filing block.");
