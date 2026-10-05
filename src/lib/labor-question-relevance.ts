import type { Question } from "@/lib/types";
import { normalizeText } from "@/lib/related-questions";

const INTENT_STOP_WORDS = new Set(["работник", "работодатель", "трудовой", "работа", "права", "споры"]);

export function isSafeLaborQuestionForRoute(question: Question, topics: string[], exclusions: string[]) {
  if (!isLaborQuestion(question) || hasContactPii(question)) return false;
  const content = normalizeText(`${question.title} ${question.text} ${question.summary ?? ""}`);
  if (exclusions.some((topic) => phraseMatches(content, topic))) return false;
  return topics.some((topic) => phraseMatches(content, topic));
}

function isLaborQuestion(question: Question) {
  return question.service?.slug === "trudovoe-pravo"
    || question.service?.slug === "trudovye-spory"
    || normalizeText(question.category ?? "") === "трудовое право";
}

function hasContactPii(question: Question) {
  const content = `${question.title} ${question.text} ${question.summary ?? ""}`;
  return /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(content)
    || /(?:\+7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/.test(content);
}

function phraseMatches(content: string, topic: string) {
  const normalizedTopic = normalizeText(topic);
  if (content.includes(normalizedTopic)) return true;
  const significantWords = normalizedTopic.split(" ").filter((word) => word.length >= 5 && !INTENT_STOP_WORDS.has(word));
  const contentWords = content.split(" ").filter((word) => word.length >= 4);
  const matches = significantWords.filter((word) => contentWords.some((candidate) => wordsShareStem(word, candidate))).length;
  return significantWords.length === 1 ? matches === 1 : matches >= 2;
}

function wordsShareStem(left: string, right: string) {
  const length = Math.min(5, left.length - 2, right.length - 2);
  return length >= 4 && left.slice(0, length) === right.slice(0, length);
}
