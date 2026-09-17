import { legalCategories } from "@/data/legal-categories";
import { navigatorDocuments } from "@/data/documents";
import { legalPages } from "@/data/legal-pages";
import { legalProblems } from "@/data/legal-problems";
import type { LegalProblemRiskLevel, LegalProblemUrgency } from "@/data/legal-problems";
import { navigatorTools } from "@/data/tools";
import { getGeneratorMetaDescription, getGeneratorPageTitle } from "@/lib/document-seo";
import type { Lawyer, Question } from "@/lib/types";

const activeLegalCategories = legalCategories.filter((category) =>
  legalProblems.some((problem) => problem.categorySlug === category.slug)
);

export type SiteSearchResult = {
  title: string;
  description?: string;
  href: string;
  type: "situation" | "instruction" | "document" | "question" | "lawyer" | "tool" | "category" | "page";
  categoryLabel?: string;
  actionLabel?: string;
  riskLevel?: LegalProblemRiskLevel;
  urgency?: LegalProblemUrgency;
  keywords?: string[];
};

export type SearchResultType = SiteSearchResult["type"];

export type SearchResultGroup = {
  type: SearchResultType;
  title: string;
  description: string;
  results: SiteSearchResult[];
};

type SearchableResult = SiteSearchResult & {
  haystack: string;
  normalizedTitle: string;
  tokens: string[];
};

type SearchDomain = "employment" | "family" | "housing" | "consumer" | "inheritance" | "documents" | "debtCourt" | "other";

export const searchGroupCopy: Record<SearchResultType, { title: string; description: string }> = {
  situation: {
    title: "С чего начать",
    description: "Готовые разборы юридических ситуаций: первый шаг, сроки, риски и возможные действия."
  },
  instruction: {
    title: "Инструкции",
    description: "Пошаговые правовые инструкции: куда обращаться, какой документ нужен и что будет дальше."
  },
  document: {
    title: "Документы",
    description: "Заявления, жалобы, претензии и другие юридические документы, которые можно подготовить и проверить перед отправкой."
  },
  question: {
    title: "Вопросы и ответы",
    description: "Похожие вопросы пользователей, краткие ответы и ссылки на материалы по теме."
  },
  lawyer: {
    title: "Юристы",
    description: "Варианты индивидуальной помощи, если ситуация сложная, есть спор по срокам или нужно проверить документы."
  },
  tool: {
    title: "Инструменты",
    description: "Калькуляторы и проверки сроков, рисков и документов."
  },
  category: {
    title: "Темы",
    description: "Разделы правового навигатора по похожим жизненным ситуациям."
  },
  page: {
    title: "Другие материалы",
    description: "Справочные страницы и разделы ПравоПоиска."
  }
};

const staticPages: SiteSearchResult[] = [
  {
    title: "Найти правовую инструкцию",
    description: "Подберите правовую инструкцию: что делать в юридической ситуации, какие сроки проверить и какой документ нужен.",
    href: "/problems/",
    type: "page",
    categoryLabel: "Диагностика",
    actionLabel: "Открыть диагностику",
    keywords: ["диагностика", "проверка ситуации", "сроки", "риски", "правовая инструкция", "что делать в юридической ситуации"]
  },
  {
    title: "Проверка юридического документа онлайн",
    description: "Загрузите юридический документ, получите понятный разбор, проверьте сроки и риски, сформируйте ответ или отправьте документ юристу.",
    href: "/document-check/",
    type: "page",
    categoryLabel: "Проверка документа",
    actionLabel: "Проверить документ",
    keywords: [
      "проверка юридического документа",
      "проверить документ у юриста",
      "разбор документа онлайн",
      "юридическая консультация по документу",
      "судебный приказ",
      "постановление пристава",
      "договор",
      "претензия",
      "жалоба",
      "помощь юриста онлайн",
      "юридические документы"
    ]
  },
  {
    title: "Правовой навигатор",
    description: "Категории жизненных ситуаций с пошаговыми инструкциями, документами и связанными вопросами.",
    href: "/problems/",
    type: "page",
    categoryLabel: "Ситуации",
    actionLabel: "Посмотреть ситуации",
    keywords: ["ситуации", "инструкции", "правовой навигатор", "правовая инструкция"]
  },
  {
    title: "Юридические документы",
    description: "Раздел документов помогает выбрать нужную форму и подготовить данные перед обращением.",
    href: "/documents/",
    type: "page",
    categoryLabel: "Документы",
    actionLabel: "Подобрать документ",
    keywords: ["шаблоны", "документы", "заявления", "жалобы", "претензии", "юридические документы", "образец заявления"]
  },
  {
    title: "Инструменты",
    description: "Калькуляторы и проверки сроков, рисков и документов.",
    href: "/tools/",
    type: "page",
    categoryLabel: "Инструменты",
    actionLabel: "Открыть инструмент",
    keywords: ["калькулятор", "срок", "проверка"]
  },
  {
    title: "Вопросы юристам",
    description: "Публичные вопросы и ответы после модерации и проверки качества.",
    href: "/questions/",
    type: "question",
    categoryLabel: "Q&A",
    actionLabel: "Посмотреть ответы",
    keywords: ["вопросы", "ответы", "юристы", "юридическая консультация", "похожие вопросы"]
  },
  {
    title: "Получить консультацию юриста",
    description: "Если ситуация сложная или срок уже пропущен, лучше разобрать документы с юристом.",
    href: "/questions/#question",
    type: "lawyer",
    categoryLabel: "Юристы",
    actionLabel: "Задать вопрос юристу",
    keywords: [
      "юристы",
      "специалисты",
      "профили",
      "юридическая консультация",
      "юридическая помощь онлайн",
      "помощь юриста",
      "судебный приказ",
      "алименты",
      "трудовой спор",
      "долги и приставы",
      "жилищный вопрос"
    ]
  }
];

const popularSearchHints = [
  "Заключить брак",
  "Сменить фамилию или имя",
  "Получить повторное свидетельство",
  "Исправить запись ЗАГС",
  "Развод через ЗАГС или суд",
  "Разделить имущество супругов"
];

const documentIntentPatterns = [
  "документ",
  "документы",
  "образец",
  "бланк",
  "заявление",
  "жалоба",
  "претензия",
  "иск",
  "возражение",
  "ходатайство",
  "скачать",
  "заполнить"
];

const urgentIntentPatterns = [
  "судебный приказ",
  "пристав",
  "списали",
  "арест",
  "увол",
  "зарплата",
  "штраф",
  "суд",
  "срок",
  "повестка",
  "долг"
];

const generalHelpQueries = new Set(["помогите", "срочно нужна помощь", "консультация", "юрист"]);
const lowSignalQueries = new Set(["привет", "что делать", "хочу денег", "12345", "тест", "абракадабра юр помощь"]);

const intentMarkers: Record<Exclude<SearchDomain, "family" | "other">, string[]> = {
  employment: ["увол", "увольнение", "работодатель", "зарплата", "трудовая", "больничный", "сократили", "сокращение"],
  housing: ["квартира", "квартиры", "квартире", "выселя", "выселение", "доля", "недвижимость", "соседи", "застройщик", "ремонт квартиры"],
  consumer: ["магазин", "товар", "гарантия", "гарантии", "подписка", "подписку", "услуга", "услуги", "ремонт", "заказ", "доставка", "возврат денег", "не возвращают деньги"],
  inheritance: ["умер", "умерла", "смерть", "родственник", "наследство", "наследства", "нотариус", "завещание"],
  documents: ["паспорт", "потерял паспорт", "документы", "восстановить паспорт"],
  debtCourt: ["пристав", "судебный приказ", "арест", "коллектор", "кредит", "банк подал", "долг", "взыскание"]
};

