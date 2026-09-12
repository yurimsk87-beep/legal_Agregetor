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
const guardianshipProblemHref = "/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/";
const guardianshipDocumentHrefs = [
  "/documents/zayavlenie-o-naznachenii-opekuna-rebenku/",
  "/documents/zayavlenie-roditelya-o-naznachenii-opekuna/",
  "/documents/dokumenty-po-imushchestvu-podopechnogo/",
  "/documents/zhaloba-na-organ-opeki/"
];
const parentsChildProblemHref = "/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/";
const parentsChildDocumentHrefs = [
  "/documents/mesto-zhitelstva-rebenka-posle-razvoda/",
  "/documents/poryadok-obshcheniya-s-rebenkom/",
  "/documents/izmenenie-poryadka-po-rebenku/",
  "/documents/ispolnenie-resheniya-o-rebenke/"
];
const childSupportProblemHref = "/problems/semya-i-deti/alimenty-na-rebenka/";
const childSupportDocumentHrefs = [
  "/documents/soglashenie-ob-uplate-alimentov-na-rebenka/",
  "/documents/vzyskanie-alimentov-na-rebenka/",
  "/documents/izmenenie-razmera-alimentov-na-rebenka/",
  "/documents/raschet-zadolzhennosti-po-alimentam/",
  "/documents/ispolnenie-alimentov-na-rebenka/"
];
const deprivationProblemHref = "/problems/semya-i-deti/lishenie-roditelskih-prav/";
const deprivationDocumentHrefs = [
  "/documents/proverka-osnovaniy-lisheniya-roditelskih-prav/",
  "/documents/isk-o-lishenii-roditelskih-prav/",
  "/documents/uchet-resheniy-pri-lishenii-roditelskih-prav/",
  "/documents/lishenie-roditelskih-prav-i-alimenty/"
];
const restrictionProblemHref = "/problems/semya-i-deti/ogranichenie-roditelskih-prav/";
const restrictionDocumentHrefs = [
  "/documents/ogranichenie-prav-po-nezavisyashchim-obstoyatelstvam/",
  "/documents/proverka-opasnogo-povedeniya-roditelya/",
  "/documents/isk-ob-ogranichenii-roditelskih-prav/"
];

