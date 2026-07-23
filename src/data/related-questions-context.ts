import type { RelatedQuestionsContext } from "@/lib/related-questions";

const ZAGS_PRIMARY_TAGS = [
  "хочу зарегистрировать брак",
  "как подать заявление в загс",
  "как зарегистрировать брак быстрее",
  "сменить фамилию после свадьбы",
  "сменить имя",
  "потерял свидетельство о браке",
  "получить справку о браке после развода",
  "исправить ошибку в свидетельстве",
  "загс отказал"
];

const ZAGS_EXCLUDED_TOPICS = [
  "алименты",
  "раздел имущества",
  "порядок общения с ребенком",
  "место жительства ребенка",
  "лишение родительских прав",
  "расторжение брака",
  "развод через суд"
];

export const PROBLEM_EXCLUDED_TOPICS: Record<string, string[]> = {
  "brak-zags-i-smena-familii": ZAGS_EXCLUDED_TOPICS
};

export const PROBLEM_PRIMARY_TAGS: Record<string, string[]> = {
  "brak-zags-i-smena-familii": ZAGS_PRIMARY_TAGS
};

export const CATEGORY_QUESTION_PHRASES: Record<string, string[]> = {
  "semya-i-deti": ZAGS_PRIMARY_TAGS
};

export function categoryQuestionPhrases(slug: string, fallback: string[]): string[] {
  return CATEGORY_QUESTION_PHRASES[slug] ?? fallback;
}

export function buildProblemQuestionContext(args: {
  slug: string;
  categoryTitle?: string;
  primaryTags: string[];
}): RelatedQuestionsContext {
  const excludedTopics = PROBLEM_EXCLUDED_TOPICS[args.slug] ?? [];
  const excludedLower = new Set(excludedTopics.map((topic) => topic.toLowerCase()));
  const basePrimary = PROBLEM_PRIMARY_TAGS[args.slug] ?? args.primaryTags;
  return {
    contextType: "problem",
    categoryName: args.categoryTitle,
    primaryTags: basePrimary.filter((tag) => !excludedLower.has(tag.toLowerCase())),
    excludedTopics
  };
}

const DOCUMENT_INTENT_PHRASES = [
  "куда подавать",
  "какие документы приложить",
  "госпошлина",
  "срок подачи",
  "как заполнить",
  "официальный бланк",
  "что делать после подачи"
];

export const DOCUMENT_CONTEXT_OVERRIDES: Record<string, { primaryTags?: string[]; excludedTopics?: string[] }> = {
  "zayavlenie-v-zags": {
    primaryTags: [
      "заявление в загс",
      "заявление о заключении брака",
      "форма 7 загс",
      "форма 8 загс",
      "форма 20 перемена имени",
      "форма 23 исправить запись загс",
      "форма 26 повторное свидетельство",
      "справка о браке после развода"
    ],
    excludedTopics: ZAGS_EXCLUDED_TOPICS
  }
};

export function buildDocumentQuestionContext(args: {
  documentSlug: string;
  relatedPrimaryTags: string[];
  relatedExcludedTopics: string[];
}): RelatedQuestionsContext {
  const override = DOCUMENT_CONTEXT_OVERRIDES[args.documentSlug];
  return {
    contextType: "document",
    primaryTags: [...new Set([...(override?.primaryTags ?? args.relatedPrimaryTags), ...DOCUMENT_INTENT_PHRASES])],
    excludedTopics: [...new Set([...(override?.excludedTopics ?? args.relatedExcludedTopics)])]
  };
}