const debtEnforcementMarkers = ["пристав", "судебный приказ", "арест", "исполнитель", "коллектор", "кредит", "долг", "взыскание"];

function isPassportLossQuery(normalizedQuery: string) {
  return (
    normalizedQuery.includes("паспорт") &&
    /(потер|утер|украл|восстанов|замен|пропал)/.test(normalizedQuery) &&
    !normalizedQuery.includes("загран")
  );
}

function isExcludedDivorcePropertyIntent(result: SearchableResult, normalizedQuery: string) {
  const isDivorcePropertyResult = result.href.includes("razvod-i-razdel-imushchestva")
    || result.href.includes("rastorzhenii-braka")
    || result.href.includes("razdele-imushchestva");
  if (!isDivorcePropertyResult) return false;
  return [
    "алимет",
    "алимент",
    "место жительства ребенка",
    "место жительства ребёнка",
    "общение с ребенком",
    "общение с ребёнком",
    "порядок общения",
    "лишение родительских прав",
    "установление отцовства",
    "оспаривание отцовства"
  ].some((marker) => normalizedQuery.includes(marker));
}

export function isPassportRestoreIntent(query: string) {
  return isPassportLossQuery(normalizeSearchText(query));
}

// Текстовые маркеры семейного домена для документов (на случай, если связь по
// relatedProblemSlugs неполная). Сравниваются с нормализованным текстом документа.
const familyDocMarkers = ["развод", "брак", "алимент", "супруг", "усыновлен", "родительск", "раздел имущества", "место жительства ребенка"];

// Стоп-слова: служебные слова не должны порождать совпадения в word-bag (например
// «без» в «без личного контакта» давало ложный матч документа о разводе по запросу
// «уволили без причины»). Значимые короткие слова («иск», «суд», «долг») сохраняются.
const searchStopwords = new Set([
  "без", "для", "или", "над", "под", "про", "изо", "что", "как", "так", "это", "эта", "эти", "все",
  "нет", "при", "она", "они", "оно", "его", "ему", "мне", "нас", "вам", "был", "уже", "чем", "тем",
  "кто", "где", "там", "тут", "вот"
]);

export function getPopularSearchHints() {
  return popularSearchHints;
}

export function getSiteSearchIndex(extraResults: SiteSearchResult[] = []): SiteSearchResult[] {
  return [
    ...staticPages,
    ...activeLegalCategories.map((category) => ({
      title: category.title,
      description: category.userProblem || category.description,
      href: `/problems/${category.slug}/`,
      type: "category" as const,
      categoryLabel: "Категория ситуаций",
      actionLabel: "Смотреть ситуации",
      keywords: [category.description, ...category.questionTopics, ...category.lawyerSpecializations]
    })),
    ...legalProblems.flatMap((problem) => [
      {
      title: problem.title,
      description: problem.shortAnswer,
      href: `/problems/${problem.categorySlug}/${problem.slug}/`,
      type: "situation" as const,
      categoryLabel: getCategoryTitle(problem.categorySlug) ?? "Жизненная ситуация",
      actionLabel: "Разобрать ситуацию",
      riskLevel: problem.riskLevel,
      urgency: problem.urgency,
      keywords: [
        problem.h1,
        problem.shortTitle,
        problem.description,
        problem.seoTitle,
        problem.seoDescription,
        ...problem.documents,
        ...problem.relatedQuestionTopics,
        ...problem.relatedLawyerSpecializations
      ]
      },
      {
        title: `Как действовать: ${problem.shortTitle}`,
        description: `Пошагово: куда обращаться, какие документы нужны и какие сроки важно не пропустить.`,
        href: `/problems/${problem.categorySlug}/${problem.slug}/`,
        type: "instruction" as const,
        categoryLabel: "Правовая инструкция",
        actionLabel: "Открыть инструкцию",
        riskLevel: problem.riskLevel,
        urgency: problem.urgency,
        keywords: [
          "правовая инструкция",
          "что делать",
          "куда подать",
          "какие сроки",
          "какой документ нужен",
          problem.title,
          problem.h1,
          problem.shortAnswer,
          ...problem.steps,
          ...problem.documents,
          ...problem.relatedQuestionTopics
        ]
      }
    ]),
    ...navigatorDocuments.flatMap((document) => [
      {
        title: document.title,
        description: document.shortDescription,
        href: `/documents/${document.slug}/`,
        type: "document" as const,
        categoryLabel: `Документ: ${document.category}`,
        actionLabel: document.slug === "zayavlenie-v-zags" ? "Подготовить документ" : "Открыть документ",
        keywords: [document.category, ...document.whenToUse, ...document.requiredData, ...document.relatedProblemSlugs]
      },
      ...(document.templateSlug
        ? [
            {
              title: getGeneratorPageTitle(document),
              description: getGeneratorMetaDescription(document),
              // Генератор встроен в страницу документа (#fill-online), /generator/ удалён.
              href: `/documents/${document.slug}/#fill-online`,
              type: "document" as const,
              categoryLabel: "Онлайн-заполнение документа",
              actionLabel: "Заполнить онлайн",
              keywords: ["образец", "бланк", "скачать", "заполнить онлайн", document.category, document.title, ...document.relatedProblemSlugs]
            }
          ]
        : [])
    ]),
    ...navigatorTools
      .filter((tool) => tool.status === "available")
      .map((tool) => ({
        title: tool.title,
        description: tool.description,
        href: `/tools/${tool.slug}/`,
        type: "tool" as const,
        categoryLabel: "Инструмент",
        actionLabel: "Открыть инструмент",
        keywords: ["калькулятор", "проверка", ...tool.relatedProblemSlugs]
      })),
    ...legalPages.map((page) => ({
      title: page.title,
      description: page.description,
      href: `/legal/${page.slug}/`,
      type: "page" as const,
      categoryLabel: "Правовая информация",
      actionLabel: "Открыть страницу",
      keywords: [page.metaTitle, page.metaDescription, ...page.sections.flatMap((section) => [section.title, ...section.items])]
    })),
    ...extraResults
  ];
}

export function searchSite(query: string, limit = 36, extraResults: SiteSearchResult[] = []) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];
  const generalAllowedTypes = getGeneralQueryAllowedTypes(normalizedQuery);
  if (generalAllowedTypes && !generalAllowedTypes.length) return [];
  const queryDomains = getQueryDomains(normalizedQuery);

  return getSearchableIndex(extraResults)
    .map((result) => {
      const baseScore = scoreResult(result, normalizedQuery);
      const directBoost = directIntentBoost(result, normalizedQuery);
      const rawScore = Math.max(baseScore, directBoost);
      if (generalAllowedTypes && !generalAllowedTypes.includes(result.type)) return { result, score: 0 };
      if (isExcludedDivorcePropertyIntent(result, normalizedQuery)) return { result, score: 0 };
      if (isConflictingResult(result, normalizedQuery, queryDomains)) return { result, score: 0 };
      if (rawScore <= 0 && !(generalAllowedTypes && result.type === "lawyer")) return { result, score: 0 };

      const guardedScore = (rawScore || 260) + intentBoost(result, normalizedQuery) + domainBoost(result, queryDomains);
      return { result, score: guardedScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title, "ru"))
    .slice(0, limit)
    .map(({ result }) => stripSearchMeta(result));
}

