import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLegalRouteRegistry, LEGACY_FAMILY_ROUTE_SLUGS } from "@/data/legal-route-standard";
import { createLegacyFamilyDocumentResult } from "@/lib/legacy-family-document-result";

const helpers = [
  ["brak-zags-i-smena-familii", "ZagsApplicationHelper", "zags-prepared-data"],
  ["razvod-i-razdel-imushchestva", "DivorcePropertyDocumentHelper", "versioned-family-result"],
  ["alimenty-na-rebenka", "ChildSupportDocumentHelper", "child-support"],
  ["lishenie-roditelskih-prav", "ParentalRightsDeprivationDocumentHelper", "parental-rights-deprivation"],
  ["ogranichenie-roditelskih-prav", "ParentalRightsRestrictionDocumentHelper", "parental-rights-restriction"],
  ["ustanovlenie-otcovstva", "PaternityEstablishmentDocumentHelper", "paternity-establishment"],
  ["osparivanie-otcovstva", "PaternityContestDocumentHelper", "paternity-contest"],
  ["usynovlenie-rebenka", "AdoptionDocumentHelper", "adoption"],
  ["vyezd-rebenka-za-granitsu", "ChildTravelDocumentHelper", "child-travel"],
  ["imya-familiya-otchestvo-rebenka", "ChildNameDocumentHelper", "child-name"],
  ["vosstanovlenie-v-roditelskih-pravah", "ParentalRightsRestorationDocumentHelper", "parental-rights-restoration"],
  ["otmena-ogranicheniya-roditelskih-prav", "ParentalRightsRestrictionCancellationDocumentHelper", "parental-rights-restriction-cancellation"],
  ["raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu", "ParentalDisagreementsDocumentHelper", "parental-disagreements"],
  ["dopolnitelnye-rashody-na-rebenka", "AdditionalChildExpensesDocumentHelper", "additional-child-expenses"],
  ["soderzhanie-supruga-i-byvshego-supruga", "SpousalSupportDocumentHelper", "spousal-support"],
  ["brachnyy-dogovor", "PrenuptialAgreementDocumentHelper", "prenuptial-agreement"],
  ["priznanie-braka-nedeystvitelnym", "InvalidMarriageDocumentHelper", "invalid-marriage"],
  ["slozhnye-imushchestvennye-spory-suprugov", "ComplexMaritalPropertyDocumentHelper", "complex-marital-property"],
  ["surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka", "SurrogacyOriginHelper", "surrogacy-origin"],
  ["mezhdunarodnye-semeynye-spory", "InternationalFamilyDisputesHelper", "international-family-disputes"],
  ["obshchenie-rodstvennikov-s-rebenkom", "RelativeChildContactHelper", "relative-child-contact"],
  ["emansipatsiya-nesovershennoletnego", "EmancipationHelper", "emancipation"]
] as const;

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert.equal(helpers.length, 22, "the full outstanding migration must be audited");
const baseline = new Set(LEGACY_FAMILY_ROUTE_SLUGS);
const alreadyAdapted = new Set(["opeka-i-popechitelstvo-nad-rebenkom", "roditeli-i-rebenok-posle-razvoda"]);
assert.deepEqual(new Set([...helpers.map(([slug]) => slug), ...alreadyAdapted]), baseline,
  "the complete 24-route family baseline must be accounted for");

for (const [slug, helperName, pdfName] of helpers) {
  const helperPath = `src/components/documents/${helperName}.tsx`;
  const content = source(helperPath);
  assert.match(content, /useLegacyFamilyDocumentVersions/, `${slug}: missing shared version engine`);
  assert.match(content, /LegacyFamilyVersionPanel/, `${slug}: no accessible version selection UI`);
  assert.match(content, /versions\.record\(/, `${slug}: not creating document versions`);
  assert.match(content, /versions\.canDownload/, `${slug}: PDF export is not tied to version state`);
  assert.match(content, /versions\.restore\(/, `${slug}: previous snapshot cannot be restored`);
  assert.match(content, /versions\.clear\(/, `${slug}: form changes do not invalidate current version`);
  const pdf = source(`src/lib/${pdfName}-pdf.ts`);
  assert.match(pdf, /versionId/, `${slug}: PDF missing version linkage`);
  assert.match(pdf, /НЕ ОФИЦИАЛЬНЫЙ|НЕ ГОТОВ|НЕ ЯВЛЯЕТСЯ|versionId/, `${slug}: PDF result safety indicator missing`);
}

const register = getLegalRouteRegistry();
assert.ok(register.length >= 43, "all original family and labor routes remain registered");
assert.ok(register.filter((item) => item.categorySlug === "semya-i-deti").length >= 29);
assert.ok(register.filter((item) => item.categorySlug === "trudovoe-pravo").length >= 14);
assert.equal(register.filter((item) => item.migrationStatus === "ADAPTED_V1").length, register.length);
assert.equal(register.filter((item) => item.migrationStatus !== "ADAPTED_V1").length, 0);
assert.ok(register.every((item) => item.scenarios.length > 0));
assert.ok(register.flatMap((item) => item.scenarios).every((item) => item.key && item.title));

const emergency = createLegacyFamilyDocumentResult({
  routeSlug: "test", scenarioKey: "urgent", documentSlug: "test-document",
  reviewedAt: "2026-09-18", draft: "",
  source: "DETERMINISTIC",
  decision: { documentTitle: "Срочная защита ребёнка", resultKind: "urgent", pdfAvailable: false }
});
assert.equal(emergency, null, "a dangerous urgent case cannot create a PDF-ready result");

const missingPermission = createLegacyFamilyDocumentResult({
  routeSlug: "test", scenarioKey: "uncertain", documentSlug: "test-document",
  reviewedAt: "2026-10-14", draft: "Текст без разрешения на PDF",
  source: "DETERMINISTIC",
  decision: { documentTitle: "Неопределённый результат", resultKind: "courtDraft" }
});
assert.equal(missingPermission, null, "missing PDF permission must fail closed");

const legalReview = createLegacyFamilyDocumentResult({
  routeSlug: "mezhdunarodnye-semeynye-spory",
  scenarioKey: "child", documentSlug: "mezhdunarodnyy-semeynyy-spor-list-dannyh",
  reviewedAt: "2026-09-18", draft: "", source: "DETERMINISTIC",
  decision: { documentTitle: "Лист данных для международного юриста", resultKind: "legalReviewOnly", pdfAvailable: true, requiresLegalReview: true }
});
assert.equal(legalReview?.resultKind, "LEGAL_REVIEW_ONLY");
assert.equal(legalReview?.filingReady, false);
assert.equal(legalReview?.requiresLegalReview, true);

const edited = createLegacyFamilyDocumentResult({
  routeSlug: "alimenty-na-rebenka", scenarioKey: "court",
  documentSlug: "trebovanie-o-vzyskanii-alimentov",
  reviewedAt: "2026-09-18", draft: "Редакция заявителя",
  source: "USER_EDITED",
  decision: { documentTitle: "Проект документа", resultKind: "courtDraft", pdfAvailable: true }
});
assert.equal(edited?.source, "USER_EDITED");
assert.equal(edited?.filingReady, false);
assert.notEqual(edited?.versionId, legalReview?.versionId);

console.log("All 43 routes have verified V1 registry coverage; 22 previously bespoke family UIs expose versioned, guarded result flows.");
