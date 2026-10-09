import assert from "node:assert/strict";
import { LABOR_AREA_IDS, getLaborRulesForArea } from "@/data/labor-legal-sources";
import { LABOR_PROBLEMS } from "@/data/labor-problems";
import { LABOR_ROUTES, resolveLaborResult } from "@/data/labor-routes";

assert.equal(LABOR_ROUTES.length, 14);
assert.equal(LABOR_PROBLEMS.length, 14);
assert.equal(new Set(LABOR_ROUTES.map((route) => route.slug)).size, 14);
assert.deepEqual(new Set(LABOR_ROUTES.map((route) => route.areaId)), new Set(LABOR_AREA_IDS));

for (const route of LABOR_ROUTES) {
  assert.ok(route.scenarios.length > 0, `${route.slug}: scenario required`);
  assert.ok(route.relatedQuestionTopics.length > 0, `${route.slug}: Q&A context required`);
  assert.ok(route.exclusions.length > 0, `${route.slug}: Q&A exclusions required`);
  assert.ok(getLaborRulesForArea(route.areaId).length > 0, `${route.slug}: legal rules required`);
  for (const scenario of route.scenarios) {
    assert.ok(scenario.questions.length > 0, `${route.slug}/${scenario.key}: clarifications required`);
    const incomplete = resolveLaborResult(route, scenario.key, {});
    assert.equal(incomplete.status, "NEEDS_FACTS");
    assert.equal(incomplete.filingReady, false);
    const complete = resolveLaborResult(route, scenario.key, Object.fromEntries(scenario.questions.map((question) => [question, "Подтверждено документами"])));
    assert.equal(complete.status, "PREPARED");
    assert.equal(complete.filingReady, false);
  }
}

console.log(`Labor routes validated: ${LABOR_ROUTES.length} routes, ${LABOR_ROUTES.flatMap((route) => route.scenarios).length} scenarios.`);