export function getSearchTypeOrder(query: string): SiteSearchResult["type"][] {
  const normalizedQuery = normalizeSearchText(query);
  const documentIntent = documentIntentPatterns.some((pattern) => normalizedQuery.includes(normalizeSearchText(pattern)));

  if (documentIntent) return ["document", "instruction", "situation", "question", "lawyer", "tool", "category", "page"];

  return ["situation", "instruction", "document", "question", "lawyer", "tool", "category", "page"];
}

export function isUrgentSearch(query: string, results: SiteSearchResult[]) {
  const normalizedQuery = normalizeSearchText(query);
  return (
    urgentIntentPatterns.some((pattern) => normalizedQuery.includes(normalizeSearchText(pattern))) ||
    results.some((result) => result.urgency === "today" || result.riskLevel === "high")
  );
}

export function groupSearchResults(
  query: string,
  results: SiteSearchResult[],
  options: { limitPerGroup?: number; types?: SearchResultType[]; onlyType?: SearchResultType } = {}
): SearchResultGroup[] {
  const allowedTypes = options.types ? new Set<SearchResultType>(options.types) : null;
  const grouped = new Map<SearchResultType, SiteSearchResult[]>();

  results.forEach((result) => {
    if (options.onlyType && result.type !== options.onlyType) return;
    if (allowedTypes && !allowedTypes.has(result.type)) return;

    const items = grouped.get(result.type) ?? [];
    if (!items.some((item) => item.href === result.href && item.title === result.title)) items.push(result);
    grouped.set(result.type, items);
  });

  const order = options.onlyType ? [options.onlyType] : getSearchTypeOrder(query).filter((type) => !allowedTypes || allowedTypes.has(type));

  return order
    .map((type) => {
      const results = grouped.get(type) ?? [];
      const visibleResults = options.limitPerGroup ? results.slice(0, options.limitPerGroup) : results;

      return visibleResults.length
        ? {
            type,
            title: searchGroupCopy[type].title,
            description: searchGroupCopy[type].description,
            results: visibleResults
          }
        : null;
    })
    .filter((group): group is SearchResultGroup => Boolean(group));
}

export function getSearchMoreLabel(type: SearchResultType) {
  if (type === "situation") return "Показать ещё ситуации";
  if (type === "instruction") return "Показать ещё инструкции";
  if (type === "document") return "Показать ещё документы";
  if (type === "question") return "Показать ещё вопросы";
  if (type === "lawyer") return "Показать ещё юристов";
  if (type === "tool") return "Показать ещё инструменты";
  if (type === "category") return "Показать ещё темы";
  return "Показать ещё материалы";
}

export function parseSearchResultType(value: string | undefined): SearchResultType | undefined {
  return value && value in searchGroupCopy ? (value as SearchResultType) : undefined;
}

export function buildQuestionSearchResults(questions: Question[]): SiteSearchResult[] {
  return questions.map((question) => ({
    title: question.title,
    description: question.shortPreview ?? question.text,
    href: `/questions/${question.slug}/`,
    type: "question" as const,
    categoryLabel: question.service?.name ?? "Вопросы и ответы",
    actionLabel: "Посмотреть ответ",
    keywords: [
      "вопросы и ответы",
      "похожие вопросы",
      "юридическая консультация",
      question.service?.name ?? "",
      question.category ?? "",
      ...(question.tags ?? [])
    ]
  }));
}

export function buildLawyerSearchResults(lawyers: Lawyer[]): SiteSearchResult[] {
  return lawyers.slice(0, 8).map((lawyer) => ({
    title: `${lawyer.lastName} ${lawyer.firstName}: консультация юриста`,
    description: `Помощь юриста по темам: ${lawyer.services.slice(0, 3).map((service) => service.name).join(", ") || "сроки, документы и риски"}.`,
    href: `/lawyers/${lawyer.slug}/`,
    type: "lawyer" as const,
    categoryLabel: lawyer.status === "ADVOCATE" ? "Адвокат" : "Юрист",
    actionLabel: "Получить консультацию",
    keywords: [
      "юрист",
      "юридическая консультация",
      "помощь юриста",
      "юридическая помощь онлайн",
      lawyer.description,
      ...lawyer.services.map((service) => service.name),
      ...lawyer.cities.map((city) => city.name)
    ]
  }));
}

function getSearchableIndex(extraResults: SiteSearchResult[] = []): SearchableResult[] {
  return getSiteSearchIndex(extraResults).map((result) => {
    const haystackParts = [result.title, result.description ?? "", result.categoryLabel ?? "", ...(result.keywords ?? [])];
    const haystack = normalizeSearchText(haystackParts.join(" "));

    return {
      ...result,
      haystack,
      normalizedTitle: normalizeSearchText(result.title),
      tokens: [...new Set(haystack.split(" ").filter((word) => word.length >= 5))]
    };
  });
}

function boundedEditDistance(left: string, right: string, maxDistance: number): number {
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    let rowMinimum = current[0];
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + substitutionCost);
      rowMinimum = Math.min(rowMinimum, current[j]);
    }
    if (rowMinimum > maxDistance) return maxDistance + 1;
    previous = current;
  }
  return previous[right.length];
}

function isFuzzyWordMatch(queryWord: string, candidate: string): boolean {
  if (queryWord.length < 5 || candidate.length < 5) return false;
  if (queryWord[0] !== candidate[0]) return false;
  const maxDistance = queryWord.length >= 8 ? 2 : 1;
  return boundedEditDistance(queryWord, candidate, maxDistance) <= maxDistance;
}

function scoreResult(result: SearchableResult, normalizedQuery: string) {
  if (result.normalizedTitle === normalizedQuery) return 1000;
  if (result.normalizedTitle.startsWith(normalizedQuery)) return 900;
  if (result.normalizedTitle.includes(normalizedQuery)) return 800;
  if (result.haystack.includes(normalizedQuery)) return 650;

  const queryWords = normalizedQuery.split(" ").filter((word) => word.length >= 3 && !searchStopwords.has(word));
  if (!queryWords.length) return 0;

  const matchedWords = queryWords.filter((word) => result.haystack.includes(word)).length;
  const fuzzyMatchedWords = queryWords.filter(
    (word) => !result.haystack.includes(word) && result.tokens.some((candidate) => isFuzzyWordMatch(word, candidate))
  ).length;
  if (!matchedWords && !fuzzyMatchedWords) return 0;

  return (
    matchedWords * 100 +
    fuzzyMatchedWords * 70 +
    (result.type === "situation" ? 40 : result.type === "instruction" ? 35 : result.type === "document" ? 30 : 0)
  );
}

function intentBoost(result: SearchableResult, normalizedQuery: string) {
  const order = getSearchTypeOrder(normalizedQuery);
  const index = order.indexOf(result.type);
  const orderBoost = index >= 0 ? (order.length - index) * 8 : 0;
  const urgentBoost = result.urgency === "today" || result.riskLevel === "high" ? 15 : 0;
  return orderBoost + urgentBoost;
}

