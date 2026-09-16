import assert from "node:assert/strict";
import { validateInvalidMarriage, type InvalidMarriageValues } from "@/lib/invalid-marriage-validator";

const common: InvalidMarriageValues = { applicant: "Иванова Анна, адрес и контакты", defendant: "Иванов Иван, адрес и контакты", marriageRecord: "Актовая запись № 1 от 01.01.2025", registrationFacts: "Подтверждённые обстоятельства регистрации", evidence: "Свидетельство и документы", marriageEnded: "no", circumstancesRemoved: "no", propertyConsequences: "no", children: "no", prenuptialAgreement: "no", international: "no", courtName: "Тверской районный суд", courtSource: "https://tverskoy.msk.sudrf.ru/", courtConfirmed: "yes" };
function draft(values: InvalidMarriageValues, scenario: Parameters<typeof validateInvalidMarriage>[0]) { const result = validateInvalidMarriage(scenario, values); assert.equal(result.resultKind, "courtDraft"); assert.equal(result.filingReady, false); assert.equal(result.requiresLegalReview, true); assert.ok(result.draftText.startsWith("ЧЕРНОВИК")); return result; }

draft({ ...common, applicantRole: "injured-spouse", consentDefect: "coercion" }, "consent");
draft({ ...common, applicantRole: "minor-spouse", ageAtMarriage: "17", permission: "no", nowAdult: "yes" }, "underage");
draft({ ...common, applicantRole: "parent", ageAtMarriage: "16", permission: "no", nowAdult: "no", minorConsent: "yes" }, "underage");
draft({ ...common, applicantRole: "previous-spouse", obstacleKind: "prior-marriage" }, "obstacle");
draft({ ...common, applicantRole: "unaware-spouse", noFamilyIntent: "other-spouse", familyCreated: "no", circumstancesRemoved: undefined }, "fictitious");
draft({ ...common, applicantRole: "injured-spouse", condition: "hiv", concealedAtMarriage: "yes" }, "concealed-health");
assert.equal(validateInvalidMarriage("consent", { ...common, applicantRole: "other", consentDefect: "coercion" }).outcomeKey, "applicant-not-confirmed");
assert.equal(validateInvalidMarriage("underage", { ...common, applicantRole: "parent", ageAtMarriage: "17", permission: "no", nowAdult: "yes" }).outcomeKey, "applicant-not-confirmed");
assert.equal(validateInvalidMarriage("underage", { ...common, applicantRole: "minor-spouse", ageAtMarriage: "17", permission: "yes", nowAdult: "yes" }).outcomeKey, "permission-review");
assert.equal(validateInvalidMarriage("obstacle", { ...common, applicantRole: "previous-spouse", obstacleKind: "prior-marriage", marriageEnded: "yes" }).resultKind, "courtDraft");
assert.equal(validateInvalidMarriage("fictitious", { ...common, applicantRole: "unaware-spouse", noFamilyIntent: "other-spouse", familyCreated: "yes", circumstancesRemoved: undefined }).outcomeKey, "family-created-review");
assert.equal(validateInvalidMarriage("concealed-health", { ...common, applicantRole: "injured-spouse", condition: "other", concealedAtMarriage: "yes" }).outcomeKey, "condition-not-covered");
assert.equal(validateInvalidMarriage("consent", { ...common, applicantRole: "injured-spouse", consentDefect: "coercion", marriageEnded: "yes" }).outcomeKey, "already-divorced");
assert.equal(validateInvalidMarriage("consent", {}).outcomeKey, "missing-data");
assert.equal(validateInvalidMarriage("consent", { ...common, applicantRole: "injured-spouse", consentDefect: "coercion", courtSource: "https://example.com" }).outcomeKey, "court-not-confirmed");
console.log("Invalid-marriage validation passed: 15 material outcomes checked.");
