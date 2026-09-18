import assert from "node:assert/strict";
import { getParentalRightsRestrictionRules } from "@/data/parental-rights-restriction-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_SCENARIO_KEYS } from "@/data/parental-rights-restriction-route";
import { buildParentalRightsRestrictionPdfText } from "@/lib/parental-rights-restriction-pdf";
import { getVisibleParentalRightsRestrictionFields, validateParentalRightsRestriction } from "@/lib/parental-rights-restriction-validator";

const base = { immediateDanger: "no", targetRecordedParent: "yes", childStatus: "minor", applicantRole: "parent", childLeftDangerous: "yes", facts: "Подтверждаемые факты и даты", evidence: "Акты и документы" };
const people = { applicantData: "Иванова Ирина, адрес", respondentData: "Иванов Иван, дата и место рождения, адрес", childData: "Иванов Пётр, 01.01.2018, адрес" };
const court = { courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes", existingSupport: "no", supportDetails: "Алименты ранее не установлены" };
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validateParentalRightsRestriction>) => { outcomes.add(decision.outcomeKey); return decision; };

const objective = record(validateParentalRightsRestriction("objective", { ...base, objectiveReason: "health" }));
assert.equal(objective.resultKind, "checklist");
assert.equal(objective.filingReady, false);
assert.equal(objective.requiresLegalReview, true);
assert.equal(objective.legalPath, "objective");

const behavior = record(validateParentalRightsRestriction("behavior", { ...base, behaviorAssessment: "danger-insufficient" }));
assert.equal(behavior.resultKind, "checklist");
assert.equal(behavior.legalPath, "behavior");
assert.equal(record(validateParentalRightsRestriction("behavior", { ...base, behaviorAssessment: "possible-deprivation" })).outcomeKey, "possible-deprivation");
assert.equal(record(validateParentalRightsRestriction("behavior", { ...base, behaviorAssessment: "conflict" })).outcomeKey, "family-conflict");
assert.equal(record(validateParentalRightsRestriction("behavior", { ...base, behaviorAssessment: "unsure" })).outcomeKey, "behavior-unclear");

const emergency = record(validateParentalRightsRestriction("court", { immediateDanger: "yes" }));
assert.equal(emergency.resultKind, "emergency");
assert.equal(emergency.pdfAvailable, false);
assert.equal(emergency.filingSteps.some((step) => step.includes("112")), true);
assert.equal(record(validateParentalRightsRestriction("objective", { ...base, targetRecordedParent: "no", objectiveReason: "health" })).outcomeKey, "wrong-target");
assert.equal(record(validateParentalRightsRestriction("objective", { ...base, childStatus: "adult", objectiveReason: "health" })).outcomeKey, "child-status-review");
assert.equal(record(validateParentalRightsRestriction("objective", { ...base, applicantRole: "other", objectiveReason: "health" })).outcomeKey, "applicant-standing-review");
assert.equal(record(validateParentalRightsRestriction("objective", { ...base, childLeftDangerous: "no", objectiveReason: "health" })).outcomeKey, "danger-not-confirmed");
assert.equal(record(validateParentalRightsRestriction("objective", { ...base, childLeftDangerous: "unsure", objectiveReason: "health" })).outcomeKey, "danger-unclear");
assert.equal(record(validateParentalRightsRestriction("court", { ...base, dangerSource: "unclear" })).outcomeKey, "danger-source-unclear");

const objectiveCourt = record(validateParentalRightsRestriction("court", { ...base, dangerSource: "objective", objectiveReason: "hardship", ...people, ...court }));
assert.equal(objectiveCourt.resultKind, "courtDraft");
assert.equal(objectiveCourt.filingReady, false);
assert.equal(objectiveCourt.requiresLegalReview, true);
assert.match(objectiveCourt.draftText, /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
assert.match(buildParentalRightsRestrictionPdfText(objectiveCourt), /Готово к подаче: нет/);

const behaviorCourt = record(validateParentalRightsRestriction("court", { ...base, dangerSource: "behavior", behaviorAssessment: "danger-insufficient", ...people, ...court }));
assert.equal(behaviorCourt.resultKind, "courtDraft");
assert.match(behaviorCourt.documentTitle, /опасным поведением/);
const unconfirmedCourt = record(validateParentalRightsRestriction("court", { ...base, dangerSource: "objective", objectiveReason: "health", ...people, ...court, courtSource: "https://example.com/court" }));
assert.equal(unconfirmedCourt.allowed, false);
assert.equal(unconfirmedCourt.draftText, "");

const missing = validateParentalRightsRestriction("court", {});
assert.equal(missing.allowed, false);
assert.equal(missing.draftText, "");
assert.equal(getParentalRightsRestrictionRules("court", "court").some((rule) => rule.id === "sk-73-grounds"), true);
for (const key of PARENTAL_RIGHTS_RESTRICTION_SCENARIO_KEYS) assert.equal(getVisibleParentalRightsRestrictionFields(key, {}).length > 0, true);

console.log(`Parental-rights restriction validation passed: ${outcomes.size} reachable outcomes.`);