function getGeneralQueryAllowedTypes(normalizedQuery: string): SearchResultType[] | null {
  if (generalHelpQueries.has(normalizedQuery)) return ["lawyer"];
  if (lowSignalQueries.has(normalizedQuery)) return [];
  return null;
}

function getQueryDomains(normalizedQuery: string): SearchDomain[] {
  const domains = Object.entries(intentMarkers)
    .filter(([, markers]) => markers.some((marker) => normalizedQuery.includes(normalizeSearchText(marker))))
    .map(([domain]) => domain as SearchDomain);

  return [...new Set(domains)];
}

function getResultDomain(result: SearchableResult): SearchDomain {
  const href = result.href;
  if (href.includes("/semya-i-deti/")) return "family";
  return "other";
}

function categorySlugToDomain(categorySlug: string): SearchDomain {
  if (categorySlug === "semya-i-deti") return "family";
  return "other";
}

const problemDomainBySlug = new Map<string, SearchDomain>(
  legalProblems.map((problem) => [problem.slug, categorySlugToDomain(problem.categorySlug)])
);

// Домены документа (href `/documents/<slug>/` и его генератора) выводятся из связанных
// проблем (категория → домен) и подкрепляются текстовыми семейными маркерами. Это
// нужно потому, что у документов href не содержит категории и getResultDomain по нему
// всегда давал бы "other", из-за чего domain-guard их не отсекал.
const documentDomainsByHref = (() => {
  const map = new Map<string, Set<SearchDomain>>();
  for (const document of navigatorDocuments) {
    const domains = new Set<SearchDomain>();
    for (const slug of document.relatedProblemSlugs) {
      const domain = problemDomainBySlug.get(slug);
      if (domain && domain !== "other") domains.add(domain);
    }
    const text = normalizeSearchText([document.title, document.category, ...document.keywords].join(" "));
    if (familyDocMarkers.some((marker) => text.includes(marker))) domains.add("family");
    map.set(`/documents/${document.slug}/`, domains);
    if (document.templateSlug) map.set(`/documents/${document.slug}/#fill-online`, domains);
  }
  return map;
})();

function getResultDomains(result: SearchableResult): Set<SearchDomain> {
  if (result.type === "document") {
    const domains = documentDomainsByHref.get(result.href);
    if (domains && domains.size) return domains;
  }
  return new Set([getResultDomain(result)]);
}

