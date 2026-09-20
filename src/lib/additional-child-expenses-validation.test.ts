import assert from "node:assert/strict";
import { validateAdditionalChildExpenses } from "@/lib/additional-child-expenses-validator";
const common = { childStatus: "minor", expenseCategory: "serious-illness", expenseDetails: "Назначенное лечение", necessityEvidence: "yes", evidenceDetails: "Назначение врача и счета", international: "no" };
const people = { applicantData: "Иванова Анна", otherParentData: "Иванов Иван", childData: "Иванов Пётр, 2018", totalAmount: "50000", requestedShare: "25000 рублей однократно", financialCircumstances: "Известные сведения указаны" };
const court = { courtName: "Тверской районный суд города Москвы", courtSource: "https://tverskoy.msk.sudrf.ru/", courtConfirmed: "yes" };
const cases = [
  ["assessment", common, "minor-serious-illness-eligible-checklist", "checklist"],
  ["assessment", { ...common, childStatus: "adult-disabled-needy" }, "adult-disabled-needy-serious-illness-eligible-checklist", "checklist"],
  ["assessment", { ...common, expenseCategory: "ordinary" }, "ordinary-expense-review", "legalReviewOnly"],
  ["assessment", { ...common, expenseCategory: "other" }, "exceptional-circumstance-unclear", "legalReviewOnly"],
  ["assessment", { ...common, childStatus: "adult-other" }, "adult-child-inapplicable", "legalReviewOnly"],
  ["assessment", { ...common, necessityEvidence: "no" }, "necessity-not-supported", "legalReviewOnly"],
  ["assessment", { ...common, international: "yes" }, "international-review", "legalReviewOnly"],
  ["agreement", { ...common, ...people, parentsAgree: "yes", paymentTerms: "Оплата по счетам" }, "serious-illness-agreement-draft", "agreementDraft"],
  ["agreement", { ...common, ...people, parentsAgree: "no", paymentTerms: "Нет" }, "agreement-not-reached", "legalReviewOnly"],
  ["incurred", { ...common, ...people, ...court, paymentProof: "Чеки и выписки" }, "serious-illness-incurred-court-draft", "courtDraft"],
  ["future", { ...common, ...people, ...court, futureCalculation: "Счета на 6 месяцев" }, "serious-illness-future-court-draft", "courtDraft"],
  ["incurred", { ...common, ...people, paymentProof: "Чеки", courtName: "Суд", courtSource: "https://example.org", courtConfirmed: "yes" }, "court-not-confirmed", "legalReviewOnly"],
  ["assessment", {}, "missing-data", "legalReviewOnly"]
] as const;
for (const [scenario, values, outcome, kind] of cases) { const result = validateAdditionalChildExpenses(scenario, values); assert.equal(result.outcomeKey, outcome); assert.equal(result.resultKind, kind); assert.equal(result.filingReady, false); }
console.log(`Additional-child-expenses validation passed: ${cases.length} reachable outcomes.`);
