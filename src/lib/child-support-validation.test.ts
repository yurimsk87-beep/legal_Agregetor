import assert from "node:assert/strict";
import { getChildSupportRules } from "@/data/child-support-legal-review";
import { CHILD_SUPPORT_SCENARIO_KEYS } from "@/data/child-support-route";
import { buildChildSupportPdfText } from "@/lib/child-support-pdf";
import { getVisibleChildSupportFields, validateChildSupport } from "@/lib/child-support-validator";

const people = { applicantData: "Иванова Ирина, адрес", payerData: "Иванов Иван, дата и место рождения, адрес", childData: "Иванов Пётр, 01.01.2018", childLivesWithApplicant: "yes" };
const safe = { childMinor: "yes", paternityRecorded: "yes", paternityDispute: "no", international: "no" };
const court = { courtName: "Судебный участок № 1", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" };
const bailiff = { bailiffOffice: "Подразделение ФССП", bailiffSource: "https://fssp.gov.ru/iss/ip" };
const outcomes = new Set<string>();

function record(decision: ReturnType<typeof validateChildSupport>) {
  outcomes.add(decision.outcomeKey);
  return decision;
}

const agreement = record(validateChildSupport("agreement", { bothAgree: "yes", ...safe, ...people, paymentMethod: "fixed", paymentTerms: "Ежемесячно", indexationTerms: "По закону" }));
assert.equal(agreement.outcomeKey, "agreement-notary-project");
assert.equal(agreement.filingReady, false);
assert.match(agreement.draftText, /ПРОЕКТ ДЛЯ НОТАРИУСА/);
assert.equal(record(validateChildSupport("agreement", { bothAgree: "no", ...safe })).resultKind, "legalReviewOnly");

const order = record(validateChildSupport("first", { ...safe, existingInstrument: "no", otherInterested: "no", paymentMethod: "share", payerIncomeStable: "yes", ...people, requestedSupport: "Взыскать алименты в доле", ...court }));
assert.equal(order.outcomeKey, "first-court-order-draft");
assert.equal(order.legalPath, "order");
assert.equal(order.filingReady, false);
assert.match(order.draftText, /Применимость приказного производства/);

const fixedClaim = record(validateChildSupport("first", { ...safe, existingInstrument: "no", otherInterested: "no", paymentMethod: "fixed", payerIncomeStable: "no", ...people, requestedSupport: "Взыскать твёрдую сумму", ...court }));
assert.equal(fixedClaim.outcomeKey, "first-claim-draft");
assert.equal(fixedClaim.legalPath, "claim");
assert.equal(record(validateChildSupport("first", { ...safe, paternityDispute: "yes" })).outcomeKey, "parentage-review");
assert.equal(record(validateChildSupport("first", { ...safe, international: "yes" })).outcomeKey, "international-review");
assert.equal(record(validateChildSupport("first", { ...safe, existingInstrument: "yes" })).outcomeKey, "existing-instrument");
const missing = validateChildSupport("first", {});
assert.equal(missing.allowed, false);
assert.equal(missing.draftText, "");

const agreementChange = record(validateChildSupport("change", { ...safe, currentBasis: "agreement", bothAgree: "yes", ...people, currentTerms: "Действующие условия", changedCircumstances: "Изменения", requestedChange: "Новые условия" }));
assert.equal(agreementChange.outcomeKey, "change-agreement-project");
assert.match(agreementChange.draftText, /ПРОЕКТ ДЛЯ НОТАРИУСА/);
assert.equal(getVisibleChildSupportFields("change", { currentBasis: "agreement", bothAgree: "yes" }).some((field) => field.name === "courtName"), false);
const courtChange = record(validateChildSupport("change", { ...safe, currentBasis: "court", ...people, currentTerms: "Решение суда", changedCircumstances: "Изменения", requestedChange: "Изменить размер", ...court }));
assert.equal(courtChange.outcomeKey, "change-court-draft");
assert.equal(courtChange.requiresLegalReview, true);

assert.equal(record(validateChildSupport("debt", { executiveDocument: "no", bailiffCalculation: "no", calculationDisputed: "no", international: "no" })).outcomeKey, "debt-check-instrument");
const debtRequest = record(validateChildSupport("debt", { executiveDocument: "yes", bailiffCalculation: "no", calculationDisputed: "no", international: "no", ...people, instrumentDetails: "Исполнительный лист", debtPeriod: "2025–2026", paymentHistory: "Платежей нет", ...bailiff }));
assert.equal(debtRequest.outcomeKey, "debt-calculation-request");
assert.equal(debtRequest.filingReady, false);
const debtDispute = record(validateChildSupport("debt", { executiveDocument: "yes", bailiffCalculation: "yes", calculationDisputed: "yes", international: "no", ...people, instrumentDetails: "Исполнительный лист", debtPeriod: "2025–2026", paymentHistory: "Выписки", ...bailiff }));
assert.equal(debtDispute.outcomeKey, "debt-dispute-review");

assert.equal(record(validateChildSupport("enforcement", { executiveDocument: "no", international: "no" })).outcomeKey, "enforcement-get-instrument");
const opening = record(validateChildSupport("enforcement", { executiveDocument: "yes", enforcementStarted: "no", international: "no", ...people, instrumentDetails: "Исполнительный лист", nonPaymentFacts: "Не платит", ...bailiff }));
assert.equal(opening.outcomeKey, "enforcement-opening-request");
const active = record(validateChildSupport("enforcement", { executiveDocument: "yes", enforcementStarted: "yes", international: "no", ...people, instrumentDetails: "Исполнительный лист", enforcementDetails: "Производство № 1", nonPaymentFacts: "Не исполняется", ...bailiff }));
assert.equal(active.outcomeKey, "enforcement-bailiff-request");

for (const decision of [agreement, order, fixedClaim, agreementChange, courtChange, debtRequest, opening, active]) {
  assert.equal(decision.filingReady, false);
  assert.match(buildChildSupportPdfText(decision), /Готово к подаче: нет/);
}
assert.equal(getChildSupportRules("first", "order").some((rule) => rule.id === "gpk-122"), true);
assert.equal(getChildSupportRules("first", "order").some((rule) => rule.id === "sk-83"), false);
assert.equal(getChildSupportRules("first", "claim").some((rule) => rule.id === "sk-83"), true);
for (const key of CHILD_SUPPORT_SCENARIO_KEYS) assert.equal(getVisibleChildSupportFields(key, {}).length > 0, true);

console.log(`Child-support validation passed: ${outcomes.size} reachable outcomes.`);