function isConflictingResult(result: SearchableResult, normalizedQuery: string, queryDomains: SearchDomain[]) {
  if (result.type === "lawyer" || result.type === "question") return false;

  // Точное совпадение названия — сильный прямой сигнал, домен-конфликт не применяем.
  if (result.normalizedTitle === normalizedQuery) return false;

  if (isParentalRightsRestorationRouteResult(result.href) && isParentalRightsRestorationQuery(normalizedQuery)) return false;
  if (isParentalRightsRestrictionCancellationRouteResult(result.href) && isParentalRightsRestrictionCancellationQuery(normalizedQuery)) return false;
  if (isParentalDisagreementsRouteResult(result.href) && isParentalDisagreementsQuery(normalizedQuery)) return false;
  if (isAdditionalChildExpensesRouteResult(result.href) && isAdditionalChildExpensesQuery(normalizedQuery)) return false;
  if (isSpousalSupportRouteResult(result.href) && isSpousalSupportQuery(normalizedQuery)) return false;
  if (isInvalidMarriageRouteResult(result.href) && isInvalidMarriageQuery(normalizedQuery)) return false;
  if (isComplexMaritalPropertyRouteResult(result.href) && isComplexMaritalPropertyQuery(normalizedQuery)) return false;
  if (isSurrogacyOriginRouteResult(result.href) && isSurrogacyOriginQuery(normalizedQuery)) return false;
  if (isInternationalFamilyDisputesRouteResult(result.href) && isInternationalFamilyDisputesQuery(normalizedQuery)) return false;
  if (isPrenuptialAgreementRouteResult(result.href) && isPrenuptialAgreementQuery(normalizedQuery)) return false;
  if (isChildNameRouteResult(result.href) && isChildNameQuery(normalizedQuery)) return false;
  if (isChildTravelRouteResult(result.href) && isChildTravelQuery(normalizedQuery)) return false;
  if (isAdoptionRouteResult(result.href) && isAdoptionQuery(normalizedQuery)) return false;
  if (isPaternityContestRouteResult(result.href) && isPaternityContestQuery(normalizedQuery)) return false;
  if (isParentalRightsRestorationQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isParentalRightsRestrictionCancellationQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isParentalDisagreementsQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isAdditionalChildExpensesQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isSpousalSupportQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isInvalidMarriageQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isComplexMaritalPropertyQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isSurrogacyOriginQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isInternationalFamilyDisputesQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isPrenuptialAgreementQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;
  if (isChildNameQuery(normalizedQuery) && getResultDomains(result).has("family")) return true;

  if (isGuardianshipRouteResult(result.href) && isExcludedGuardianshipQuery(normalizedQuery)) return true;
  if (isGuardianshipRouteResult(result.href) && isChildGuardianshipQuery(normalizedQuery)) return false;
  if (isParentsChildRouteResult(result.href) && isExcludedParentsChildQuery(normalizedQuery)) return true;
  if (isParentsChildRouteResult(result.href) && isParentsChildQuery(normalizedQuery)) return false;
  if (isChildSupportRouteResult(result.href) && isExcludedChildSupportQuery(normalizedQuery)) return true;
  if (isChildSupportRouteResult(result.href) && isChildSupportQuery(normalizedQuery)) return false;
  if (isParentalRightsDeprivationRouteResult(result.href) && isExcludedParentalRightsDeprivationQuery(normalizedQuery)) return true;
  if (isParentalRightsDeprivationRouteResult(result.href) && isParentalRightsDeprivationQuery(normalizedQuery)) return false;
  if (isParentalRightsRestrictionRouteResult(result.href) && isExcludedParentalRightsRestrictionQuery(normalizedQuery)) return true;
  if (isParentalRightsRestrictionRouteResult(result.href) && isParentalRightsRestrictionQuery(normalizedQuery)) return false;
  if (isParentalRightsRestorationRouteResult(result.href) && isParentalRightsRestorationQuery(normalizedQuery)) return false;
  if (isParentalRightsRestorationRouteResult(result.href)) return true;
  if (isParentalRightsRestrictionCancellationRouteResult(result.href) && isParentalRightsRestrictionCancellationQuery(normalizedQuery)) return false;
  if (isParentalRightsRestrictionCancellationRouteResult(result.href)) return true;
  if (isParentalDisagreementsRouteResult(result.href) && isParentalDisagreementsQuery(normalizedQuery)) return false;
  if (isParentalDisagreementsRouteResult(result.href)) return true;
  if (isAdditionalChildExpensesRouteResult(result.href) && isAdditionalChildExpensesQuery(normalizedQuery)) return false;
  if (isAdditionalChildExpensesRouteResult(result.href)) return true;
  if (isSpousalSupportRouteResult(result.href) && isSpousalSupportQuery(normalizedQuery)) return false;
  if (isSpousalSupportRouteResult(result.href)) return true;
  if (isInvalidMarriageRouteResult(result.href) && isInvalidMarriageQuery(normalizedQuery)) return false;
  if (isInvalidMarriageRouteResult(result.href)) return true;
  if (isComplexMaritalPropertyRouteResult(result.href) && isComplexMaritalPropertyQuery(normalizedQuery)) return false;
  if (isComplexMaritalPropertyRouteResult(result.href)) return true;
  if (isSurrogacyOriginRouteResult(result.href) && isSurrogacyOriginQuery(normalizedQuery)) return false;
  if (isSurrogacyOriginRouteResult(result.href)) return true;
  if (isInternationalFamilyDisputesRouteResult(result.href) && isInternationalFamilyDisputesQuery(normalizedQuery)) return false;
  if (isInternationalFamilyDisputesRouteResult(result.href)) return true;
  if (isPrenuptialAgreementRouteResult(result.href) && isPrenuptialAgreementQuery(normalizedQuery)) return false;
  if (isPrenuptialAgreementRouteResult(result.href)) return true;
  if (isPaternityEstablishmentRouteResult(result.href) && isPaternityEstablishmentQuery(normalizedQuery)) return false;
  if (isPaternityEstablishmentRouteResult(result.href)) return true;
  if (isPaternityContestRouteResult(result.href) && isPaternityContestQuery(normalizedQuery)) return false;
  if (isPaternityContestRouteResult(result.href)) return true;
  if (isAdoptionRouteResult(result.href) && isAdoptionQuery(normalizedQuery)) return false;
  if (isAdoptionRouteResult(result.href)) return true;
  if (isChildTravelRouteResult(result.href) && isChildTravelQuery(normalizedQuery)) return false;
  if (isChildTravelRouteResult(result.href)) return true;
  if (isChildNameRouteResult(result.href) && isChildNameQuery(normalizedQuery)) return false;
  if (isChildNameRouteResult(result.href)) return true;

  const resultDomains = getResultDomains(result);
  // Если результат относится к тому же домену, что и запрос, конфликта нет.
  if (queryDomains.some((domain) => resultDomains.has(domain))) return false;

  // Запросы из непрофильных доменов не должны показывать семейные материалы
  // (в т.ч. документы: развод, алименты, раздел имущества, родительские права и т.п.).
  const familyConflictQuery =
    queryDomains.includes("employment") ||
    queryDomains.includes("housing") ||
    queryDomains.includes("consumer") ||
    queryDomains.includes("inheritance") ||
    queryDomains.includes("documents");
  if (familyConflictQuery && resultDomains.has("family")) return true;

  if (
    queryDomains.includes("consumer") &&
    resultDomains.has("debtCourt") &&
    !debtEnforcementMarkers.some((marker) => normalizedQuery.includes(normalizeSearchText(marker)))
  ) {
    return true;
  }
  return false;
}

function domainBoost(result: SearchableResult, queryDomains: SearchDomain[]) {
  const resultDomains = getResultDomains(result);
  return queryDomains.some((domain) => resultDomains.has(domain)) ? 180 : 0;
}

function isZagsProcedureQuery(normalizedQuery: string) {
  const isDivorceQuery =
    (normalizedQuery.includes("развод") || normalizedQuery.includes("расторжен")) &&
    !normalizedQuery.includes("справ") &&
    !normalizedQuery.includes("повтор") &&
    !normalizedQuery.includes("после развод");
  if (isDivorceQuery || normalizedQuery.includes("алимент")) return false;

  return [
    "хочу зарегистрировать брак",
    "зарегистрировать брак",
    "регистрация брака",
    "подать заявление в загс",
    "заявление в загс",
    "зарегистрировать брак быстрее",
    "сменить фамилию после свадьбы",
    "сменить фамилию после брака",
    "сменить имя",
    "перемена имени",
    "потерял свидетельство о браке",
    "повторное свидетельство о браке",
    "справка о браке после развода",
    "получить справку о браке",
    "исправить ошибку в свидетельстве",
    "исправить запись загс",
    "загс отказал"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isGuardianshipRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/") || [
    "/documents/zayavlenie-o-naznachenii-opekuna-rebenku/",
    "/documents/zayavlenie-roditelya-o-naznachenii-opekuna/",
    "/documents/dokumenty-po-imushchestvu-podopechnogo/",
    "/documents/zhaloba-na-organ-opeki/"
  ].some((path) => href.includes(path));
}

function isExcludedGuardianshipQuery(normalizedQuery: string) {
  return (normalizedQuery.includes("недееспособ") && normalizedQuery.includes("взросл")) ||
    ((normalizedQuery.includes("лишен") || normalizedQuery.includes("лишит")) && normalizedQuery.includes("родитель")) || [
    "усынов",
    "удочер",
    "за границ",
    "согласие на выезд",
    "несогласие на выезд",
    "ограничен родитель",
    "место жительства ребенка",
    "порядок общения",
    "алимент",
    "сменить имя ребенку",
    "сменить имя подростк",
    "сменить фамилию ребенку",
    "изменить отчество ребенку",
    "перемена имени несовершеннолет",
    "эмансип",
    "совершеннолет",
    "опека над взросл"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isChildGuardianshipQuery(normalizedQuery: string) {
  if (isExcludedGuardianshipQuery(normalizedQuery)) return false;
  return [
    "оформить опеку над ребенком",
    "стать опекуном ребенка",
    "опека над ребенком",
    "попечительство над ребенком",
    "опека бабушкой по заявлению родителей на определённый период",
    "родители уезжают",
    "ребенок остается с родственником",
    "предварительная опека",
    "разрешение опеки на имущество ребенка",
    "продажа квартиры ребенка",
    "продать недвижимость ребенка",
    "отчет опекуна",
    "номинальный счет опекуна",
    "орган опеки отказал",
    "орган опеки не отвечает"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isParentsChildRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/") || [
    "/documents/mesto-zhitelstva-rebenka-posle-razvoda/",
    "/documents/poryadok-obshcheniya-s-rebenkom/",
    "/documents/izmenenie-poryadka-po-rebenku/",
    "/documents/ispolnenie-resheniya-o-rebenke/"
  ].some((path) => href.includes(path));
}

function isExcludedParentsChildQuery(normalizedQuery: string) {
  return (normalizedQuery.includes("недееспособ") && normalizedQuery.includes("взросл")) || [
    "алимент",
    "лишен родитель",
    "лишит родитель",
    "лишить родитель",
    "ограничен родитель",
    "установить отцовство",
    "оспорить отцовство",
    "усынов",
    "удочер",
    "оформить опеку",
    "выезд ребенка за границу",
    "за границ",
    "согласие на выезд",
    "несогласие на выезд",
    "документы ребенку для въезда",
    "сменить имя ребенку",
    "сменить фамилию ребенку"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isParentsChildQuery(normalizedQuery: string) {
  if (isExcludedParentsChildQuery(normalizedQuery)) return false;
  return [
    "с кем будет жить ребенок",
    "с кем останется ребенок",
    "ребенок должен жить со мной",
    "место жительства ребенка после развода",
    "порядок общения с ребенком",
    "график общения с ребенком",
    "не дает видеться с ребенком",
    "не дают видеться с ребенком",
    "не дает видеть сына",
    "не дает видеть дочь",
    "не дает видеть ребенка",
    "хочет видеть ребенка",
    "изменить порядок общения",
    "изменить график общения",
    "не исполняется решение суда об общении",
    "исполнение решения о ребенке"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isChildSupportRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/alimenty-na-rebenka/") || [
    "/documents/soglashenie-ob-uplate-alimentov-na-rebenka/",
    "/documents/vzyskanie-alimentov-na-rebenka/",
    "/documents/izmenenie-razmera-alimentov-na-rebenka/",
    "/documents/raschet-zadolzhennosti-po-alimentam/",
    "/documents/ispolnenie-alimentov-na-rebenka/"
  ].some((path) => href.includes(path));
}

function isExcludedChildSupportQuery(normalizedQuery: string) {
  return [
    "алименты жене",
    "алименты мужу",
    "содержание супруг",
    "содержание бывшего супруг",
    "дополнительные расходы на ребенка",
    "установить отцовств",
    "оспорить отцовств",
    "усынов",
    "удочер",
    "опек",
    "попечитель",
    "лишить родитель",
    "лишен родитель",
    "ограничить родитель",
    "место жительства ребенка",
    "порядок общения"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isChildSupportQuery(normalizedQuery: string) {
  if (isExcludedChildSupportQuery(normalizedQuery)) return false;
  return normalizedQuery.includes("алимент") && [
    "ребен",
    "сын",
    "доч",
    "соглашен",
    "судебн приказ",
    "твердо",
    "долг",
    "задолж",
    "не платит",
    "увелич",
    "уменьш"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isParentalRightsDeprivationRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/lishenie-roditelskih-prav/") || [
    "/documents/proverka-osnovaniy-lisheniya-roditelskih-prav/",
    "/documents/isk-o-lishenii-roditelskih-prav/",
    "/documents/uchet-resheniy-pri-lishenii-roditelskih-prav/",
    "/documents/lishenie-roditelskih-prav-i-alimenty/"
  ].some((path) => href.includes(path));
}

function isExcludedParentalRightsDeprivationQuery(normalizedQuery: string) {
  const explicitDeprivationIntent = normalizedQuery.includes("родитель") && ["лишить", "лишен", "лишит", "лишение"].some((marker) => normalizedQuery.includes(marker));
  return !explicitDeprivationIntent || [
    "ограничить родитель",
    "ограничение родитель",
    "восстановить родитель",
    "восстановление родитель",
    "отмена ограничения",
    "отменить ограничение",
    "установить отцовств",
    "оспорить отцовств",
    "усынов",
    "удочер",
    "оформить опек",
    "порядок общения",
    "место жительства ребенка"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isParentalRightsDeprivationQuery(normalizedQuery: string) {
  if (isExcludedParentalRightsDeprivationQuery(normalizedQuery)) return false;
  return true;
}

function isParentalRightsRestrictionRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/ogranichenie-roditelskih-prav/") || [
    "/documents/ogranichenie-prav-po-nezavisyashchim-obstoyatelstvam/",
    "/documents/proverka-opasnogo-povedeniya-roditelya/",
    "/documents/isk-ob-ogranichenii-roditelskih-prav/"
  ].some((path) => href.includes(path));
}

function isExcludedParentalRightsRestrictionQuery(normalizedQuery: string) {
  const explicitRestrictionIntent = normalizedQuery.includes("родитель") && ["ограничить", "ограничение", "ограничен"].some((marker) => normalizedQuery.includes(marker));
  return !explicitRestrictionIntent || [
    "лишить родитель",
    "лишение родитель",
    "восстановить родитель",
    "восстановление родитель",
    "отмена ограничения",
    "отменить ограничение",
    "установить отцовств",
    "оспорить отцовств",
    "усынов",
    "удочер",
    "оформить опек",
    "порядок общения",
    "место жительства ребенка"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isParentalRightsRestrictionQuery(normalizedQuery: string) {
  return !isExcludedParentalRightsRestrictionQuery(normalizedQuery);
}

function isParentalRightsRestorationRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/vosstanovlenie-v-roditelskih-pravah/") || [
    "/documents/isk-o-vosstanovlenii-v-roditelskih-pravah/",
    "/documents/vosstanovlenie-roditelskih-prav-i-vozvrat-rebenka/",
    "/documents/proverka-prepyatstviy-k-vosstanovleniyu-roditelskih-prav/"
  ].some((path) => href.includes(path));
}

function isParentalRightsRestorationQuery(normalizedQuery: string) {
  return ["восстановить родитель", "восстановление родитель", "восстановить права и вернуть ребенка", "вернуть ребенка после лишения", "ребенок против восстановления", "ребенок усыновлен восстановление"].some((marker) => normalizedQuery.includes(marker));
}

function isParentalRightsRestrictionCancellationRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/otmena-ogranicheniya-roditelskih-prav/") || [
    "/documents/isk-ob-otmene-ogranicheniya-roditelskih-prav/",
    "/documents/otmena-ogranicheniya-roditelskih-prav-i-vozvrat-rebenka/",
    "/documents/proverka-usloviy-otmeny-ogranicheniya-roditelskih-prav/"
  ].some((path) => href.includes(path));
}

function isParentalRightsRestrictionCancellationQuery(normalizedQuery: string) {
  return ["отменить ограничение родитель", "отмена ограничения родитель", "снять ограничение родитель", "отменить ограничение и вернуть ребенка", "вернуть ребенка после ограничения", "основания ограничения отпали", "ребенок против отмены ограничения"].some((marker) => normalizedQuery.includes(marker));
}

function isParentalDisagreementsRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu/") || [
    "/documents/sovmestnoe-reshenie-roditeley-po-vospitaniyu-i-obrazovaniyu/",
    "/documents/obrashchenie-v-organ-opeki-po-raznoglasiyu-roditeley/",
    "/documents/sudebnyy-spor-po-vospitaniyu-i-obrazovaniyu-rebenka/"
  ].some((path) => href.includes(path));
}

function isParentalDisagreementsQuery(normalizedQuery: string) {
  const excluded = ["место жительства ребенка", "порядок общения", "график общения", "не дает видеться"].some((marker) => normalizedQuery.includes(marker));
  if (excluded) return false;
  return [
    "родители не согласны по школе",
    "соглашение родителей о выборе школы",
    "разногласия родителей по воспитанию",
    "разногласия родителей по образованию",
    "обратиться в опеку из за разногласия родителей",
    "суд разрешить вопрос воспитания ребенка"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isAdditionalChildExpensesRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/dopolnitelnye-rashody-na-rebenka/") || [
    "/documents/proverka-dopolnitelnyh-rashodov-na-rebenka/",
    "/documents/soglashenie-o-dopolnitelnyh-rashodah-na-rebenka/",
    "/documents/vzyskanie-ponesennyh-dopolnitelnyh-rashodov-na-rebenka/",
    "/documents/vzyskanie-budushchih-dopolnitelnyh-rashodov-na-rebenka/"
  ].some((path) => href.includes(path));
}

function isAdditionalChildExpensesQuery(normalizedQuery: string) {
  return [
    "дополнительные расходы на ребенка",
    "расходы на лечение ребенка сверх алиментов",
    "взыскать расходы на лечение ребенка",
    "вернуть половину расходов на ребенка",
    "соглашение о дополнительных расходах на ребенка",
    "будущие расходы на лечение ребенка",
    "расходы на реабилитацию ребенка в будущем"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isSpousalSupportRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/soderzhanie-supruga-i-byvshego-supruga/") || [
    "/documents/proverka-prava-na-soderzhanie-supruga/",
    "/documents/soglashenie-o-soderzhanii-supruga/",
    "/documents/isk-o-soderzhanii-supruga-v-brake/",
    "/documents/isk-o-soderzhanii-byvshego-supruga/"
  ].some((path) => href.includes(path));
}

function isSpousalSupportQuery(normalizedQuery: string) {
  const childOnly = ["на ребенка", "на ребёнка", "на сына", "на дочь"].some((marker) => normalizedQuery.includes(marker));
  if (childOnly) return false;
  return ["алименты жене", "алименты супруге", "алименты супругу", "алименты бывшей жене", "алименты на себя в браке"].some((marker) => normalizedQuery.includes(marker))
    || (normalizedQuery.includes("содержан") && normalizedQuery.includes("супруг"));
}

function isPrenuptialAgreementRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/brachnyy-dogovor/") || [
    "/documents/brachnyy-dogovor-do-braka/",
    "/documents/brachnyy-dogovor-v-brake/",
    "/documents/izmenenie-brachnogo-dogovora/",
    "/documents/rastorzhenie-brachnogo-dogovora/",
    "/documents/spor-o-brachnom-dogovore/"
  ].some((path) => href.includes(path));
}

function isPrenuptialAgreementQuery(normalizedQuery: string) {
  return normalizedQuery.includes("брачн") && normalizedQuery.includes("договор");
}

function isInvalidMarriageRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/priznanie-braka-nedeystvitelnym/") || [
    "/documents/isk-o-nedeystvitelnosti-braka-bez-soglasiya/",
    "/documents/isk-o-nedeystvitelnosti-braka-s-nesovershennoletnim/",
    "/documents/isk-o-nedeystvitelnosti-braka-pri-prepyatstvii/",
    "/documents/isk-o-fiktivnom-brake/",
    "/documents/isk-o-nedeystvitelnosti-braka-pri-sokrytii-zabolevaniya/"
  ].some((path) => href.includes(path));
}

