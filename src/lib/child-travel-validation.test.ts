import assert from "node:assert/strict";
import { getChildTravelRules } from "@/data/child-travel-legal-review";
import { CHILD_TRAVEL_SCENARIO_KEYS } from "@/data/child-travel-route";
import { buildChildTravelPdfText } from "@/lib/child-travel-pdf";
import { getVisibleChildTravelFields, validateChildTravel } from "@/lib/child-travel-validator";

const exit = { childData: "Иванов Пётр, 2015 года рождения", russianCitizen: "yes", travelDocument: "yes", destinations: "Республика Беларусь", travelPeriod: "01.10.2026–10.10.2026", nonConsent: "none" };
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validateChildTravel>) => { outcomes.add(decision.outcomeKey); return decision; };

const withParent = record(validateChildTravel("with-parent", { accompanyingParent: "Иванова Анна, мать", ...exit }));
assert.equal(withParent.resultKind, "checklist");
assert.equal(withParent.filingReady, false);
assert.equal(withParent.requiresLegalReview, false);
assert.match(buildChildTravelPdfText(withParent), /Готово к подаче: нет/);

const withoutParents = record(validateChildTravel("without-parents", { legalRepresentative: "Иванова Анна, мать", companionData: "Петрова Ольга, бабушка", notaryPlanned: "yes", ...exit }));
assert.equal(withoutParents.resultKind, "dataSheet");
assert.equal(withoutParents.filingReady, false);
assert.equal(record(validateChildTravel("without-parents", { legalRepresentative: "Иванова Анна, мать", companionData: "без сопровождения", notaryPlanned: "no", ...exit })).outcomeKey, "notarial-consent-required");

assert.equal(record(validateChildTravel("with-parent", { accompanyingParent: "Иванова Анна, мать", ...exit, nonConsent: "exists" })).outcomeKey, "non-consent-detected");
assert.equal(record(validateChildTravel("with-parent", { accompanyingParent: "Иванова Анна, мать", ...exit, russianCitizen: "no" })).outcomeKey, "citizenship-review");
assert.equal(record(validateChildTravel("with-parent", { accompanyingParent: "Иванова Анна, мать", ...exit, travelDocument: "unsure" })).outcomeKey, "travel-document-review");

const dispute = { applicantData: "Иванова Анна", childData: "Иванов Пётр", objectorData: "Иванов Иван", disagreementScope: "Все государства до 01.01.2027", desiredTrip: "Беларусь, октябрь 2026", childInterests: "Семейная поездка", evidence: "Билеты и бронь", region: "region-moscow" };
const court = record(validateChildTravel("disagreement", { ...dispute, withdrawalPossible: "no" }));
assert.equal(court.resultKind, "courtDraft");
assert.equal(court.filingReady, false);
assert.equal(court.requiresLegalReview, true);
assert.match(court.draftText, /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
assert.equal(record(validateChildTravel("disagreement", { ...dispute, withdrawalPossible: "yes" })).outcomeKey, "withdrawal-first");
assert.equal(record(validateChildTravel("disagreement", { ...dispute, withdrawalPossible: "unsure" })).outcomeKey, "disagreement-status-review");

const foreign = record(validateChildTravel("foreign-requirements", { childCitizenship: "Россия", representativeCitizenship: "Россия", destinations: "Франция, Турция транзитом", travelPeriod: "Октябрь 2026, туризм", companion: "мать", foreignRequirement: "Согласие второго родителя" }));
assert.equal(foreign.resultKind, "legalReviewOnly");
assert.equal(foreign.allowed, false);
assert.equal(record(validateChildTravel("with-parent", {})).outcomeKey, "missing-data");
assert.equal(record(validateChildTravel("disagreement", { ...dispute, region: "Москва вручную", withdrawalPossible: "no" })).outcomeKey, "invalid-region");
for (const key of CHILD_TRAVEL_SCENARIO_KEYS) { assert.equal(getVisibleChildTravelFields(key).length > 0, true); assert.equal(getChildTravelRules(key).length > 0, true); }

console.log(`Child-travel validation passed: ${outcomes.size} reachable outcomes.`);
