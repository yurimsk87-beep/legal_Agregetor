import { cache } from "react";
import { getLawyers, getQuestions, getQuestionsMatchingPhrases } from "./repositories";
import { expandPhrases, getRelatedQuestions, type GetRelatedQuestionsOptions, type RelatedQuestionsContext } from "./related-questions";
import { getQuestionCategory } from "./question-display";
import type { Lawyer, Question } from "./types";

type NavigatorRelationIndex = {
  questions: Question[];
  lawyers: Lawyer[];
  questionsByTopic: Map<string, Question[]>;
  lawyersBySpecialization: Map<string, Lawyer[]>;
};

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const NAVIGATOR_LAWYER_POOL_LIMIT = 240;
// Возвращаем в виджеты «похожих юристов» разумное число (не весь пул 240): 240
// полных объектов юристов раздували RSC-payload страниц ситуаций/документов до ~6 МБ.
const RELATED_LAWYERS_DEFAULT_LIMIT = 48;

// Карточка «похожего юриста» (LawyerCard/ExpandableLawyerGrid) использует только
// имя/слаг/фото/город/специализации и скалярные rating/reviewCount. Тяжёлые поля —
// массив reviews[] и блоб profile (в т.ч. profile.reviewsText с полными отзывами) —
// не рендерятся, но раздували RSC-payload до ~6 МБ. Срезаем их из объектов, уходящих
// в клиентские компоненты/JSON-LD.
function stripLawyerReviews(lawyer: Lawyer): Lawyer {
  return { ...lawyer, reviews: [], profile: undefined };
}
const RELATION_STOP_WORDS = new Set([
  "адвокат",
  "адвокаты",
  "дела",
  "дело",
  "и",
  "по",
  "право",
  "спор",
  "спорам",
  "спорах",
  "споры",
  "юрист",
  "юристы"
]);

let cachedBucket: number | null = null;
let cachedIndexPromise: Promise<NavigatorRelationIndex> | null = null;
let hasLoggedNavigatorRelationError = false;

const loadNavigatorRelationIndex = cache(async (_bucket: number) => {
  try {
    const questions = await getQuestions(undefined, undefined, { take: 60 });
    const lawyers = await getLawyers({ take: NAVIGATOR_LAWYER_POOL_LIMIT });

    return {
      questions,
      lawyers,
      questionsByTopic: indexQuestionsByTopic(questions),
      lawyersBySpecialization: indexLawyersBySpecialization(lawyers)
    };
  } catch (error) {
    warnNavigatorRelationErrorOnce(error);
    return {
      questions: [],
      lawyers: [],
      questionsByTopic: new Map<string, Question[]>(),
      lawyersBySpecialization: new Map<string, Lawyer[]>()
    };
  }
});

export async function getNavigatorRelationIndex() {
  const bucket = getCacheBucket();
  if (cachedIndexPromise && cachedBucket === bucket) return cachedIndexPromise;

  cachedBucket = bucket;
  cachedIndexPromise = loadNavigatorRelationIndex(bucket);
  return cachedIndexPromise;
}

// Context-aware related questions for /problems/ and /documents/. Prefer this
// over getRelatedQuestionsByTopics: it scores by primary tags + phrases and
// applies hard exclusions, returning [] (block hidden) when nothing is relevant.
export async function getRelatedQuestionsForContext(context: RelatedQuestionsContext, options?: GetRelatedQuestionsOptions) {
  // Build a candidate pool from the WHOLE question base by matching the page's
  // primary tags / search phrases (with synonyms), then score those. This avoids
  // ranking only an arbitrary recent window of questions.
  const searchTerms = expandPhrases([...(context.searchPhrases ?? []), ...context.primaryTags]);
  const candidates = await getQuestionsMatchingPhrases(searchTerms, 200);
  if (candidates.length) return getRelatedQuestions(context, candidates, options);

  // Fallback: nothing matched (or DB unavailable) — score the shared recent index.
  const index = await getNavigatorRelationIndex();
  return getRelatedQuestions(context, index.questions, options);
}