function isInvalidMarriageQuery(normalizedQuery: string) {
  if (isPrenuptialAgreementQuery(normalizedQuery)) return false;
  return [
    "признать брак недействительным",
    "признание брака недействительным",
    "недействительность брака",
    "фиктивный брак",
    "брак заключен под принуждением",
    "брак с несовершеннолетним без разрешения",
    "второй брак не расторгнув первый",
    "скрыл вич при заключении брака",
    "скрыл венерическую болезнь"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isComplexMaritalPropertyRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/slozhnye-imushchestvennye-spory-suprugov/") || [
    "/documents/slozhnyy-spor-ob-obshchih-dolgah-suprugov/",
    "/documents/slozhnyy-spor-ob-ipotechnom-imushchestve-suprugov/",
    "/documents/slozhnyy-spor-o-biznes-aktivah-suprugov/",
    "/documents/slozhnyy-spor-s-pravami-tretih-lits-i-kompensatsiey/",
    "/documents/slozhnyy-spor-pri-bankrotstve-i-obespechitelnye-mery/"
  ].some((path) => href.includes(path));
}

function isComplexMaritalPropertyQuery(normalizedQuery: string) {
  return [
    "разделить общие долги супругов",
    "ипотека при разделе имущества",
    "раздел ипотечной квартиры",
    "раздел доли в ооо",
    "раздел бизнеса супругов",
    "имущество оформлено на третье лицо",
    "компенсация за проданное имущество супругов",
    "имущество супругов при банкротстве",
    "арест имущества при разделе супругов"
  ].some((marker) => normalizedQuery.includes(marker));
}

function isSurrogacyOriginRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka/") ||
    href.includes("/documents/surrogatnoe-materinstvo-list-dannyh/");
}

function isSurrogacyOriginQuery(normalizedQuery: string) {
  return ["суррогатн", "сурмам", "суррогатной матери на запись", "происхождение ребенка после эко"].some((marker) => normalizedQuery.includes(marker));
}

function isInternationalFamilyDisputesRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/mezhdunarodnye-semeynye-spory/") || href.includes("/documents/mezhdunarodnyy-semeynyy-spor-list-dannyh/");
}

function isInternationalFamilyDisputesQuery(normalizedQuery: string) {
  return ["международный семейный", "международные семейные", "ребенка увезли в другую страну", "ребенок находится в другой стране", "иностранное решение о ребенке", "алименты если отец за границей", "алименты за границей", "признать иностранное решение"].some((marker) => normalizedQuery.includes(marker));
}

function isPaternityEstablishmentRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/ustanovlenie-otcovstva/") || [
    "/documents/zayavlenie-ob-ustanovlenii-otcovstva/",
    "/documents/isk-ob-ustanovlenii-otcovstva/",
    "/documents/ustanovlenie-otcovstva-umershego/",
    "/documents/zapis-ob-otce-uzhe-sushchestvuet/",
    "/documents/ustanovlenie-otcovstva-i-drugoe-trebovanie/"
  ].some((path) => href.includes(path));
}

function isPaternityEstablishmentQuery(normalizedQuery: string) {
  const establishment = (normalizedQuery.includes("установ") && normalizedQuery.includes("отцовств")) || ["признание отцовств", "отцовство после смерти", "записать отца", "записан другой отец", "свидетельстве записан другой отец", "отцовство и алимент"].some((marker) => normalizedQuery.includes(marker));
  const excluded = ["оспорить отцовств", "оспаривание отцовств"].some((marker) => normalizedQuery.includes(marker));
  return establishment && !excluded;
}

function isPaternityContestRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/osparivanie-otcovstva/") || [
    "/documents/isk-ob-osparivanii-otcovstva-zapisannym-roditelem/",
    "/documents/isk-ob-osparivanii-zapisi-biologicheskim-roditelem/",
    "/documents/isk-ob-osparivanii-otcovstva-rebenkom-ili-opekunom/",
    "/documents/osparivanie-otcovstva-posle-smerti/"
  ].some((path) => href.includes(path));
}

function isPaternityContestQuery(normalizedQuery: string) {
  return ["оспорить отцовств", "оспаривание отцовств", "исключить запись об отце", "записан отцом но не отец", "биологический отец оспорить", "биологический отец хочет оспорить запись", "днк экспертиза отцовств", "днк экспертиза при оспаривании"].some((marker) => normalizedQuery.includes(marker));
}

function isAdoptionRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/usynovlenie-rebenka/") || [
    "/documents/usynovlenie-rebenka-suprugom-roditelya/",
    "/documents/chek-list-vnutrirossiyskogo-usynovleniya/",
    "/documents/soglasiya-pri-usynovlenii-rebenka/",
    "/documents/mezhdunarodnoe-usynovlenie-proverka/"
  ].some((path) => href.includes(path));
}

function isAdoptionQuery(normalizedQuery: string) {
  return ["усынов", "удочер", "стать усыновителем"].some((marker) => normalizedQuery.includes(marker));
}

function isChildTravelRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/vyezd-rebenka-za-granitsu/") || [
    "/documents/vyezd-rebenka-s-odnim-roditelem/",
    "/documents/soglasie-na-vyezd-rebenka-bez-roditeley/",
    "/documents/spor-o-vyezde-rebenka-za-granitsu/",
    "/documents/dokumenty-dlya-vyezda-rebenka-v-inostrannoe-gosudarstvo/"
  ].some((path) => href.includes(path));
}

