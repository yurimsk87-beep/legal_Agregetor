import assert from "node:assert/strict";
import { getChildNameRules } from "@/data/child-name-legal-review";
import { CHILD_NAME_SCENARIO_KEYS } from "@/data/child-name-route";
import { buildChildNamePdfText } from "@/lib/child-name-pdf";
import { getVisibleChildNameFields, validateChildName } from "@/lib/child-name-validator";

const identity = {
  childData: "Иванов Пётр, запись о рождении от 01.02.2016",
  currentName: "Иванов Пётр Иванович",
  requestedName: "Петров Пётр Иванович",
  reason: "Фамилия родителя, с которым живёт ребёнок"
};
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validateChildName>) => {
  outcomes.add(decision.outcomeKey);
  return decision;
};

const joint = record(validateChildName("under-fourteen-agreement", {
  age: "under-10",
  element: "given-name",
  parentsAgree: "yes",
  ...identity
}));
assert.equal(joint.resultKind, "dataSheet");
assert.equal(joint.filingReady, false);
assert.equal(joint.requiresLegalReview, true);
assert.match(buildChildNamePdfText(joint), /Готово к подаче: нет/);

const consented = record(validateChildName("under-fourteen-agreement", {
  age: "10-13",
  element: "surname",
  parentsAgree: "yes",
  childConsent: "yes",
  ...identity
}));
assert.equal(consented.resultKind, "dataSheet");
assert.equal(record(validateChildName("under-fourteen-agreement", { age: "10-13", element: "surname", parentsAgree: "yes", childConsent: "no", ...identity })).outcomeKey, "child-no-consent");
assert.equal(record(validateChildName("under-fourteen-agreement", { age: "under-10", element: "given-name", parentsAgree: "no", ...identity })).outcomeKey, "parents-agreement-review");
assert.equal(record(validateChildName("under-fourteen-agreement", { age: "under-10", element: "patronymic", parentsAgree: "yes", ...identity })).outcomeKey, "patronymic-special-basis-required");

const separate = { age: "under-10", element: "surname", livesWithApplicant: "yes", otherParentPosition: "agrees", exceptionEvidence: "Письменное согласие", ...identity };
assert.equal(record(validateChildName("under-fourteen-dispute", separate)).resultKind, "checklist");
assert.equal(record(validateChildName("under-fourteen-dispute", { ...separate, otherParentPosition: "objects" })).outcomeKey, "other-parent-position-review");
assert.equal(record(validateChildName("under-fourteen-dispute", { ...separate, otherParentPosition: "exception" })).outcomeKey, "other-parent-exception-review");
assert.equal(record(validateChildName("under-fourteen-dispute", { ...separate, element: "given-name" })).outcomeKey, "separate-parent-wrong-element");

const adolescent = { age: "14-17", element: "multiple", fullCapacity: "no", representativeConsent: "yes", ...identity };
assert.equal(record(validateChildName("fourteen-to-seventeen", adolescent)).outcomeKey, "form-20-data-sheet");
assert.equal(record(validateChildName("fourteen-to-seventeen", { ...adolescent, representativeConsent: "no" })).outcomeKey, "court-consent-required");
assert.equal(record(validateChildName("fourteen-to-seventeen", { ...adolescent, fullCapacity: "yes", representativeConsent: "no" })).outcomeKey, "form-20-data-sheet");
assert.equal(record(validateChildName("fourteen-to-seventeen", { ...adolescent, age: "adult" })).outcomeKey, "age-route-review");

const patronymic = record(validateChildName("patronymic-special", { age: "under-14", basis: "paternity", basisDocuments: "Решение суда", ...identity }));
assert.equal(patronymic.resultKind, "legalReviewOnly");
assert.equal(patronymic.filingReady, false);
assert.equal(record(validateChildName("under-fourteen-agreement", {})).outcomeKey, "missing-data");

for (const key of CHILD_NAME_SCENARIO_KEYS) {
  assert.equal(getVisibleChildNameFields(key, {}).length > 0, true);
  assert.equal(getChildNameRules(key).length > 0, true);
}

console.log(`Child-name validation passed: ${outcomes.size} reachable outcomes.`);