// Category (section) pages want MAXIMUM variety across the whole theme, not the
// most common subtopic. Pull a broad candidate pool from the whole question base
// matching the category's phrases, then round-robin by subcategory so the block
// spans different sub-themes (e.g. for family: alimony, divorce, property, custody…).
export async function getDiverseCategoryQuestions(phrases: Iterable<string>, limit = 12) {
  const terms = expandPhrases([...phrases]);
  if (!terms.length) return [];

  const candidates = await getQuestionsMatchingPhrases(terms, 500);
  if (!candidates.length) {
    const index = await getNavigatorRelationIndex();
    return index.questions.slice(0, limit);
  }

  const groups = new Map<string, Question[]>();
  for (const question of candidates) {
    const key = getQuestionCategory(question);
    const bucket = groups.get(key);
    if (bucket) bucket.push(question);
    else groups.set(key, [question]);
  }

  const keys = [...groups.keys()];
  const result: Question[] = [];
  let progressed = true;
  while (result.length < limit && progressed) {
    progressed = false;
    for (const key of keys) {
      const bucket = groups.get(key)!;
      if (bucket.length) {
        result.push(bucket.shift()!);
        progressed = true;
        if (result.length >= limit) break;
      }
    }
  }
  return result;
}

export async function getRelatedQuestionsByTopics(topicNames: Iterable<string>, _fallbackTake = 3) {
  const index = await getNavigatorRelationIndex();
  const relatedQuestions = collectUnique(index.questionsByTopic, topicNames, (question) => question.id);
  const relatedByText = collectQuestionsByText(index.questions, topicNames, new Set(relatedQuestions.map((question) => question.id)));
  return [...relatedQuestions, ...relatedByText];
}

export async function getRelatedLawyersBySpecializations(specializationNames: Iterable<string>, limit = RELATED_LAWYERS_DEFAULT_LIMIT) {
  const index = await getNavigatorRelationIndex();
  const requestedSpecializations = [...new Set([...specializationNames].map((item) => item.trim()).filter(Boolean))];
  const safeLimit = Math.max(1, limit);

  if (!requestedSpecializations.length) {
    return rankLawyersByProfileQuality(index.lawyers).slice(0, safeLimit).map(stripLawyerReviews);
  }

  const exactMatches = collectUnique(index.lawyersBySpecialization, requestedSpecializations, (lawyer) => lawyer.id);
  const exactMatchIds = new Set(exactMatches.map((lawyer) => lawyer.id));
  const relationTerms = requestedSpecializations.map(toRelationTerm).filter((term) => term.normalized || term.tokens.length);
  const scoredMatches = index.lawyers
    .filter((lawyer) => !exactMatchIds.has(lawyer.id))
    .map((lawyer) => ({ lawyer, score: scoreLawyerBySpecializations(lawyer, relationTerms) }))
    .filter(({ score }) => score > 0)
    .sort(compareScoredLawyers)
    .map(({ lawyer }) => lawyer);

  const relatedLawyers = [...rankLawyersByProfileQuality(exactMatches), ...scoredMatches];
  const relatedIds = new Set(relatedLawyers.map((lawyer) => lawyer.id));
  const fallbackLawyers = rankLawyersByProfileQuality(index.lawyers.filter((lawyer) => !relatedIds.has(lawyer.id)));

  return [...relatedLawyers, ...fallbackLawyers].slice(0, safeLimit).map(stripLawyerReviews);
}

function indexQuestionsByTopic(questions: Question[]) {
  const index = new Map<string, Question[]>();
  for (const question of questions) {
    const topicNames = [question.service?.name, question.category, ...(question.tags ?? [])].filter((topic): topic is string => Boolean(topic));
    for (const topicName of topicNames) {
      addToIndex(index, topicName, question);
    }
  }
  return index;
}

function indexLawyersBySpecialization(lawyers: Lawyer[]) {
  const index = new Map<string, Lawyer[]>();
  for (const lawyer of lawyers) {
    for (const service of lawyer.services) {
      addToIndex(index, service.name, lawyer);
    }
  }
  return index;
}

function addToIndex<T>(index: Map<string, T[]>, key: string, item: T) {
  const items = index.get(key);
  if (items) {
    items.push(item);
    return;
  }

  index.set(key, [item]);
}

function collectUnique<T>(index: Map<string, T[]>, keys: Iterable<string>, getId: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const key of keys) {
    const items = index.get(key) ?? [];
    for (const item of items) {
      const id = getId(item);
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(item);
    }
  }

  return result;
}

