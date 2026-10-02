import assert from "node:assert/strict";
import { getParentalRightsDeprivationRules } from "@/data/parental-rights-deprivation-legal-review";
import { PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_KEYS } from "@/data/parental-rights-deprivation-route";
import { buildParentalRightsDeprivationPdfText } from "@/lib/parental-rights-deprivation-pdf";
import { getVisibleParentalRightsDeprivationFields, validateParentalRightsDeprivation } from "@/lib/parental-rights-deprivation-validator";

const base = { immediateDanger: "no", targetRecordedParent: "yes", childStatus: "minor", applicantRole: "parent", ground: "cruelty", facts: "Подтверждаемые факты и даты", evidence: "Акты и документы" };
const people = { applicantData: "Иванова Ирина, адрес", respondentData: "Иванов Иван, дата и место рождения, адрес", childData: "Иванов Пётр, 01.01.2018, адрес" };
const court = { courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" };
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validateParentalRightsDeprivation>) => { outcomes.add(decision.outcomeKey); return decision; };

const grounds = record(validateParentalRightsDeprivation("grounds", base));
assert.equal(grounds.resultKind, "checklist");
assert.equal(grounds.filingReady, false);
assert.equal(grounds.requiresLegalReview, true);

const conflict = record(validateParentalRightsDeprivation("grounds", { ...base, ground: "conflict" }));
assert.equal(conflict.outcomeKey, "family-conflict-not-ground");
assert.equal(conflict.allowed, false);
const objective = record(validateParentalRightsDeprivation("grounds", { ...base, ground: "objective" }));
assert.equal(objective.outcomeKey, "restriction-route");
const unclear = record(validateParentalRightsDeprivation("grounds", { ...base, ground: "unclear" }));
assert.equal(unclear.resultKind, "checklist");

const emergency = record(validateParentalRightsDeprivation("court", { immediateDanger: "yes", targetRecordedParent: "yes", childStatus: "minor", applicantRole: "parent", ground: "cruelty", facts: "Угроза" }));
assert.equal(emergency.resultKind, "emergency");
assert.equal(emergency.pdfAvailable, false);
assert.equal(emergency.filingSteps.some((step) => step.includes("112")), true);

assert.equal(record(validateParentalRightsDeprivation("court", { ...base, targetRecordedParent: "no" })).outcomeKey, "wrong-target");
assert.equal(record(validateParentalRightsDeprivation("court", { ...base, applicantRole: "other" })).outcomeKey, "applicant-standing-review");
assert.equal(record(validateParentalRightsDeprivation("court", { ...base, childStatus: "fully-capable" })).outcomeKey, "capacity-status-review");

const courtDraft = record(validateParentalRightsDeprivation("court", { ...base, ...people, ...court }));
assert.equal(courtDraft.resultKind, "courtDraft");
assert.equal(courtDraft.filingReady, false);
assert.equal(courtDraft.requiresLegalReview, true);
assert.match(courtDraft.draftText, /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
assert.match(buildParentalRightsDeprivationPdfText(courtDraft), /Готово к подаче: нет/);

const unconfirmedCourt = record(validateParentalRightsDeprivation("court", { ...base, ...people, ...court, courtSource: "https://example.com/court" }));
assert.equal(unconfirmedCourt.allowed, false);
assert.equal(unconfirmedCourt.draftText, "");

const existing = record(validateParentalRightsDeprivation("existing", { ...base, existingDecisionKind: "restriction", decisionInForce: "yes", existingDecisionDetails: "Решение суда", ...people, ...court }));
assert.equal(existing.resultKind, "courtDraft");
assert.equal(existing.legalPath, "existing");

const support = record(validateParentalRightsDeprivation("support", { ...base, existingSupport: "yes", supportDetails: "Судебный приказ", supportRecipient: "Другой родитель", ...people, ...court }));
assert.equal(support.legalPath, "support");
assert.match(support.draftText, /Сведения об алиментах/);

const adultSpecial = record(validateParentalRightsDeprivation("court", { immediateDanger: "no", targetRecordedParent: "yes", childStatus: "adult", applicantRole: "adult-victim", ground: "intentional-crime", crimeBefore18: "yes", crimeConfirmed: "yes", facts: "Преступление до совершеннолетия", evidence: "Вступивший в силу приговор", ...people, ...court }));
assert.equal(adultSpecial.legalPath, "adult-special");
assert.equal(adultSpecial.resultKind, "courtDraft");
assert.equal(getParentalRightsDeprivationRules("court", "adult-special").some((rule) => rule.id === "ks-49-2026"), true);
const adultOther = record(validateParentalRightsDeprivation("court", { ...base, childStatus: "adult" }));
assert.equal(adultOther.outcomeKey, "adult-general-path-unavailable");

const missing = validateParentalRightsDeprivation("court", {});
assert.equal(missing.allowed, false);
assert.equal(missing.draftText, "");
for (const key of PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_KEYS) assert.equal(getVisibleParentalRightsDeprivationFields(key, {}).length > 0, true);

console.log(`Parental-rights deprivation validation passed: ${outcomes.size} reachable outcomes.`);
