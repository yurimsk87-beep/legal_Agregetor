import assert from "node:assert/strict";
import { getPaternityEstablishmentRules } from "@/data/paternity-establishment-legal-review";
import { PATERNITY_ESTABLISHMENT_SCENARIO_KEYS } from "@/data/paternity-establishment-route";
import { buildPaternityEstablishmentPdfText } from "@/lib/paternity-establishment-pdf";
import { getVisiblePaternityEstablishmentFields, validatePaternityEstablishment } from "@/lib/paternity-establishment-validator";

const people = { motherData: "Иванова Ирина, данные", fatherData: "Иванов Иван, данные", childData: "Иванов Пётр, запись о рождении", childNameAfter: "Иванов Пётр Иванович" };
const court = { applicantData: "Иванова Ирина, адрес", respondentData: "Иванов Иван, адрес", evidence: "Переписка и иные законно полученные доказательства", courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" };
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validatePaternityEstablishment>) => { outcomes.add(decision.outcomeKey); return decision; };

const joint = record(validatePaternityEstablishment("voluntary", { existingFatherRecord: "no", childAge: "minor", voluntaryBasis: "joint", attendance: "both", ...people }));
assert.equal(joint.resultKind, "dataSheet");
assert.match(joint.documentTitle, /№ 15/);
assert.equal(joint.filingReady, false);
assert.equal(joint.requiresLegalReview, true);
assert.match(buildPaternityEstablishmentPdfText(joint), /Готово к подаче: нет/);

assert.match(record(validatePaternityEstablishment("voluntary", { existingFatherRecord: "no", childAge: "minor", voluntaryBasis: "joint", attendance: "father-absent", ...people })).documentTitle, /№ 15 и № 16/);
assert.match(record(validatePaternityEstablishment("voluntary", { existingFatherRecord: "no", childAge: "minor", voluntaryBasis: "joint", attendance: "mother-absent", ...people })).documentTitle, /№ 15 и № 17/);
assert.match(record(validatePaternityEstablishment("voluntary", { existingFatherRecord: "no", childAge: "minor", voluntaryBasis: "father-only", motherCircumstance: "deceased", guardianshipConsent: "yes", ...people })).documentTitle, /№ 19/);
assert.equal(record(validatePaternityEstablishment("voluntary", { existingFatherRecord: "no", childAge: "minor", voluntaryBasis: "father-only", motherCircumstance: "other" })).outcomeKey, "father-only-wrong-basis");
assert.equal(record(validatePaternityEstablishment("voluntary", { existingFatherRecord: "no", childAge: "minor", voluntaryBasis: "father-only", motherCircumstance: "deceased", guardianshipConsent: "no" })).outcomeKey, "guardianship-no-consent");

const judicial = record(validatePaternityEstablishment("court", { existingFatherRecord: "no", childAge: "minor", applicantRole: "parent", ...people, ...court }));
assert.equal(judicial.resultKind, "courtDraft");
assert.match(judicial.draftText, /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
assert.equal(judicial.filingReady, false);
assert.equal(judicial.requiresLegalReview, true);
assert.equal(record(validatePaternityEstablishment("court", { existingFatherRecord: "yes", childAge: "minor", applicantRole: "parent" })).outcomeKey, "existing-father-record");
assert.equal(record(validatePaternityEstablishment("court", { existingFatherRecord: "no", childAge: "adult", adultConsent: "no", applicantRole: "adult-child" })).outcomeKey, "adult-no-consent");
assert.equal(record(validatePaternityEstablishment("court", { existingFatherRecord: "no", childAge: "minor", applicantRole: "other" })).outcomeKey, "applicant-standing-review");

const deceased = record(validatePaternityEstablishment("deceased", { existingFatherRecord: "no", childAge: "minor", deceasedAcknowledged: "yes", rightDispute: "no", legalPurpose: "Регистрация происхождения", birthDate: "01.01.2020", childData: "Ребёнок", deceasedData: "Умерший", ...court }));
assert.equal(deceased.resultKind, "courtDraft");
assert.match(deceased.documentTitle, /признания отцовства/);
assert.equal(record(validatePaternityEstablishment("deceased", { existingFatherRecord: "no", childAge: "minor", deceasedAcknowledged: "yes", rightDispute: "yes" })).outcomeKey, "deceased-right-dispute");
assert.equal(record(validatePaternityEstablishment("deceased", { existingFatherRecord: "no", childAge: "minor", deceasedAcknowledged: "unsure", rightDispute: "no" })).outcomeKey, "deceased-path-unclear");

const existing = record(validatePaternityEstablishment("existing-record", { existingFatherRecord: "yes", recordBasis: "marriage", recordedFatherData: "Записанный отец", expectedFatherData: "Предполагаемый отец" }));
assert.equal(existing.resultKind, "legalReviewOnly");
assert.equal(existing.filingReady, false);
const combined = record(validatePaternityEstablishment("combined", { existingFatherRecord: "no", childAge: "minor", combinedIssue: "support", additionalDetails: "Взыскать алименты", ...people, ...court }));
assert.match(combined.documentTitle, /алиментов/);
assert.equal(combined.resultKind, "courtDraft");
assert.equal(record(validatePaternityEstablishment("combined", { existingFatherRecord: "no", childAge: "minor", combinedIssue: "other" })).outcomeKey, "combined-other-review");

const badCourt = record(validatePaternityEstablishment("court", { existingFatherRecord: "no", childAge: "minor", applicantRole: "parent", ...people, ...court, courtSource: "https://example.com" }));
assert.equal(badCourt.allowed, false);
assert.equal(badCourt.draftText, "");
assert.equal(getPaternityEstablishmentRules("court", "court").some((rule) => rule.id === "sk-49-court"), true);
for (const key of PATERNITY_ESTABLISHMENT_SCENARIO_KEYS) assert.equal(getVisiblePaternityEstablishmentFields(key, {}).length > 0, true);

console.log(`Paternity-establishment validation passed: ${outcomes.size} reachable outcomes.`);
