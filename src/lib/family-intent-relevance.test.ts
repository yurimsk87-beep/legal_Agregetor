import assert from "node:assert/strict";
import { searchSite } from "@/lib/site-search";

/**
 * Guard against wrong same-family route being ranked above the actual issue.
 * User utterances need explicit route compatibility, not shared keywords.
 */
const fixtures = [
  ["усыновить ребёнка", "usynovlenie-rebenka"],
  ["лишить отца родительских прав", "lishenie-roditelskih-prav"],
  ["взыскать алименты на ребёнка", "alimenty-na-rebenka"],
  ["как развестись без спора о детях", "razvod-i-razdel-imushchestva"],
  ["соглашение о разделе имущества", "razvod-i-razdel-imushchestva"],
  ["После развода ребёнок должен жить со мной", "roditeli-i-rebenok-posle-razvoda"],
  ["Есть решение суда, но ребёнка всё равно не дают видеть", "roditeli-i-rebenok-posle-razvoda"]
] as const;

for (const [query, slug] of fixtures) {
  const results = searchSite(query, 50);
  const found = results.find((result) => result.type === "situation" && result.href.startsWith("/problems/semya-i-deti/"));
  assert.equal(found?.href, `/problems/semya-i-deti/${slug}/`, query);
  const forbiddenFamilyRoutes = results
    .filter((result) => result.type === "situation" && result.href.startsWith("/problems/semya-i-deti/"))
    .filter((result) => result.href !== `/problems/semya-i-deti/${slug}/`);
  assert.equal(forbiddenFamilyRoutes.length, 0, `${query}: wrong family situations returned`);
}

console.log(`Family intent relevance verified: ${fixtures.length} routes.`);