function isChildTravelQuery(normalizedQuery: string) {
  return ["выезд ребенка", "ребенок едет за границу", "ребенок летит", "согласие на выезд ребенка", "несогласие на выезд ребенка", "запрет на выезд ребенка", "документы ребенку для въезда"].some((marker) => normalizedQuery.includes(marker));
}

function isChildNameRouteResult(href: string) {
  return href.includes("/problems/semya-i-deti/imya-familiya-otchestvo-rebenka/") || [
    "/documents/izmenenie-imeni-ili-familii-rebenka-do-14-let/",
    "/documents/izmenenie-familii-rebenka-pri-razdelnom-prozhivanii/",
    "/documents/peremena-imeni-rebenkom-ot-14-do-18-let/",
    "/documents/izmenenie-otchestva-rebenka-do-14-let/"
  ].some((path) => href.includes(path));
}

function isChildNameQuery(normalizedQuery: string) {
  return ["сменить имя ребенку", "сменить фамилию ребенку", "сменить имя подростк", "изменить отчество ребенку", "перемена имени несовершеннолет", "имя фамилия отчество ребенка"].some((marker) => normalizedQuery.includes(marker));
}

function directIntentBoost(result: SearchableResult, normalizedQuery: string) {
  const href = result.href;
  if (isInternationalFamilyDisputesQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/mezhdunarodnye-semeynye-spory/")) return 1740;
  if (isInternationalFamilyDisputesQuery(normalizedQuery) && isInternationalFamilyDisputesRouteResult(href)) return 1720;
  if (isSurrogacyOriginQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka/")) return 1700;
  if (isSurrogacyOriginQuery(normalizedQuery) && isSurrogacyOriginRouteResult(href)) return 1680;
  if (isComplexMaritalPropertyQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/slozhnye-imushchestvennye-spory-suprugov/")) return 1660;
  if (isComplexMaritalPropertyQuery(normalizedQuery) && isComplexMaritalPropertyRouteResult(href)) return 1640;
  if (isInvalidMarriageQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/priznanie-braka-nedeystvitelnym/")) return 1620;
  if (isInvalidMarriageQuery(normalizedQuery) && isInvalidMarriageRouteResult(href)) return 1600;
  if (isPrenuptialAgreementQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/brachnyy-dogovor/")) return 1580;
  if (isPrenuptialAgreementQuery(normalizedQuery) && isPrenuptialAgreementRouteResult(href)) return 1560;
  if (isSpousalSupportQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/soderzhanie-supruga-i-byvshego-supruga/")) return 1540;
  if (isSpousalSupportQuery(normalizedQuery) && isSpousalSupportRouteResult(href)) return 1520;
  if (isAdditionalChildExpensesQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/dopolnitelnye-rashody-na-rebenka/")) return 1500;
  if (isAdditionalChildExpensesQuery(normalizedQuery) && isAdditionalChildExpensesRouteResult(href)) return 1480;
  if (isParentalDisagreementsQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu/")) return 1460;
  if (isParentalDisagreementsQuery(normalizedQuery) && isParentalDisagreementsRouteResult(href)) return 1440;
  if (isParentalRightsRestrictionCancellationQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/otmena-ogranicheniya-roditelskih-prav/")) return 1420;
  if (isParentalRightsRestrictionCancellationQuery(normalizedQuery) && isParentalRightsRestrictionCancellationRouteResult(href)) return 1400;
  if (isParentalRightsRestorationQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/vosstanovlenie-v-roditelskih-pravah/")) return 1380;
  if (isParentalRightsRestorationQuery(normalizedQuery) && isParentalRightsRestorationRouteResult(href)) return 1360;
  if (isChildNameQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/imya-familiya-otchestvo-rebenka/")) return 1340;
  if (isChildNameQuery(normalizedQuery) && isChildNameRouteResult(href)) return 1320;
  if (isChildTravelQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/vyezd-rebenka-za-granitsu/")) return 1300;
  if (isChildTravelQuery(normalizedQuery) && isChildTravelRouteResult(href)) return 1280;
  if (isAdoptionQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/usynovlenie-rebenka/")) return 1260;
  if (isAdoptionQuery(normalizedQuery) && isAdoptionRouteResult(href)) return 1240;
  if (isPaternityContestQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/osparivanie-otcovstva/")) return 1220;
  if (isPaternityContestQuery(normalizedQuery) && isPaternityContestRouteResult(href)) return 1200;
  if (isPaternityEstablishmentQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/ustanovlenie-otcovstva/")) return 1180;
  if (isPaternityEstablishmentQuery(normalizedQuery) && isPaternityEstablishmentRouteResult(href)) return 1160;
  if (isParentalRightsRestrictionQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/ogranichenie-roditelskih-prav/")) return 1140;
  if (isParentalRightsRestrictionQuery(normalizedQuery) && isParentalRightsRestrictionRouteResult(href)) return 1120;
  if (isParentalRightsDeprivationQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/lishenie-roditelskih-prav/")) return 1100;
  if (isParentalRightsDeprivationQuery(normalizedQuery) && isParentalRightsDeprivationRouteResult(href)) return 1080;
  if (isChildSupportQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/alimenty-na-rebenka/")) return 1060;
  if (isChildSupportQuery(normalizedQuery) && isChildSupportRouteResult(href)) return 1040;
  if (isParentsChildQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/")) return 1020;
  if (isParentsChildQuery(normalizedQuery) && isParentsChildRouteResult(href)) return 1000;
  if (isChildGuardianshipQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/opeka-i-popechitelstvo-nad-rebenkom/")) return 1000;
  if (isChildGuardianshipQuery(normalizedQuery) && isGuardianshipRouteResult(href)) return 980;
  if (isZagsProcedureQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/brak-zags-i-smena-familii/")) return 990;
  if (isZagsProcedureQuery(normalizedQuery) && href.includes("/documents/zayavlenie-v-zags/")) return 970;
  return 0;
}

function stripSearchMeta(result: SearchableResult): SiteSearchResult {
  return {
    title: result.title,
    description: result.description,
    href: result.href,
    type: result.type,
    categoryLabel: result.categoryLabel,
    actionLabel: result.actionLabel,
    riskLevel: result.riskLevel,
    urgency: result.urgency,
    keywords: result.keywords
  };
}

function getCategoryTitle(slug: string) {
  return legalCategories.find((category) => category.slug === slug)?.title;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/ал[еи]м[еи]нт[а-я]*/g, "алименты")
    .replace(/пр[ие]ст[ао]в[а-я]*/g, "приставы")
    .replace(/п[ао]сп[ао]рт[а-я]*/g, "паспорт")
    .replace(/п[ао]тер[а-я]*/g, "потерял")
    .replace(/ут[еи]р[а-я]*/g, "утеря")
    .replace(/увол[еи]л+[а-я]*/g, "уволили")
    .replace(/с[ао]сед[а-я]*/g, "соседи")
    .replace(/п[оа]дпис[а-я]*/g, "подписка")
    .replace(/пов[еи]с?тк[а-я]*/g, "повестка")
    .replace(/разв[еи]ст[а-я]*/g, "развод")
    .replace(/\s+/g, " ")
    .trim();
}
