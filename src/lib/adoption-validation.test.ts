import assert from "node:assert/strict";
import { getAdoptionRules } from "@/data/adoption-legal-review";
import { ADOPTION_SCENARIO_KEYS } from "@/data/adoption-route";
import { buildAdoptionPdfText } from "@/lib/adoption-pdf";
import { getVisibleAdoptionFields, validateAdoption } from "@/lib/adoption-validator";

const common = {
  applicantData: "Иванова Анна, подтверждённые сведения",
  childData: "Иванов Пётр, сведения о ребёнке и семье",
  childAge: "under-10",
  eligibilityChecked: "yes",
  region: "region-moscow",
  circumstances: "Обстоятельства и интересы ребёнка"
};
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validateAdoption>) => { outcomes.add(decision.outcomeKey); return decision; };

const stepParent = record(validateAdoption("step-parent", { ...common, marriedToParent: "yes", otherParentConsent: "yes", applicantSpouseConsent: "yes" }));
assert.equal(stepParent.resultKind, "checklist");
assert.equal(stepParent.filingReady, false);
assert.equal(stepParent.requiresLegalReview, true);
assert.match(buildAdoptionPdfText(stepParent), /Готово к подаче: нет/);
assert.equal(record(validateAdoption("step-parent", { ...common, marriedToParent: "yes", otherParentConsent: "no", applicantSpouseConsent: "yes" })).outcomeKey, "step-parent-consent-review");

const olderChild = record(validateAdoption("step-parent", { ...common, childAge: "10-plus", childConsent: "no", marriedToParent: "yes", otherParentConsent: "yes", applicantSpouseConsent: "yes" }));
assert.equal(olderChild.outcomeKey, "child-no-consent");
assert.equal(olderChild.resultKind, "legalReviewOnly");

const domestic = record(validateAdoption("domestic", { ...common, russianResident: "yes", childStatusConfirmed: "yes", candidateConclusion: "yes" }));
assert.equal(domestic.resultKind, "checklist");
assert.equal(record(validateAdoption("domestic", { ...common, russianResident: "yes", childStatusConfirmed: "yes", candidateConclusion: "no" })).outcomeKey, "domestic-prepare-conclusion");
assert.equal(record(validateAdoption("domestic", { ...common, russianResident: "no", childStatusConfirmed: "yes", candidateConclusion: "yes" })).outcomeKey, "foreign-element-detected");

const consent = record(validateAdoption("consent-review", { ...common, missingConsent: "parent", claimedException: "missing-parent", evidence: "Вступивший в силу судебный акт" }));
assert.equal(consent.resultKind, "legalReviewOnly");
assert.equal(consent.allowed, false);
assert.equal(record(validateAdoption("consent-review", { ...common, missingConsent: "parent", claimedException: "other", evidence: "Описание" })).outcomeKey, "consent-exception-review");

const international = record(validateAdoption("international", { applicantCitizenship: "Россия", applicantResidence: "Другое государство", childCitizenship: "Россия", childLocation: "Россия", foreignDecision: "no", details: "Иностранное постоянное проживание" }));
assert.equal(international.outcomeKey, "international-legal-review");
assert.equal(international.filingReady, false);

assert.equal(record(validateAdoption("domestic", { ...common, childAge: "unsure", russianResident: "yes", childStatusConfirmed: "yes", candidateConclusion: "yes" })).outcomeKey, "child-age-unclear");
assert.equal(record(validateAdoption("domestic", { ...common, eligibilityChecked: "unsure", russianResident: "yes", childStatusConfirmed: "yes", candidateConclusion: "yes" })).outcomeKey, "candidate-eligibility-review");
assert.equal(record(validateAdoption("domestic", { ...common, region: "Москва вручную", russianResident: "yes", childStatusConfirmed: "yes", candidateConclusion: "yes" })).outcomeKey, "invalid-region");
assert.equal(record(validateAdoption("international", {})).outcomeKey, "missing-data");
for (const key of ADOPTION_SCENARIO_KEYS) {
  assert.equal(getVisibleAdoptionFields(key, {}).length > 0, true);
  assert.equal(getAdoptionRules(key).length > 0, true);
}

console.log(`Adoption validation passed: ${outcomes.size} reachable outcomes.`);