function collectQuestionsByText(questions: Question[], topicNames: Iterable<string>, seen: Set<string>) {
  const topics = [...new Set([...topicNames].map(normalizeRelationText).filter(Boolean))];
  if (!topics.length) return [];

  return questions
    .map((question) => ({ question, score: scoreQuestionByTopics(question, topics) }))
    .filter(({ question, score }) => score > 0 && !seen.has(question.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ question }) => question);
}

type RelationTerm = {
  normalized: string;
  tokens: string[];
};

function toRelationTerm(value: string): RelationTerm {
  const normalized = normalizeRelationText(value);

  return {
    normalized,
    tokens: tokenizeRelationText(normalized)
  };
}

function scoreLawyerBySpecializations(lawyer: Lawyer, terms: RelationTerm[]) {
  if (!terms.length) return 0;

  let score = 0;
  for (const service of lawyer.services) {
    score += scoreTextByRelationTerms([service.name, service.slug, service.shortDescription, service.fullDescription].join(" "), terms) * 3;
  }

  score += scoreTextByRelationTerms(
    [lawyer.description, lawyer.profile?.specializationText ?? "", lawyer.profile?.about ?? ""].join(" "),
    terms
  );

  return score;
}

function scoreTextByRelationTerms(value: string, terms: RelationTerm[]) {
  const normalized = normalizeRelationText(value);
  if (!normalized) return 0;

  const tokens = tokenizeRelationText(normalized);
  return terms.reduce((sum, term) => sum + scoreRelationText(normalized, tokens, term), 0);
}

function scoreRelationText(normalizedText: string, textTokens: string[], term: RelationTerm) {
  if (term.normalized && normalizedText === term.normalized) return 40;
  if (term.normalized && normalizedText.includes(term.normalized)) return 28;

  const matchedTokens = term.tokens.filter((termToken) => textTokens.some((textToken) => areRelatedTokens(termToken, textToken))).length;
  if (!matchedTokens) return 0;

  const completeMatchBonus = matchedTokens === term.tokens.length ? 12 : 0;
  return matchedTokens * 8 + completeMatchBonus;
}

function tokenizeRelationText(value: string) {
  return value
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !RELATION_STOP_WORDS.has(word));
}

function areRelatedTokens(a: string, b: string) {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a))) return true;

  const sharedPrefix = commonPrefixLength(a, b);
  return sharedPrefix >= 5 || (Math.min(a.length, b.length) <= 6 && sharedPrefix >= 4);
}

function commonPrefixLength(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
}

function rankLawyersByProfileQuality(lawyers: Lawyer[]) {
  return [...lawyers].sort(compareLawyersByProfileQuality);
}

function compareScoredLawyers(a: { lawyer: Lawyer; score: number }, b: { lawyer: Lawyer; score: number }) {
  if (b.score !== a.score) return b.score - a.score;
  return compareLawyersByProfileQuality(a.lawyer, b.lawyer);
}

function compareLawyersByProfileQuality(a: Lawyer, b: Lawyer) {
  if (Number(b.isVerified) !== Number(a.isVerified)) return Number(b.isVerified) - Number(a.isVerified);
  if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
  if (b.experienceYears !== a.experienceYears) return b.experienceYears - a.experienceYears;
  return a.id.localeCompare(b.id);
}

function scoreQuestionByTopics(question: Question, topics: string[]) {
  const haystack = normalizeRelationText(
    [
      question.title,
      question.text,
      question.summary ?? "",
      question.service?.name ?? "",
      question.category ?? "",
      ...(question.tags ?? [])
    ].join(" ")
  );

  let score = 0;
  for (const topic of topics) {
    if (topic.length >= 4 && haystack.includes(topic)) {
      score += 4;
      continue;
    }

    const words = topic.split(" ").filter((word) => word.length >= 5);
    if (words.length >= 2 && words.filter((word) => haystack.includes(word)).length >= 2) {
      score += 2;
    }
  }

  return score;
}

function normalizeRelationText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCacheBucket() {
  return Math.floor(Date.now() / getCacheTtlMs());
}

function getCacheTtlMs() {
  const ttl = Number(process.env.NAVIGATOR_RELATIONS_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_CACHE_TTL_MS;
}

function warnNavigatorRelationErrorOnce(error: unknown) {
  if (hasLoggedNavigatorRelationError) return;
  hasLoggedNavigatorRelationError = true;

  if (process.env.NODE_ENV === "production") {
    console.error("[navigator-relations] Unable to load related Q&A/lawyers. Related blocks will use empty fallback.", error);
  }
}
