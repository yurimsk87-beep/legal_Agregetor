import assert from "node:assert/strict";
import {
  PUBLIC_ANSWER_MIN_QUALITY_SCORE,
  getIndexableQuestionWhere,
  getPublicAnswerWhere,
  getPublicQuestionWhere
} from "./qna-publication-rules";
import { canIndexQuestionPage, isIndexableQuestionAnswer } from "./seo";

// --- getPublicAnswerWhere encodes the critical safety gates ---
const answerWhere = getPublicAnswerWhere();
assert.equal(answerWhere.containsContactAttempt, false, "Public answers must exclude contact attempts.");
assert.equal(answerWhere.containsFearPressure, false, "Public answers must exclude fear/pressure.");
assert.equal(answerWhere.containsUnsupportedLegalClaim, false, "Public answers must exclude unsupported legal claims.");
assert.equal(answerWhere.containsGenericLeadBait, false, "Public answers must exclude generic lead bait.");
assert.deepEqual(
  answerWhere.answerQualityScore,
  { gte: PUBLIC_ANSWER_MIN_QUALITY_SCORE },
  "Public answers must meet the minimum quality score."
);
assert.equal(PUBLIC_ANSWER_MIN_QUALITY_SCORE, 60, "Minimum public answer quality score is 60.");

// --- getPublicQuestionWhere requires published + approved ---
const questionWhere = getPublicQuestionWhere();
assert.equal(questionWhere.status, "PUBLISHED");
assert.equal(questionWhere.qualityStatus, "APPROVED");

// --- getIndexableQuestionWhere requires at least one publicly-showable answer ---
const indexableWhere = getIndexableQuestionWhere();
const indexableAnswers = indexableWhere.answers as { some?: unknown } | undefined;
assert.ok(indexableAnswers && "some" in indexableAnswers, "Indexable questions must require at least one matching answer.");

// --- canIndexQuestionPage / isIndexableQuestionAnswer behaviour ---
type AnswerInput = Parameters<typeof isIndexableQuestionAnswer>[0];
type QuestionInput = NonNullable<Parameters<typeof canIndexQuestionPage>[0]>;

function buildAnswer(overrides: Partial<AnswerInput> = {}): AnswerInput {
  return {
    status: "PUBLISHED",
    answerStatus: "PUBLISHED",
    isModerated: true,
    qualityStatus: "APPROVED",
    moderationStatus: "APPROVED",
    containsContactAttempt: false,
    containsUnsupportedLegalClaim: false,
    containsFearPressure: false,
    containsGenericLeadBait: false,
    answerQualityScore: 80,
    text: "Согласно процессуальному законодательству должник вправе подать возражение в установленный срок, после чего приказ подлежит отмене.",
    ...overrides
  };
}

function buildQuestion(answerOverrides: Partial<AnswerInput> = {}): QuestionInput {
  return {
    isIndexable: true,
    status: "PUBLISHED",
    qualityStatus: "APPROVED",
    isDuplicate: false,
    hasOpenReports: false,
    trustScore: 85,
    title: "Как оспорить судебный приказ в установленный срок",
    text: "Подробное описание ситуации с достаточным объёмом текста для индексации, более ста двадцати символов в сумме, без каких-либо контактных данных.",
    serviceId: "svc-1",
    answers: [buildAnswer(answerOverrides)]
  };
}

assert.equal(canIndexQuestionPage(buildQuestion()), true, "A quality lawyer answer should make the question indexable.");
assert.equal(
  canIndexQuestionPage(buildQuestion({ containsContactAttempt: true })),
  false,
  "A contact attempt in the only answer must block indexing."
);
assert.equal(
  canIndexQuestionPage(buildQuestion({ answerQualityScore: 40 })),
  false,
  "A low answer quality score must block indexing."
);
assert.equal(isIndexableQuestionAnswer(buildAnswer()), true, "A clean quality answer is publicly indexable.");
assert.equal(
  isIndexableQuestionAnswer(buildAnswer({ containsFearPressure: true })),
  false,
  "An answer with fear/pressure is not publicly indexable."
);

console.log("qna-publication-rules.test.ts passed");
