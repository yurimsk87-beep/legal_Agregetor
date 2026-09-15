import assert from "node:assert/strict";
import { validateSpousalSupport } from "@/lib/spousal-support-validator";

const common = { needConfirmed: "yes", basisConditions: "Подтверждающие документы", payerMeans: "yes", supportRefused: "yes", agreementExists: "yes", international: "no" };
const people = { applicantData: "Иванова Анна", otherSpouseData: "Иванов Иван", marriageData: "Брак зарегистрирован", requestedAmount: "15000 рублей ежемесячно", financialCircumstances: "Доходы и расходы сторон", courtName: "Тверской районный суд города Москвы", courtSource: "https://tverskoy.msk.sudrf.ru/", courtConfirmed: "yes" };

const current = validateSpousalSupport("current", { ...common, ...people, relationship: "current", basis: "care-under-three", commonChild: "yes", actualCare: "yes", childUnderThree: "yes" });
assert.equal(current.resultKind, "courtDraft"); assert.equal(current.filingReady, false); assert.match(current.draftText, /НЕ ГОТОВ К ПОДАЧЕ/);
const former = validateSpousalSupport("former", { ...common, ...people, relationship: "former", basis: "disabled-needy", disabilityConfirmed: "yes", disabilityTiming: "within-year" });
assert.equal(former.resultKind, "courtDraft"); assert.equal(former.requiresLegalReview, true);
const pension = validateSpousalSupport("former", { ...common, ...people, relationship: "former", basis: "pension-long-marriage", pensionWithinFiveYears: "yes", marriageDurationDetails: "Периоды брака указаны" });
assert.equal(pension.resultKind, "legalReviewOnly"); assert.equal(pension.outcomeKey, "long-marriage-individual-review");
const agreement = validateSpousalSupport("agreement", { bothAgree: "yes", relationship: "former", basis: "disabled-needy", ...people, paymentTerms: "Ежемесячно", international: "no" });
assert.equal(agreement.resultKind, "agreementDraft"); assert.equal(agreement.filingReady, false);
const missing = validateSpousalSupport("current", {}); assert.equal(missing.allowed, false); assert.equal(missing.draftText, "");
const assessmentBase = { ...common, relationship: "current", basis: "pregnancy", pregnancyConfirmed: "yes" };
assert.equal(validateSpousalSupport("assessment", assessmentBase).resultKind, "checklist");
assert.equal(validateSpousalSupport("assessment", { ...assessmentBase, pregnancyConfirmed: "no" }).outcomeKey, "pregnancy-not-confirmed");
assert.equal(validateSpousalSupport("assessment", { ...assessmentBase, relationship: "former", pregnancyDuringMarriage: "no" }).outcomeKey, "pregnancy-timing-not-confirmed");
assert.equal(validateSpousalSupport("assessment", { ...common, relationship: "current", basis: "pension-long-marriage", needConfirmed: "yes", pensionWithinFiveYears: "yes", marriageDurationDetails: "20 лет" }).outcomeKey, "former-only-ground");
assert.equal(validateSpousalSupport("assessment", { ...common, relationship: "current", basis: "care-under-three", commonChild: "no", actualCare: "yes", childUnderThree: "yes" }).outcomeKey, "care-conditions-not-confirmed");
assert.equal(validateSpousalSupport("assessment", { ...common, relationship: "current", basis: "care-under-three", commonChild: "yes", actualCare: "yes", childUnderThree: "no" }).outcomeKey, "three-year-period-not-confirmed");
assert.equal(validateSpousalSupport("assessment", { ...common, relationship: "current", basis: "care-disabled-child", commonChild: "yes", actualCare: "yes", disabledChildStatus: "other" }).outcomeKey, "disabled-child-ground-not-confirmed");
assert.equal(validateSpousalSupport("former", { ...common, ...people, basis: "disabled-needy", disabilityConfirmed: "yes", disabilityTiming: "after-year" }).outcomeKey, "disability-timing-not-confirmed");
assert.equal(validateSpousalSupport("current", { ...common, ...people, basis: "pregnancy", pregnancyConfirmed: "yes", payerMeans: "no" }).outcomeKey, "necessary-means-not-shown");
assert.equal(validateSpousalSupport("current", { ...common, ...people, basis: "pregnancy", pregnancyConfirmed: "yes", courtConfirmed: "no" }).outcomeKey, "court-not-confirmed");
console.log("Spousal-support validation passed: 15 material outcomes checked.");
