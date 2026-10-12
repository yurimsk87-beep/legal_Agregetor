import assert from "node:assert/strict";
import { LABOR_ADDITIVE_LEGAL_RULES } from "@/data/labor-additive-legal-sources";
import { LABOR_ADDITIVE_ROUTES, LABOR_ADDITIVE_ROUTE_SLUGS } from "@/data/labor-additive-routes";
import { LABOR_DOCUMENTS } from "@/data/labor-documents";
import { getAnyLaborRulesByIds, getLaborRulesForRoute } from "@/data/labor-legal-registry";
import { ALL_LABOR_ROUTES } from "@/data/labor-route-registry";
import { LABOR_ROUTES } from "@/data/labor-routes";
import { isSafeAdditiveLaborQuestionForRoute } from "@/lib/labor-additive-question-relevance";
import type { Question } from "@/lib/types";

assert.equal(LABOR_ROUTES.length, 14, "the frozen baseline must still contain exactly 14 routes");
assert.equal(LABOR_ADDITIVE_ROUTES.length, 5, "exactly five additive routes are allowed");
assert.equal(ALL_LABOR_ROUTES.length, 19, "the combined registry must contain 14 old and 5 new routes");
assert.deepEqual(ALL_LABOR_ROUTES.slice(0, LABOR_ROUTES.length), LABOR_ROUTES, "old route order and values must stay unchanged");
assert.deepEqual(new Set(LABOR_ADDITIVE_ROUTES.map((route) => route.slug)), new Set(LABOR_ADDITIVE_ROUTE_SLUGS));
assert.equal(new Set(ALL_LABOR_ROUTES.map((route) => route.slug)).size, ALL_LABOR_ROUTES.length, "route slugs must be unique");

const additiveScenarioKeys = new Set<string>();
const additiveDocumentSlugs = new Set<string>();
for (const route of LABOR_ADDITIVE_ROUTES) {
  assert.ok(route.aliases.length >= 3, `${route.slug}: aliases required`);
  assert.ok(route.relatedQuestionTopics.length >= 3, `${route.slug}: Q&A topics required`);
  assert.ok(route.exclusions.length >= 2, `${route.slug}: Q&A exclusions required`);
  assert.ok(route.scenarios.length >= 4, `${route.slug}: deterministic scenarios required`);
  assert.ok(getLaborRulesForRoute(route).length >= 2, `${route.slug}: route-specific legal sources required`);

  for (const scenario of route.scenarios) {
    const scenarioId = `${route.slug}:${scenario.key}`;
    assert.ok(!additiveScenarioKeys.has(scenarioId), `${scenarioId}: duplicate scenario key`);
    additiveScenarioKeys.add(scenarioId);
    assert.ok(scenario.documentSlug, `${scenarioId}: every additive scenario must produce a document`);
    assert.ok(!additiveDocumentSlugs.has(scenario.documentSlug!), `${scenario.documentSlug}: duplicate document slug`);
    additiveDocumentSlugs.add(scenario.documentSlug!);
    assert.ok(scenario.relatedQuestionTopics?.length, `${scenarioId}: scenario Q&A topics required`);
    assert.ok(scenario.legalRuleIds?.length, `${scenarioId}: legal rule IDs required`);
    assert.equal(getAnyLaborRulesByIds(scenario.legalRuleIds!).length, scenario.legalRuleIds!.length, `${scenarioId}: every legal rule ID must resolve`);
  }
}

const additiveDocuments = LABOR_DOCUMENTS.filter((document) => additiveDocumentSlugs.has(document.slug));
assert.equal(additiveDocuments.length, additiveDocumentSlugs.size, "every additive scenario must register one document");
assert.equal(new Set(additiveDocuments.map((document) => document.seoTitle)).size, additiveDocuments.length, "additive document SEO titles must be unique");
for (const document of additiveDocuments) {
  assert.match((document.seoTitle ?? "").toLocaleLowerCase("ru-RU"), /образец/, `${document.slug}: SEO title must contain 'образец'`);
  assert.match((document.seoTitle ?? "").toLocaleLowerCase("ru-RU"), /скачать/, `${document.slug}: SEO title must contain 'скачать'`);
  assert.ok((document.seoDescription ?? "").length >= 120, `${document.slug}: SEO description is too short`);
}

