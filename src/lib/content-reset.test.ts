import assert from "node:assert/strict";
import { documentTemplates } from "@/data/document-templates";
import { navigatorDocuments } from "@/data/documents";
import { legalProblems } from "@/data/legal-problems";
import { ZAGS_SCENARIO_KEYS } from "@/data/zags-route";
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
assert.deepEqual(
  documentTemplates.map(({ slug }) => slug),
  ["zayavlenie-v-zags"]
);
assert.equal(ZAGS_SCENARIO_KEYS.length, 4);

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

console.log("content-reset tests passed");
