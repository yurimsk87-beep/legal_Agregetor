import assert from "node:assert/strict";
import { FAMILY_ADDITIVE_DOCUMENTS } from "@/data/family-additive-documents";
import { FAMILY_ADDITIVE_ROUTES } from "@/data/family-additive-routes";
import { PROBLEM_QNA_CONTEXTS } from "@/data/related-questions-context";
import { buildFamilyAdditiveDocument } from "@/lib/family-additive-document";
import { validateFamilyAdditiveScenario, type FamilyAdditiveValues } from "@/lib/family-additive-validator";

const routeEntries = Object.values(FAMILY_ADDITIVE_ROUTES);
const scenarioEntries = routeEntries.flatMap((route) => Object.values(route.scenarios).map((scenario) => ({ route, scenario })));

assert.equal(routeEntries.length, 5);
assert.equal(scenarioEntries.length, 21);
assert.equal(FAMILY_ADDITIVE_DOCUMENTS.length, 21);
assert.equal(new Set(FAMILY_ADDITIVE_DOCUMENTS.map((document) => document.slug)).size, 21);

for (const document of FAMILY_ADDITIVE_DOCUMENTS) {
  assert.match(document.seoTitle ?? "", /образец/i, `${document.slug}: SEO title contains образец`);
  assert.match(document.seoTitle ?? "", /скачать/i, `${document.slug}: SEO title contains скачать`);
  assert.ok((document.seoDescription ?? "").length >= 100, `${document.slug}: SEO description`);
  assert.equal(document.relatedProblemSlugs.length, 1);
}

for (const { route, scenario } of scenarioEntries) {
  const values: FamilyAdditiveValues = {};
  for (const field of scenario.helperFields) {
    if (field.type === "select") values[field.name] = field.options?.[0]?.value ?? "yes";
    else if (field.type === "number") values[field.name] = "10000";
    else if (field.type === "court-source") values[field.name] = "https://tverskoy.msk.sudrf.ru/";
    else if (field.type === "court-name") values[field.name] = "Тверской районный суд города Москвы";
    else values[field.name] = "Подтверждённые сведения по документу";
  }
  const decision = validateFamilyAdditiveScenario(route.problemSlug, scenario.key, values);
  const text = buildFamilyAdditiveDocument(decision);
  assert.ok(text.length > 250, `${scenario.documentSlug}: meaningful result`);
  assert.ok(!/deepseek|нейросет|искусственн.{0,5}интеллект|\bapi\b/i.test(text), `${scenario.documentSlug}: no technical provider text`);
  assert.equal(decision.filingReady, false);
}

for (const route of routeEntries) {
  const context = PROBLEM_QNA_CONTEXTS[route.problemSlug];
  assert.ok(context, `${route.problemSlug}: Q&A context`);
  assert.ok(context.strictRequiredTopicGroups?.length, `${route.problemSlug}: strict topic group`);
  assert.ok(context.excludedTopics.length, `${route.problemSlug}: exclusions`);
}

console.log("Family additive documents passed: 5 routes, 21 documents, SEO and strict Q&A contexts.");
