import assert from "node:assert/strict";
import { getPaternityContestRules } from "@/data/paternity-contest-legal-review";
import { PATERNITY_CONTEST_SCENARIO_KEYS } from "@/data/paternity-contest-route";
import { buildPaternityContestPdfText } from "@/lib/paternity-contest-pdf";
import { getVisiblePaternityContestFields, validatePaternityContest } from "@/lib/paternity-contest-validator";

const common = { recordTarget: "father", recordBasis: "marriage", applicantData: "Иванов Иван, адрес", recordedParentData: "Иванов Иван, данные", childData: "Иванов Пётр, запись о рождении", otherParticipants: "Иванова Ирина, адрес", circumstances: "Обстоятельства записи и требования", evidence: "Документы и иные законно полученные доказательства", dnaExpectation: "yes", courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" };
const outcomes = new Set<string>();
const record = (decision: ReturnType<typeof validatePaternityContest>) => { outcomes.add(decision.outcomeKey); return decision; };

const recorded = record(validatePaternityContest("recorded-parent", { ...common }));
assert.equal(recorded.resultKind, "courtDraft");
assert.equal(recorded.filingReady, false);
assert.equal(recorded.requiresLegalReview, true);
assert.match(recorded.draftText, /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
assert.match(buildPaternityContestPdfText(recorded), /Готово к подаче: нет/);

const coercion = record(validatePaternityContest("recorded-parent", { ...common, recordBasis: "application", knewAtRegistration: "yes", willDefect: "threat" }));
assert.equal(coercion.resultKind, "courtDraft");
assert.equal(record(validatePaternityContest("recorded-parent", { ...common, recordBasis: "application", knewAtRegistration: "yes", willDefect: "none" })).outcomeKey, "known-non-parent-restriction");
assert.equal(record(validatePaternityContest("recorded-parent", { ...common, recordBasis: "application", knewAtRegistration: "unsure" })).outcomeKey, "knowledge-unclear");

const biological = record(validatePaternityContest("biological-parent", common));
assert.match(biological.documentTitle, /биологического родителя/);
const adultChild = record(validatePaternityContest("child-representative", { ...common, applicantRole: "adult-child" }));
assert.equal(adultChild.resultKind, "courtDraft");
assert.equal(record(validatePaternityContest("child-representative", { ...common, applicantRole: "other" })).outcomeKey, "applicant-standing-review");
const deceased = record(validatePaternityContest("after-death", { ...common, applicantRole: "biological-parent", deathData: "Смерть подтверждена" }));
assert.match(deceased.documentTitle, /после смерти/);
assert.equal(record(validatePaternityContest("after-death", { ...common, applicantRole: "heir-only", deathData: "Смерть подтверждена" })).outcomeKey, "deceased-standing-review");

assert.equal(record(validatePaternityContest("biological-parent", { ...common, recordBasis: "art" })).outcomeKey, "special-reproduction-restriction");
assert.equal(record(validatePaternityContest("biological-parent", { ...common, recordBasis: "unknown" })).outcomeKey, "record-basis-unclear");
assert.equal(record(validatePaternityContest("biological-parent", { ...common, recordBasis: "court" })).outcomeKey, "court-record-review");
assert.equal(record(validatePaternityContest("biological-parent", { ...common, recordTarget: "unsure" })).outcomeKey, "record-target-unclear");
assert.equal(record(validatePaternityContest("biological-parent", { ...common, dnaExpectation: "unsure" })).outcomeKey, "evidence-expectation-unclear");
const badCourt = record(validatePaternityContest("biological-parent", { ...common, courtSource: "https://example.com" }));
assert.equal(badCourt.allowed, false);
assert.equal(badCourt.draftText, "");
assert.equal(getPaternityContestRules("recorded-parent", "court").some((rule) => rule.id === "sk-52-standing"), true);
for (const key of PATERNITY_CONTEST_SCENARIO_KEYS) assert.equal(getVisiblePaternityContestFields(key, {}).length > 0, true);

console.log(`Paternity-contest validation passed: ${outcomes.size} reachable outcomes.`);