assert.deepEqual(
  legalProblems.map(({ categorySlug, slug }) => ({ categorySlug, slug })),
  [
    { categorySlug: "semya-i-deti", slug: "brak-zags-i-smena-familii" },
    { categorySlug: "semya-i-deti", slug: "razvod-i-razdel-imushchestva" },
    { categorySlug: "semya-i-deti", slug: "opeka-i-popechitelstvo-nad-rebenkom" },
    { categorySlug: "semya-i-deti", slug: "roditeli-i-rebenok-posle-razvoda" },
    { categorySlug: "semya-i-deti", slug: "alimenty-na-rebenka" },
    { categorySlug: "semya-i-deti", slug: "lishenie-roditelskih-prav" },
    { categorySlug: "semya-i-deti", slug: "ogranichenie-roditelskih-prav" }
  ]
);
assert.deepEqual(
  navigatorDocuments.map(({ slug }) => slug),
  [
    "zayavlenie-v-zags",
    "zayavlenie-o-rastorzhenii-braka-v-zags",
    "isk-o-rastorzhenii-braka",
    "soglashenie-o-razdele-imushchestva",
    "isk-o-razdele-imushchestva-suprugov",
    "zayavlenie-o-naznachenii-opekuna-rebenku",
    "zayavlenie-roditelya-o-naznachenii-opekuna",
    "dokumenty-po-imushchestvu-podopechnogo",
    "zhaloba-na-organ-opeki",
    "mesto-zhitelstva-rebenka-posle-razvoda",
    "poryadok-obshcheniya-s-rebenkom",
    "izmenenie-poryadka-po-rebenku",
    "ispolnenie-resheniya-o-rebenke",
    "soglashenie-ob-uplate-alimentov-na-rebenka",
    "vzyskanie-alimentov-na-rebenka",
    "izmenenie-razmera-alimentov-na-rebenka",
    "raschet-zadolzhennosti-po-alimentam",
    "ispolnenie-alimentov-na-rebenka",
    "proverka-osnovaniy-lisheniya-roditelskih-prav",
    "isk-o-lishenii-roditelskih-prav",
    "uchet-resheniy-pri-lishenii-roditelskih-prav",
    "lishenie-roditelskih-prav-i-alimenty",
    "ogranichenie-prav-po-nezavisyashchim-obstoyatelstvam",
    "proverka-opasnogo-povedeniya-roditelya",
    "isk-ob-ogranichenii-roditelskih-prav"
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
assert.ok(indexedContentHrefs.includes(guardianshipProblemHref));
for (const href of guardianshipDocumentHrefs) assert.ok(indexedContentHrefs.includes(href));
assert.ok(indexedContentHrefs.includes(parentsChildProblemHref));
for (const href of parentsChildDocumentHrefs) assert.ok(indexedContentHrefs.includes(href));
assert.ok(indexedContentHrefs.includes(childSupportProblemHref));
for (const href of childSupportDocumentHrefs) assert.ok(indexedContentHrefs.includes(href));
assert.ok(indexedContentHrefs.includes(deprivationProblemHref));
for (const href of deprivationDocumentHrefs) assert.ok(indexedContentHrefs.includes(href));
assert.ok(indexedContentHrefs.includes(restrictionProblemHref));
for (const href of restrictionDocumentHrefs) assert.ok(indexedContentHrefs.includes(href));
assert.equal(
  indexedContentHrefs.every(
    (href) => href === targetProblemHref
      || href.startsWith(targetDocumentHref)
      || href === divorceProblemHref
      || divorceDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
      || href === guardianshipProblemHref
      || guardianshipDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
      || href === parentsChildProblemHref
      || parentsChildDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
      || href === childSupportProblemHref
      || childSupportDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
      || href === deprivationProblemHref
      || deprivationDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
      || href === restrictionProblemHref
      || restrictionDocumentHrefs.some((documentHref) => href.startsWith(documentHref))
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

const guardianshipQueryMetadata = buildMetadata({
  title: "Опека и попечительство над ребёнком",
  description: "Проверка query-страницы",
  path: guardianshipProblemHref,
  isIndexable: true,
  searchParams: { scenario: "appointment" }
});
assert.equal(guardianshipQueryMetadata.robots && typeof guardianshipQueryMetadata.robots === "object" ? guardianshipQueryMetadata.robots.index : true, false);
assert.equal(String(guardianshipQueryMetadata.alternates?.canonical).endsWith(guardianshipProblemHref), true);

const parentsChildQueryMetadata = buildMetadata({
  title: "Родители и ребёнок после развода",
  description: "Проверка query-страницы",
  path: parentsChildProblemHref,
  isIndexable: true,
  searchParams: { scenario: "communication" }
});
assert.equal(parentsChildQueryMetadata.robots && typeof parentsChildQueryMetadata.robots === "object" ? parentsChildQueryMetadata.robots.index : true, false);
assert.equal(String(parentsChildQueryMetadata.alternates?.canonical).endsWith(parentsChildProblemHref), true);

const childSupportQueryMetadata = buildMetadata({
  title: "Алименты на ребёнка",
  description: "Проверка query-страницы",
  path: childSupportProblemHref,
  isIndexable: true,
  searchParams: { scenario: "first" }
});
assert.equal(childSupportQueryMetadata.robots && typeof childSupportQueryMetadata.robots === "object" ? childSupportQueryMetadata.robots.index : true, false);
assert.equal(String(childSupportQueryMetadata.alternates?.canonical).endsWith(childSupportProblemHref), true);

const deprivationQueryMetadata = buildMetadata({
  title: "Лишение родительских прав",
  description: "Проверка query-страницы",
  path: deprivationProblemHref,
  isIndexable: true,
  searchParams: { scenario: "court" }
});
assert.equal(deprivationQueryMetadata.robots && typeof deprivationQueryMetadata.robots === "object" ? deprivationQueryMetadata.robots.index : true, false);
assert.equal(String(deprivationQueryMetadata.alternates?.canonical).endsWith(deprivationProblemHref), true);

const restrictionQueryMetadata = buildMetadata({
  title: "Ограничение родительских прав",
  description: "Проверка query-страницы",
  path: restrictionProblemHref,
  isIndexable: true,
  searchParams: { scenario: "court" }
});
assert.equal(restrictionQueryMetadata.robots && typeof restrictionQueryMetadata.robots === "object" ? restrictionQueryMetadata.robots.index : true, false);
assert.equal(String(restrictionQueryMetadata.alternates?.canonical).endsWith(restrictionProblemHref), true);

for (const excludedQuery of ["алименты", "место жительства ребёнка", "порядок общения с ребёнком", "лишение родительских прав", "установление отцовства"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === divorceProblemHref || divorceDocumentHrefs.includes(href)), false, excludedQuery);
}

for (const excludedQuery of ["усыновить ребёнка", "опека над недееспособным взрослым", "лишение родительских прав"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === guardianshipProblemHref || guardianshipDocumentHrefs.includes(href)), false, excludedQuery);
}

for (const query of ["с кем будет жить ребёнок после развода", "порядок общения с ребёнком", "не исполняется решение суда об общении с ребёнком"]) {
  const hrefs = searchSite(query).map(({ href }) => href);
  assert.equal(hrefs.includes(parentsChildProblemHref), true, query);
}

for (const excludedQuery of ["взыскать алименты", "лишить родительских прав", "установить отцовство", "оформить опеку над ребёнком", "выезд ребёнка за границу"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === parentsChildProblemHref || parentsChildDocumentHrefs.includes(href)), false, excludedQuery);
}

for (const query of ["взыскать алименты на ребёнка", "задолженность по алиментам на ребёнка", "соглашение об алиментах на ребёнка"]) {
  const hrefs = searchSite(query).map(({ href }) => href);
  assert.equal(hrefs.includes(childSupportProblemHref), true, query);
}
for (const excludedQuery of ["алименты жене", "содержание бывшего супруга", "установить отцовство", "усыновить ребёнка", "оформить опеку над ребёнком"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === childSupportProblemHref || childSupportDocumentHrefs.includes(href)), false, excludedQuery);
}

for (const query of ["лишить отца родительских прав", "основания лишения родительских прав", "лишить родительских прав и взыскать алименты"]) {
  const hrefs = searchSite(query).map(({ href }) => href);
  assert.equal(hrefs.includes(deprivationProblemHref), true, query);
}
for (const excludedQuery of ["ограничить родительские права", "восстановить родительские права", "оспорить отцовство", "усыновить ребёнка"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === deprivationProblemHref || deprivationDocumentHrefs.includes(href)), false, excludedQuery);
}

for (const query of ["ограничить родительские права", "ограничение родительских прав из-за болезни", "иск об ограничении родительских прав"]) {
  const hrefs = searchSite(query).map(({ href }) => href);
  assert.equal(hrefs.includes(restrictionProblemHref), true, query);
}
for (const excludedQuery of ["лишить родительских прав", "восстановить родительские права", "отменить ограничение родительских прав", "усыновить ребёнка"]) {
  const hrefs = searchSite(excludedQuery).map(({ href }) => href);
  assert.equal(hrefs.some((href) => href === restrictionProblemHref || restrictionDocumentHrefs.includes(href)), false, excludedQuery);
}

console.log("content-reset tests passed");
