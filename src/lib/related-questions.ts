import type { Question } from "./types";

// Context-aware "Похожие вопросы" scorer for /problems/ and /documents/.
//
// Goal: stop filling the block with broad-category questions. A question only
// surfaces when it matches the page by primary tags / search phrases (with
// synonym expansion) and is NOT killed by an exclusion. Weak/category-only
// matches fall below the threshold, and if fewer than MIN_RESULTS survive the
// block is hidden (callers render nothing on an empty array).

export type RelatedQuestionsContextType = "problem" | "document";

export type RelatedQuestionsContext = {
  contextType: RelatedQuestionsContextType;
  /** Free-text category name as stored on questions (e.g. "Семья и дети"). */
  categoryName?: string;
  /** Strong signals — usually the page's relatedQuestionTopics / userQueries. */
  primaryTags: string[];
  /** Weak signals — broader words that only help alongside a primary match. */
  secondaryTags?: string[];
  /** Phrases whose presence hard-excludes a question from this page. */
  excludedTopics?: string[];
  /** Extra search phrases; defaults to primaryTags when omitted. */
  searchPhrases?: string[];
  /** Manual overrides (rarely needed — scoring is the main mechanism). */
  pinnedQuestionIds?: string[];
  excludeQuestionIds?: string[];
};

export type RelatedQuestionScore = {
  questionId: string;
  score: number;
  reasons: string[];
};

export type GetRelatedQuestionsOptions = {
  limit?: number;
  minScore?: number;
  debug?: boolean;
};

// --- tuning ------------------------------------------------------------------

const PRIMARY_TAG_SCORE = 40;
const SECONDARY_TAG_SCORE = 8;
const CATEGORY_SCORE = 10;
const HAS_ANSWER_BONUS = 5;
const FRESH_BONUS = 3;
const EXCLUDED_PENALTY = 200;

const MIN_PROBLEM_SCORE = 35;
const MIN_DOCUMENT_SCORE = 40;
const MIN_RESULTS = 2;
const MAX_RESULTS = 6;
const FRESH_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

// --- synonyms ----------------------------------------------------------------
// Bidirectional groups: matching any member of a group expands a context phrase
// to the whole group, so "долг по алиментам" also matches a question phrased as
// "бывший муж не платит алименты".

const SYNONYM_GROUPS: string[][] = [
  ["алименты", "деньги на ребенка", "содержание ребенка", "выплаты на ребенка"],
  [
    "долг по алиментам",
    "задолженность по алиментам",
    "алименты не платит",
    "не платит алименты",
    "бывший муж не платит алименты",
    "отец не платит алименты"
  ],
  ["неустойка по алиментам", "неустойка"],
  ["пристав", "приставы", "фссп", "исполнительное производство"],
  ["порядок общения", "график общения", "видеться с ребенком", "встречи с ребенком", "не дает общаться с ребенком", "не дает видеться с ребенком"],
  ["место жительства ребенка", "с кем будет жить ребенок", "оставить ребенка с матерью", "оставить ребенка с отцом", "ребенка забрали", "мать не отдает ребенка"],
  ["раздел имущества", "совместно нажитое", "поделить квартиру", "раздел квартиры", "раздел ипотеки", "делится ли квартира"],
  ["лишение родительских прав", "лишить прав", "лишить родительских прав", "родитель опасен для ребенка"],
  ["развод", "расторжение брака", "развестись"],
  ["судебный приказ", "приказ о взыскании"],
  ["госпошлина", "пошлина за подачу"],
  ["оставили без движения", "вернули заявление", "вернули иск", "иск без движения"]
];

// --- normalization -----------------------------------------------------------

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandPhrase(phrase: string): string[] {
  const norm = normalizeText(phrase);
  if (!norm) return [];
  const variants = new Set<string>([norm]);
  // Expand only when the phrase is exactly a known synonym-group member. Loose
  // substring matching would pull the broad "алименты" into every alimony phrase
  // and collapse distinct phrases together, destroying ranking precision.
  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map(normalizeText);
    if (normalizedGroup.includes(norm)) {
      for (const member of normalizedGroup) variants.add(member);
    }
  }
  return [...variants];
}

/**
 * Expand phrases with their synonym groups, for building a DB candidate query.
 * Returns normalized, deduped terms long enough to be useful in an ILIKE search.
 */
export function expandPhrases(phrases: string[]): string[] {
  const out = new Set<string>();
  for (const phrase of phrases) {
    for (const variant of expandPhrase(phrase)) {
      if (variant.length >= 4) out.add(variant);
    }
  }
  return [...out];
}

function phrasePresent(phrase: string, haystack: string): boolean {
  for (const variant of expandPhrase(phrase)) {
    if (variant.length >= 4 && haystack.includes(variant)) return true;
    const words = variant.split(" ").filter((word) => word.length >= 5);
    if (words.length >= 2 && words.filter((word) => haystack.includes(word)).length >= 2) return true;
  }
  return false;
}

function countPhraseMatches(phrases: string[], haystack: string): number {
  let count = 0;
  for (const phrase of phrases) {
    if (phrasePresent(phrase, haystack)) count += 1;
  }
  return count;
}

