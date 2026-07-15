import type { Prisma } from "@prisma/client";

/**
 * Single source of truth for which Q&A content may be exposed publicly and
 * included in indexable surfaces (public lists, question pages, sitemap).
 *
 * These Prisma `where` builders mirror the TypeScript predicates in `seo.ts`
 * (`isIndexableQuestionAnswer`, `canIndexQuestionPage`). The query-level
 * builders filter at the database; the predicates re-check already-loaded data.
 * Keep both in sync — `PUBLIC_ANSWER_MIN_QUALITY_SCORE` is shared by both.
 *
 * Previously these conditions were copy-pasted in `getQuestions`, `getQuestion`,
 * the sitemap builder and `markQuestionIndexability`. If one copy drifted, an
 * answer containing contacts/pressure could leak into a public block or sitemap.
 */

/** Minimum answer quality score required to show an answer publicly. */
export const PUBLIC_ANSWER_MIN_QUALITY_SCORE = 60;

/** Report states that block content from being public until they are resolved. */
const OPEN_REPORT_STATUSES = ["NEW", "IN_REVIEW"] as const;

/** A question is public only when it is published and passed quality moderation. */
export function getPublicQuestionWhere(): Prisma.QuestionWhereInput {
  return {
    status: "PUBLISHED",
    qualityStatus: "APPROVED"
  };
}

/**
 * An answer may be shown publicly only when it is a published, moderated,
 * quality-approved answer without contact/pressure/lead-bait flags, with a
 * sufficient quality score and no open complaints.
 */
export function getPublicAnswerWhere(): Prisma.AnswerWhereInput {
  return {
    status: "PUBLISHED",
    isModerated: true,
    qualityStatus: "APPROVED",
    containsContactAttempt: false,
    containsUnsupportedLegalClaim: false,
    containsFearPressure: false,
    containsGenericLeadBait: false,
    answerQualityScore: { gte: PUBLIC_ANSWER_MIN_QUALITY_SCORE },
    reports: { none: { status: { in: [...OPEN_REPORT_STATUSES] } } }
  };
}

/**
 * A question may appear in indexable listings / the sitemap only when it is
 * public AND has at least one publicly-showable answer.
 */
export function getIndexableQuestionWhere(): Prisma.QuestionWhereInput {
  return {
    ...getPublicQuestionWhere(),
    answers: { some: getPublicAnswerWhere() }
  };
}
