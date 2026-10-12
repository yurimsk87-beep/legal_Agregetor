import { isLaborAdditiveRouteSlug, type LaborAdditiveRouteSlug } from "@/data/labor-additive-routes";
import { normalizeText } from "@/lib/related-questions";
import type { Question } from "@/lib/types";

const COMMON_EXCLUSIONS = [
  /дтп|авари[яи].*автомобил|страховк.*осаг|кредит|банкрот|наследств|алименты|отцовств|развод|жкх|потребител/i,
  /уголовн|наркотик|военнослужащ|участник.*сво/i
];

const PII_PATTERNS = [
  /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
  /(?:\+7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/,
  /\bпаспорт\D{0,24}\d{4}[\s-]*\d{6}\b/i,
  /\b\d{3}-\d{3}-\d{3}[\s-]\d{2}\b/
];

const ROUTE_SIGNALS: Record<LaborAdditiveRouteSlug, RegExp[]> = {
  "beremennost-i-trudovye-garantii": [
    /беремен.*(?:работ|работодат|увол|договор|испыт|смен|график|отпуск|декрет)/i,
    /(?:работ|работодат|увол|договор|испыт|смен|график).*(?:беремен|декрет)/i,
    /отпуск.*беременност.*род/i
  ],
  "ohrana-truda-i-neschastnyy-sluchay": [
    /охран.*труд|производствен.*травм|несчастн.*случа.*(?:работ|производств)/i,
    /(?:работ|производств).*(?:травм|опасн|сиз|инструктаж)/i,
    /акт.*н-?1|профзаболеван/i
  ],
  "priem-na-rabotu-i-otkaz": [
    /(?:отказ|отказал).*(?:прием|принят|ваканси|трудоустрой|работ)/i,
    /(?:прием|принят|ваканси|трудоустрой|собеседован).*(?:работодат|отказ|документ)/i,
    /фактическ.*допуск.*работ|начал.*работ.*без.*договор/i
  ],
  "trudovye-dokumenty-i-spravki": [
    /работодат.*(?:не выда|отказ.*выдат).*(?:документ|справк|копи|трудов.*книж|сведен.*трудов)/i,
    /(?:трудов.*договор|трудов.*книж|стд-р|справк.*работ|приказ).*(?:копи|выдат|получ|исправ)/i,
    /документ.*при.*увольнен/i
  ],
  "diskriminatsiya-na-rabote": [
    /дискриминац.*(?:работодат|работник|трудов|зарплат|оплат.*труд|ваканси|прием.*работ|увол)/i,
    /(?:работодат|работник|трудов|зарплат|оплат.*труд|ваканси|прием.*работ|увол).*дискриминац/i,
    /(?:не взял|не принят|платят меньше|разн.*зарплат).*(?:возраст|пол|национальн|семейн|инвалид|религи)/i
  ]
};

const ROUTE_CONFLICTS: Record<LaborAdditiveRouteSlug, RegExp[]> = {
  "beremennost-i-trudovye-garantii": [/внематочн|медицинск.*организац|военнослужащ|военн.*служб/i, /пособи.*беременност.{0,160}(?:не работаю|сфр|пенсионн.*фонд)/i, /отпуск.*уход.*ребен/i],
  "ohrana-truda-i-neschastnyy-sluchay": [/боев.*травм|военн.*травм|дтп.*(?:личн|собственн).*автомобил/i],
  "priem-na-rabotu-i-otkaz": [/сокращен|увольнен|отказ.*от.*предложенн.*ваканс/i, /неофициальн.*работ|без.*трудов.*договор|трудов.*договор.{0,50}не.*оформ/i],
  "trudovye-dokumenty-i-spravki": [/пенси|налогов.*вычет|алименты|развод/i, /окончательн.*расчет|невыплат.*(?:зарплат|расчет)|утерян.*трудов.*книж|трудов.*книж.{0,40}утерян/i],
  "diskriminatsiya-na-rabote": [/потребител|банк|кредит|исполнительн.*производств|военн.*служб/i]
};

const STOP_WORDS = new Set(["работа", "работник", "работодатель", "трудовой", "право", "заявление", "жалоба"]);

export function isSafeAdditiveLaborQuestionForRoute(
  question: Question,
  routeSlug: string,
  topics: string[],
  exclusions: string[]
) {
  if (!isLaborAdditiveRouteSlug(routeSlug)) return false;

  const content = normalizeText([
    question.title,
    question.enrichedTitle ?? "",
    question.text,
    question.rawText ?? "",
    question.enrichedText ?? "",
    question.summary ?? "",
    ...(question.facts ?? []),
    ...(question.tags ?? [])
  ].join(" "));

  if (!content || PII_PATTERNS.some((pattern) => pattern.test(content)) || COMMON_EXCLUSIONS.some((pattern) => pattern.test(content))) return false;
  if (ROUTE_CONFLICTS[routeSlug].some((pattern) => pattern.test(content))) return false;
  if (exclusions.some((topic) => content.includes(normalizeText(topic)))) return false;
  if (!ROUTE_SIGNALS[routeSlug].some((pattern) => pattern.test(content))) return false;

  return topics.length === 0 || topics.some((topic) => phraseMatches(content, topic));
}

function phraseMatches(content: string, topic: string) {
  const normalizedTopic = normalizeText(topic);
  if (normalizedTopic.length >= 5 && content.includes(normalizedTopic)) return true;

  const words = normalizedTopic
    .split(" ")
    .filter((word) => word.length >= 5 && !STOP_WORDS.has(word));
  if (!words.length) return false;

  const contentWords = content.split(" ").filter((word) => word.length >= 4);
  const matches = words.filter((word) => contentWords.some((candidate) => wordsShareStem(word, candidate))).length;
  return words.length === 1 ? matches === 1 : matches >= 2;
}

function wordsShareStem(left: string, right: string) {
  const length = Math.min(6, left.length - 2, right.length - 2);
  return length >= 4 && left.slice(0, length) === right.slice(0, length);
}