function buildHaystack(question: Question): string {
  return normalizeText(
    [question.title, question.text, question.summary ?? "", question.category ?? "", ...(question.tags ?? [])].join(" ")
  );
}

function isPublished(question: Question): boolean {
  // Static dev fallback questions may omit status; DB layer already filters to
  // public, so treat "no status" as publishable.
  return !question.status || question.status === "PUBLISHED";
}

function isFresh(createdAt?: string): boolean {
  if (!createdAt) return false;
  const ts = Date.parse(createdAt);
  return Number.isFinite(ts) && Date.now() - ts <= FRESH_WINDOW_MS;
}

// --- scoring -----------------------------------------------------------------

export function scoreQuestion(question: Question, context: RelatedQuestionsContext): RelatedQuestionScore {
  const reasons: string[] = [];

  if (!isPublished(question)) {
    return { questionId: question.id, score: -999, reasons: ["not_published"] };
  }

  const haystack = buildHaystack(question);
  let score = 0;

  // Hard exclusions first — these should keep a question out even if it matches
  // the category or a primary tag.
  const excludedMatches = countPhraseMatches(context.excludedTopics ?? [], haystack);
  if (excludedMatches > 0) {
    score -= excludedMatches * EXCLUDED_PENALTY;
    reasons.push(`excluded_topic_matches:${excludedMatches}`);
  }

  const searchPhrases = context.searchPhrases?.length ? context.searchPhrases : context.primaryTags;
  const primaryMatches = countPhraseMatches([...new Set([...context.primaryTags, ...searchPhrases])], haystack);
  if (primaryMatches > 0) {
    score += primaryMatches * PRIMARY_TAG_SCORE;
    reasons.push(`primary_matches:${primaryMatches}`);
  }

  const secondaryMatches = countPhraseMatches(context.secondaryTags ?? [], haystack);
  if (secondaryMatches > 0) {
    score += secondaryMatches * SECONDARY_TAG_SCORE;
    reasons.push(`secondary_matches:${secondaryMatches}`);
  }

  if (context.categoryName && question.category && normalizeText(question.category).includes(normalizeText(context.categoryName))) {
    score += CATEGORY_SCORE;
    reasons.push("category_match");
  }

  if ((question.answersCount ?? question.answers?.length ?? 0) > 0) {
    score += HAS_ANSWER_BONUS;
    reasons.push("has_answer");
  }

  if (isFresh(question.createdAt)) {
    score += FRESH_BONUS;
    reasons.push("fresh");
  }

  return { questionId: question.id, score, reasons };
}

function minScoreFor(context: RelatedQuestionsContext): number {
  return context.contextType === "document" ? MIN_DOCUMENT_SCORE : MIN_PROBLEM_SCORE;
}

/**
 * Score, filter, sort and trim questions for a page context.
 * Returns [] (block hidden) when fewer than MIN_RESULTS clear the threshold,
 * unless pinned questions force the block open.
 */
export function getRelatedQuestions(
  context: RelatedQuestionsContext,
  questions: Question[],
  options: GetRelatedQuestionsOptions = {}
): Question[] {
  const limit = options.limit ?? MAX_RESULTS;
  const minScore = options.minScore ?? minScoreFor(context);
  const excludeIds = new Set(context.excludeQuestionIds ?? []);
  const byId = new Map(questions.map((question) => [question.id, question]));

  const scored = questions
    .filter((question) => !excludeIds.has(question.id))
    .map((question) => ({ question, ...scoreQuestion(question, context) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score);

  if (options.debug && process.env.NODE_ENV !== "production") {
    console.log(
      `[related-questions:${context.contextType}]`,
      scored.slice(0, limit).map((entry) => ({ id: entry.questionId, title: byId.get(entry.questionId)?.title, score: entry.score, reasons: entry.reasons }))
    );
  }

  // Pinned overrides: published, not excluded, not hard-excluded by score.
  const pinned: Question[] = [];
  for (const id of context.pinnedQuestionIds ?? []) {
    const question = byId.get(id);
    if (!question || excludeIds.has(id) || !isPublished(question)) continue;
    if (scoreQuestion(question, context).score <= -EXCLUDED_PENALTY) continue;
    pinned.push(question);
  }

  const ranked = scored.map((entry) => entry.question);
  const merged: Question[] = [];
  const seen = new Set<string>();
  for (const question of [...pinned, ...ranked]) {
    if (seen.has(question.id)) continue;
    seen.add(question.id);
    merged.push(question);
  }

  if (pinned.length === 0 && merged.length < MIN_RESULTS) return [];

  return merged.slice(0, limit);
}

export const RELATED_QUESTIONS_TUNING = {
  PRIMARY_TAG_SCORE,
  SECONDARY_TAG_SCORE,
  CATEGORY_SCORE,
  EXCLUDED_PENALTY,
  MIN_PROBLEM_SCORE,
  MIN_DOCUMENT_SCORE,
  MIN_RESULTS,
  MAX_RESULTS
};
