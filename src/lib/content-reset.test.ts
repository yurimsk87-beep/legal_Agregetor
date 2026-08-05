import assert from "node:assert/strict";
import { navigatorDocuments } from "@/data/documents";
import { legalProblems } from "@/data/legal-problems";
import { ZAGS_SCENARIO_KEYS } from "@/data/zags-route";
import { buildMetadata } from "@/lib/seo";
import { getSiteSearchIndex, searchSite } from "@/lib/site-search";

const targetProblemHref = "/problems/semya-i-deti/brak-zags-i-smena-familii/";
const targetDocumentHref = "/documents/zayavlenie-v-zags/";
const divorceProblemHref = "/problems/semya-i-deti/razvod-i-razdel-imushchestva/";
const divorceDocumentHrefs = [
  "/documents/zayavlenie-o-rastorzhenii-braka-v-zags/",
  "/documents/isk-o-rastorzhenii-braka/",
  "/documents/soglashenie-o-razdele-imushchestva/",
  "/documents/isk-o-razdele-imushchestva-suprugov/"
];

assert.deepEqual(
  legalProblems.map(({ categorySlug, slug }) => ({ categorySlug, slug })),
  [
    { categorySlug: "semya-i-deti", slug: "brak-zags-i-smena-familii" },
    { categorySlug: "semya-i-deti", slug: "razvod-i-razdel-imushchestva" }
  ]
);
assert.deepEqual(
  navigatorDocuments.map(({ slug }) => slug),
  [
    "zayavlenie-v-zags",
    "zayavlenie-o-rastorzhenii-braka-v-zags",
    "isk-o-rastorzhenii-braka",
    "soglashenie-o-razdele-imushchestva",
    "isk-o-razdele-imushchestva-suprugov"
  ]
);
assert.equal(ZAGS_SCENARIO_KEYS.length, 4);
assert.equal("templateSlug" in navigatorDocuments[0], false);

const indexedContentHrefs = getSiteSearchIndex()
  .filter(({ type }) => type === "situation" || type === "document")
  .map(({ href }) => href);

assert.ok(indexedContentHrefs.includes(targetProblemHref));
assert.ok(indexedContentHrefs.includes(targetDocumentHref));
assert.ok(indexedContentHrefs.includes(divorceProblemHref));
for (const href of divorceDocumentHrefs) assert.ok(indexedContentHrefs.includes(href));
assert.equal(
  indexedContentHrefs.every(
    (href) => href === targetProblemHref
      || href.startsWith(targetDocumentHref)
      || href === divorceProblemHref
      || divorceDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
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

const divorceQueryMetadata = buildMetadata({
  title: "Развод и раздел имущества",
  description: "Проверка query-страницы",
  path: divorceProblemHref,
  isIndexable: true,
  searchParams: { scenario: "court-divorce" }
});
assert.equal(divorceQueryMetadata.robots && typeof divorceQueryMetadata.robots === "object" ? divorceQueryMetadata.robots.index : true, false);
assert.equal(String(divorceQueryMetadata.alternates?.canonical).endsWith(divorceProblemHref), true);

for (const excludedQuery of ["алименты", "место жительства ребёнка", "порядок общения с ребёнком", "лишение родительских прав", "установление отцовства"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === divorceProblemHref || divorceDocumentHrefs.includes(href)), false, excludedQuery);
}

console.log("content-reset tests passed");
