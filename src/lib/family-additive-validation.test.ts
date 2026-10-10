import assert from "node:assert/strict";
import { FAMILY_ADDITIVE_ROUTES, type FamilyAdditiveRouteSlug } from "@/data/family-additive-routes";
import { validateFamilyAdditiveScenario, type FamilyAdditiveValues } from "@/lib/family-additive-validator";

function completeValues(routeSlug: FamilyAdditiveRouteSlug, scenarioKey: string, overrides: FamilyAdditiveValues = {}) {
  const scenario = FAMILY_ADDITIVE_ROUTES[routeSlug].scenarios[scenarioKey];
  const values: FamilyAdditiveValues = {};
  for (const field of scenario.helperFields) {
    if (field.type === "select") values[field.name] = field.options?.[0]?.value ?? "yes";
    else if (field.type === "number") values[field.name] = "10000";
    else if (field.type === "court-name") values[field.name] = "Тверской районный суд города Москвы";
    else values[field.name] = "Подтверждённые сведения и реквизиты документа";
  }
  return { ...values, ...overrides };
}

const cases: Array<{
  route: FamilyAdditiveRouteSlug;
  scenario: string;
  overrides?: FamilyAdditiveValues;
  outcome: string;
  kind: string;
  redirect?: string;
}> = [
  { route: "alimenty-na-sovershennoletnego-rebenka", scenario: "eligibility", outcome: "eligible", kind: "checklist" },
  { route: "alimenty-na-sovershennoletnego-rebenka", scenario: "eligibility", overrides: { childAgeStatus: "no" }, outcome: "minor-child", kind: "legalReviewOnly", redirect: "/problems/semeynoe-pravo/alimenty-na-rebenka/" },
  { route: "alimenty-na-sovershennoletnego-rebenka", scenario: "eligibility", overrides: { incapacityConfirmed: "no", studyOnly: "yes" }, outcome: "study-only", kind: "legalReviewOnly" },
  { route: "alimenty-na-sovershennoletnego-rebenka", scenario: "claim", outcome: "court-draft", kind: "courtDraft" },
  { route: "prekrashchenie-i-osvobozhdenie-ot-alimentov", scenario: "termination", overrides: { paternityDispute: "no", terminationBasis: "majority", basisConfirmed: "yes" }, outcome: "majority-termination-check", kind: "checklist" },
  { route: "prekrashchenie-i-osvobozhdenie-ot-alimentov", scenario: "termination", overrides: { paternityDispute: "yes" }, outcome: "paternity-conflict", kind: "legalReviewOnly", redirect: "/problems/semeynoe-pravo/osparivanie-otcovstva/" },
  { route: "prekrashchenie-i-osvobozhdenie-ot-alimentov", scenario: "debtRelief", overrides: { paternityDispute: "no", hasDebt: "yes", nonpaymentReason: "illness", cannotRepay: "yes" }, outcome: "debt-relief-court-draft", kind: "courtDraft" },
  { route: "alimenty-na-soderzhanie-roditeley", scenario: "eligibility", overrides: { directionConfirmed: "yes", childAdult: "yes", childAble: "yes", parentIncapacity: "yes", parentNeed: "yes", parentDeprived: "no", parentAvoidedDuties: "no" }, outcome: "eligible", kind: "checklist" },
  { route: "alimenty-na-soderzhanie-roditeley", scenario: "eligibility", overrides: { directionConfirmed: "no" }, outcome: "reverse-direction", kind: "legalReviewOnly", redirect: "/problems/semeynoe-pravo/alimenty-na-sovershennoletnego-rebenka/" },
  { route: "otmena-usynovleniya", scenario: "eligibility", overrides: { adoptedAge: "no", international: "no", cancellationGround: "avoidance" }, outcome: "eligible", kind: "checklist" },
  { route: "otmena-usynovleniya", scenario: "eligibility", overrides: { adoptedAge: "no", international: "no", cancellationGround: "divorce-only" }, outcome: "ground-unconfirmed", kind: "legalReviewOnly" },
  { route: "otmena-usynovleniya", scenario: "adultConsent", overrides: { adoptedAge: "yes", international: "no", cancellationGround: "child-interest", adultAdopteeConsent: "yes", adopterConsent: "yes" }, outcome: "adult-consent-data", kind: "preparedData" },
  { route: "dokumenty-o-rozhdenii-i-aktovaya-zapis", scenario: "correction", overrides: { hasDispute: "no" }, outcome: "official-form-23", kind: "officialForm" },
  { route: "dokumenty-o-rozhdenii-i-aktovaya-zapis", scenario: "repeatCertificate", overrides: { subjectStatus: "adult-living" }, outcome: "adult-third-party", kind: "legalReviewOnly" }
];

for (const testCase of cases) {
  const values = completeValues(testCase.route, testCase.scenario, testCase.overrides);
  const decision = validateFamilyAdditiveScenario(testCase.route, testCase.scenario, values);
  assert.equal(decision.outcomeKey, testCase.outcome, `${testCase.route}/${testCase.scenario}: outcome`);
  assert.equal(decision.resultKind, testCase.kind, `${testCase.route}/${testCase.scenario}: result kind`);
  assert.equal(decision.filingReady, false, `${testCase.route}/${testCase.scenario}: filing readiness`);
  assert.equal(decision.redirectPath, testCase.redirect, `${testCase.route}/${testCase.scenario}: redirect`);
}

for (const [basis, expectedForm] of Object.entries({
  "married-parents": "1",
  "unmarried-mother": "2",
  "late-adult-registration": "3",
  stillbirth: "4",
  "found-child": "5",
  "outside-medical": "6"
})) {
  const values = completeValues("dokumenty-o-rozhdenii-i-aktovaya-zapis", "registration", { birthFormBasis: basis });
  const decision = validateFamilyAdditiveScenario("dokumenty-o-rozhdenii-i-aktovaya-zapis", "registration", values);
  assert.equal(decision.outcomeKey, `official-form-${expectedForm}`);
  assert.equal(decision.officialForm?.number, expectedForm);
  assert.equal(decision.filingReady, false);
}

const missing = validateFamilyAdditiveScenario("alimenty-na-sovershennoletnego-rebenka", "eligibility", {});
assert.equal(missing.outcomeKey, "missing-data");
assert.ok(missing.issues.length > 0);

const scenarios = Object.values(FAMILY_ADDITIVE_ROUTES).flatMap((route) => Object.values(route.scenarios));
assert.equal(scenarios.length, 21);
assert.equal(new Set(scenarios.map((scenario) => scenario.documentSlug)).size, scenarios.length);

console.log(`Family additive validation passed: ${cases.length + 7} outcomes, ${scenarios.length} unique scenarios.`);
