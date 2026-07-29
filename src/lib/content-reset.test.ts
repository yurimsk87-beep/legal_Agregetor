import assert from "node:assert/strict";
import { navigatorDocuments } from "@/data/documents";
import { legalProblems } from "@/data/legal-problems";
import { ZAGS_SCENARIO_KEYS } from "@/data/zags-route";
import { buildMetadata } from "@/lib/seo";
import { getSiteSearchIndex } from "@/lib/site-search";

const targetProblemHref = "/problems/semya-i-deti/brak-zags-i-smena-familii/";
const targetDocumentHref = "/documents/zayavlenie-v-zags/";

assert.deepEqual(
  legalProblems.map(({ categorySlug, slug }) => ({ categorySlug, slug })),
  [{ categorySlug: "semya-i-deti", slug: "brak-zags-i-smena-familii" }]
);
assert.deepEqual(
  navigatorDocuments.map(({ slug }) => slug),
  ["zayavlenie-v-zags"]
);
assert.equal(ZAGS_SCENARIO_KEYS.length, 4);
assert.equal("templateSlug" in navigatorDocuments[0], false);

const indexedContentHrefs = getSiteSearchIndex()
  .filter(({ type }) => type === "situation" || type === "document")
  .map(({ href }) => href);

assert.ok(indexedContentHrefs.includes(targetProblemHref));
assert.ok(indexedContentHrefs.includes(targetDocumentHref));
assert.equal(
  indexedContentHrefs.every(
    (href) => href === targetProblemHref || href.startsWith(targetDocumentHref)
  ),
  true
);

const queryMetadata = buildMetadata({
  title: "Брак и ЗАГС",
  description: "Проверка query-страницы",
  path: targetProblemHref,
  isIndexable: true,
  searchParams: { scenario: "marriage" }
});
assert.equal(typeof queryMetadata.robots, "object");
assert.equal(queryMetadata.robots && typeof queryMetadata.robots === "object" ? queryMetadata.robots.index : true, false);
assert.equal(String(queryMetadata.alternates?.canonical).endsWith(targetProblemHref), true);

console.log("content-reset tests passed");
