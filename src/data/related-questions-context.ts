import type { RelatedQuestionsContext } from "@/lib/related-questions";

// Per-page context for the "Похожие вопросы" block. Primary tags come from the
// page's own relatedQuestionTopics; here we add the *exclusions* that stop
// sibling situations from leaking into each other (the main reported bug),
// plus document-specific tuning.

// Sibling family topics, reused across exclusion lists.
const TOPIC = {
  alimonyFirst: ["как подать на алименты", "взыскать алименты", "судебный приказ на алименты", "соглашение об алиментах"],
  alimonyDebt: ["долг по алиментам", "задолженность по алиментам", "алименты не платит", "пристав", "неустойка по алиментам"],
  property: ["раздел имущества", "поделить квартиру", "раздел квартиры", "раздел ипотеки", "совместно нажитое", "брачный договор"],
  communication: ["порядок общения", "график общения", "видеться с ребенком", "не дает видеться с ребенком"],
  residence: ["место жительства ребенка", "с кем будет жить ребенок", "ребенка забрали"],
  deprivation: ["лишение родительских прав", "лишить прав", "ограничение родительских прав"],
  divorce: ["расторжение брака", "развод через суд"]
};

// Keyed by problem slug. Exclusions target *confusable sibling situations*, not
// broad words that legitimately co-occur with the page's own topic.
export const PROBLEM_EXCLUDED_TOPICS: Record<string, string[]> = {
  // Единая страница по алиментам — оставляем взыскание, долг и приставов, но отсекаем соседние семейные темы.
  "alimenty": [...TOPIC.property, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation],

  // Порядок общения — отсечь алименты, имущество, лишение прав.
  "poryadok-obshcheniya-s-rebenkom": [...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.property, ...TOPIC.deprivation],
  "poryadok-obscheniya-s-rebenkom": [...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.property, ...TOPIC.deprivation],

  // Место жительства ребёнка — отсечь график встреч, алименты, имущество.
  "opredelenie-mesta-zhitelstva-rebenka": [...TOPIC.communication, ...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.property],
  "mesto-zhitelstva-rebenka": [...TOPIC.communication, ...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.property],

  // Лишение/ограничение прав — отсечь обычные споры без угрозы ребёнку.
  "lishenie-i-ogranichenie-roditelskih-prav": [...TOPIC.property, ...TOPIC.communication, ...TOPIC.divorce],
  "lishenie-roditelskih-prav": [...TOPIC.property, ...TOPIC.communication, ...TOPIC.divorce],

  // Раздел имущества — отсечь детские темы.
  "razdel-imushchestva-suprugov": [...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation],
  "suprug-skryvaet-imuschestvo": [...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation],

  // Развод — отсечь раздел/детские споры, не относящиеся напрямую к расторжению.
  "razvod": [...TOPIC.property, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation]
};

// Question-matching primary tags for pages whose relatedQuestionTopics include
// sibling themes (used elsewhere for SEO/search) that must NOT pull sibling
// questions into this block. Overrides relatedQuestionTopics for matching only.
export const PROBLEM_PRIMARY_TAGS: Record<string, string[]> = {
  alimenty: [
    "алименты",
    "алименты на ребенка",
    "взыскать алименты",
    "алименты не платят",
    "долг по алиментам",
    "задолженность по алиментам",
    "неустойка по алиментам",
    "судебный приказ на алименты",
    "иск о взыскании алиментов",
    "алименты в твердой денежной сумме",
    "алименты если отец не работает",
    "алименты с ИП",
    "алименты с самозанятого",
    "приставы алименты",
    "изменить размер алиментов",
    "дополнительные расходы на ребенка"
  ],
  razvod: [
    "развод",
    "расторжение брака",
    "развод через суд",
    "развод через загс",
    "развод с детьми",
    "развод без согласия супруга",
    "куда подать на развод",
    "госпошлина за развод",
    "как развестись"
  ]
};

// Broad question phrases for SECTION (category) pages — cover the whole theme so
// the related-questions block can show maximum variety across subtopics. Falls
// back to the category's own questionTopics when a slug isn't listed here.
export const CATEGORY_QUESTION_PHRASES: Record<string, string[]> = {
  "semya-i-deti": [
    "алименты",
    "развод",
    "расторжение брака",
    "раздел имущества",
    "брачный договор",
    "опека",
    "усыновление",
    "лишение родительских прав",
    "место жительства ребенка",
    "порядок общения с ребенком",
    "материнский капитал",
    "установление отцовства",
    "брак",
    "дети"
  ]
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
  // A tag can't be both primary and excluded — drop contradictions defensively.
  const primaryTags = basePrimary.filter((tag) => !excludedLower.has(tag.toLowerCase()));
  return {
    contextType: "problem",
    categoryName: args.categoryTitle,
    primaryTags,
    excludedTopics
  };
}

// Phrases that signal a question is about preparing/filing/using a document.
const DOCUMENT_INTENT_PHRASES = [
  "куда подавать",
  "куда подать",
  "какие документы приложить",
  "госпошлина",
  "срок подачи",
  "срок рассмотрения",
  "оставили без движения",
  "вернули заявление",
  "вернули иск",
  "как заполнить",
  "образец",
  "что делать после подачи",
  "мировой или районный суд"
];

// Document-specific tuning, keyed by document slug. When absent, the document
// context falls back to the union of related problems' topics + exclusions.
export const DOCUMENT_CONTEXT_OVERRIDES: Record<string, { primaryTags?: string[]; excludedTopics?: string[] }> = {
  "isk-o-rastorzhenii-braka": {
    primaryTags: ["иск о разводе", "расторжение брака через суд", "развод через суд", "развод с детьми", "куда подавать иск о разводе", "госпошлина за развод", "документы для развода через суд", "супруг против развода"],
    excludedTopics: [...TOPIC.property, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation, "наследство", "миграция"]
  },
  "zayavlenie-o-vzyskanii-alimentov": {
    primaryTags: ["заявление на алименты", "взыскать алименты", "судебный приказ на алименты", "иск о взыскании алиментов", "госпошлина алименты", "какие документы приложить алименты"],
    excludedTopics: [...TOPIC.alimonyDebt, ...TOPIC.property, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation]
  },
  "zhaloba-na-sudebnogo-pristava": {
    primaryTags: ["жалоба на пристава", "пристав бездействует", "пристав не взыскивает", "куда подать жалобу на пристава", "старший пристав", "прокуратура пристав"],
    excludedTopics: [...TOPIC.alimonyFirst, ...TOPIC.property, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.divorce]
  },
  "isk-o-razdele-imuschestva": {
    primaryTags: ["иск о разделе имущества", "раздел имущества через суд", "раздел квартиры", "раздел ипотеки", "оценка имущества", "госпошлина за раздел имущества", "какие документы приложить раздел"],
    excludedTopics: [...TOPIC.alimonyFirst, ...TOPIC.alimonyDebt, ...TOPIC.communication, ...TOPIC.residence, ...TOPIC.deprivation]
  }
};

export function buildDocumentQuestionContext(args: {
  documentSlug: string;
  relatedPrimaryTags: string[];
  relatedExcludedTopics: string[];
}): RelatedQuestionsContext {
  const override = DOCUMENT_CONTEXT_OVERRIDES[args.documentSlug];
  const primaryTags = [...new Set([...(override?.primaryTags ?? args.relatedPrimaryTags), ...DOCUMENT_INTENT_PHRASES])];
  const excludedTopics = [...new Set([...(override?.excludedTopics ?? args.relatedExcludedTopics)])];
  return {
    contextType: "document",
    primaryTags,
    excludedTopics
  };
}