assert.equal(new Set(LABOR_ADDITIVE_LEGAL_RULES.map((rule) => rule.id)).size, LABOR_ADDITIVE_LEGAL_RULES.length, "legal rule IDs must be unique");
for (const rule of LABOR_ADDITIVE_LEGAL_RULES) {
  assert.equal(rule.reviewedAt, "2026-10-11");
  assert.equal(rule.verificationStatus, "VERIFIED_OFFICIAL");
  assert.ok(rule.url.startsWith("https://"), `${rule.id}: HTTPS source required`);
  assert.ok(rule.statement.length >= 80, `${rule.id}: legal statement is too short`);
  assert.ok(rule.limitations.length >= 70, `${rule.id}: limitations must be explicit`);
}

const examples: Array<{ routeSlug: string; text: string }> = [
  { routeSlug: "beremennost-i-trudovye-garantii", text: "Работодатель увольняет беременную работницу после передачи справки о беременности." },
  { routeSlug: "ohrana-truda-i-neschastnyy-sluchay", text: "На производстве произошла травма, работодатель не расследует несчастный случай." },
  { routeSlug: "priem-na-rabotu-i-otkaz", text: "После собеседования работодатель отказал в приеме на работу и не сообщил причину." },
  { routeSlug: "trudovye-dokumenty-i-spravki", text: "Работодатель не выдает копию трудового договора и справку с работы." },
  { routeSlug: "diskriminatsiya-na-rabote", text: "Работникам на одинаковой должности платят меньше из-за пола, это дискриминация в оплате труда." }
];

for (const example of examples) {
  const expectedRoute = LABOR_ADDITIVE_ROUTES.find((route) => route.slug === example.routeSlug)!;
  const question = makeQuestion(example.text);
  assert.equal(isSafeAdditiveLaborQuestionForRoute(question, expectedRoute.slug, expectedRoute.relatedQuestionTopics, expectedRoute.exclusions), true, `${expectedRoute.slug}: positive Q&A example must match`);
  for (const otherRoute of LABOR_ADDITIVE_ROUTES.filter((route) => route.slug !== expectedRoute.slug)) {
    assert.equal(isSafeAdditiveLaborQuestionForRoute(question, otherRoute.slug, otherRoute.relatedQuestionTopics, otherRoute.exclusions), false, `${expectedRoute.slug}: must not cross-match ${otherRoute.slug}`);
  }
}

const unrelated = makeQuestion("Купил телефон, продавец отказался вернуть деньги по гарантии.");
const withPii = makeQuestion("Работодатель не выдает трудовую книжку, мой телефон +7 999 123-45-67.");
for (const route of LABOR_ADDITIVE_ROUTES) {
  assert.equal(isSafeAdditiveLaborQuestionForRoute(unrelated, route.slug, route.relatedQuestionTopics, route.exclusions), false, `${route.slug}: consumer question must be rejected`);
  assert.equal(isSafeAdditiveLaborQuestionForRoute(withPii, route.slug, route.relatedQuestionTopics, route.exclusions), false, `${route.slug}: PII question must be rejected`);
}

console.log(`Labor additive routes validated: ${LABOR_ADDITIVE_ROUTES.length} routes, ${additiveScenarioKeys.size} scenarios, ${additiveDocuments.length} documents.`);

function makeQuestion(text: string): Question {
  return {
    id: `fixture-${text.length}`,
    title: text,
    slug: `fixture-${text.length}`,
    text,
    userName: "Аноним",
    isIndexable: true,
    answers: [],
    createdAt: "2026-10-11T00:00:00.000Z"
  } as unknown as Question;
}
