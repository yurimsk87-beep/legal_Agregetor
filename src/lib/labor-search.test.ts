import assert from "node:assert/strict";
import { LABOR_MANUAL_ACCEPTANCE_INTENTS, getLaborRoute } from "@/data/labor-routes";
import { searchSite } from "@/lib/site-search";

assert.equal(LABOR_MANUAL_ACCEPTANCE_INTENTS.length, 22);

for (const intent of LABOR_MANUAL_ACCEPTANCE_INTENTS) {
  const route = getLaborRoute(intent.routeSlug);
  assert.ok(route, `${intent.query}: route not found`);
  assert.ok(route.scenarios.some(({ key }) => key === intent.scenarioKey), `${intent.query}: scenario not found`);
  const first = searchSite(intent.query, 1)[0];
  assert.equal(first?.href, `/problems/trudovoe-pravo/${intent.routeSlug}/`, `${intent.query}: wrong first search result`);
}

console.log(`Labor search intents validated: ${LABOR_MANUAL_ACCEPTANCE_INTENTS.length}.`);
