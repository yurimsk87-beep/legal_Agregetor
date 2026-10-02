import assert from "node:assert/strict";
import { getParentalRightsRestorationRules } from "@/data/parental-rights-restoration-legal-review";
import { PARENTAL_RIGHTS_RESTORATION_SCENARIO_KEYS } from "@/data/parental-rights-restoration-route";
import { ensureParentalRightsRestorationDraftMarker } from "@/lib/parental-rights-restoration-docx";
import { buildParentalRightsRestorationPdfText } from "@/lib/parental-rights-restoration-pdf";
import { getVisibleParentalRightsRestorationFields, validateParentalRightsRestoration } from "@/lib/parental-rights-restoration-validator";

const base = { deprivationDecision: "yes", decisionDetails: "Решение районного суда от 01.02.2024, дело № 1", circumstancesChanged: "yes", changeEvidence: "Стабильное жильё, работа и документы об устранении прежних обстоятельств", currentRisks: "no", childAge: "under-10", childAdopted: "no", applicantData: "Иванов Иван, дата рождения, адрес, паспорт", caregiverData: "Иванова Анна, адрес", childData: "Иванов Пётр, 2018 года рождения, адрес", courtRegion: "region-moscow", courtName: "Тверской районный суд города Москвы", courtSource: "https://tverskoy.msk.sudrf.ru/", courtConfirmed: "yes" };
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validateParentalRightsRestoration>) => { outcomes.add(decision.outcomeKey); return decision; };

const restoration = record(validateParentalRightsRestoration("restoration", base));
assert.equal(restoration.resultKind, "courtDraft");
assert.equal(restoration.filingReady, false);
assert.equal(restoration.requiresLegalReview, true);
assert.match(restoration.draftText, /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
assert.match(buildParentalRightsRestorationPdfText(restoration), /Готово к подаче: нет/);
assert.match(ensureParentalRightsRestorationDraftMarker("Текст"), /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);

const withReturn = record(validateParentalRightsRestoration("restoration-return", { ...base, returnBasis: "Ребёнок сохраняет связь с родителем", livingConditions: "Отдельная комната и подтверждённый уход" }));
assert.equal(withReturn.legalPath, "return");
assert.match(withReturn.draftText, /Основания требования о возврате/);

assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, deprivationDecision: "no" })).outcomeKey, "no-deprivation-decision");
assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, childAge: "adult" })).outcomeKey, "adult-child");
assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, childAdopted: "yes", adoptionCancelled: "no" })).outcomeKey, "adoption-barrier");
assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, childAge: "10-17", childConsent: "no" })).outcomeKey, "child-refuses");
assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, circumstancesChanged: "no" })).outcomeKey, "changes-not-confirmed");
assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, currentRisks: "yes" })).outcomeKey, "current-risks");
assert.equal(record(validateParentalRightsRestoration("restoration", { ...base, courtSource: "https://example.com/" })).outcomeKey, "court-not-confirmed");
assert.equal(record(validateParentalRightsRestoration("barrier-review", { deprivationDecision: "yes", decisionDetails: base.decisionDetails, circumstancesChanged: "yes", changeEvidence: base.changeEvidence, currentRisks: "no", childAge: "under-10", childAdopted: "no" })).outcomeKey, "no-statutory-barrier-detected");
assert.equal(record(validateParentalRightsRestoration("restoration", {})).outcomeKey, "missing-data");
assert.equal(getVisibleParentalRightsRestorationFields("restoration", { childAge: "under-10", childAdopted: "no" }).some((field) => field.name === "childConsent"), false);
assert.equal(getVisibleParentalRightsRestorationFields("restoration", { childAge: "10-17", childAdopted: "yes" }).some((field) => field.name === "adoptionCancelled"), true);
for (const key of PARENTAL_RIGHTS_RESTORATION_SCENARIO_KEYS) assert.equal(getParentalRightsRestorationRules(key).length > 0, true);
console.log(`Parental-rights restoration validation passed: ${outcomes.size} reachable outcomes.`);
