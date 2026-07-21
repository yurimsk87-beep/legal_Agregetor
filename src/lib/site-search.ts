import { legalCategories } from "@/data/legal-categories";
import { navigatorDocuments } from "@/data/documents";
import { legalPages } from "@/data/legal-pages";
import { legalProblems } from "@/data/legal-problems";
import type { LegalProblemRiskLevel, LegalProblemUrgency } from "@/data/legal-problems";
import { navigatorTools } from "@/data/tools";
import { getGeneratorMetaDescription, getGeneratorPageTitle } from "@/lib/document-seo";
import { isJudicialOrderDebtQuery, judicialOrderDebtRoute } from "@/lib/judicial-order-flow";
import type { Lawyer, Question } from "@/lib/types";

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
    description: "Каталог заявлений, жалоб, претензий, возражений и исков. Можно открыть образец заявления или заполнить документ онлайн.",
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
  "Судебный приказ",
  "Списали деньги с карты",
  "Не выплатили зарплату",
  "Алименты",
  "Затопили соседи",
  "Долги у приставов",
  "Развод",
  "Наследство",
  "Увольнение",
  "ЖКХ",
  "Возврат товара",
  "Штраф",
  "Кредит"
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

// Паспорт РФ (утеря/восстановление/замена) — отдельной ситуации в базе знаний нет.
// Такие запросы НЕ должны уводить в загранпаспорт/архивные/миграционные документы.
const passportWrongHrefs = ["/zagranpasport/", "/arhivnye-dokumenty/", "/poteryali-migracionnye-dokumenty/"];

function isPassportLossQuery(normalizedQuery: string) {
  return (
    normalizedQuery.includes("паспорт") &&
    /(потер|утер|украл|восстанов|замен|пропал)/.test(normalizedQuery) &&
    !normalizedQuery.includes("загран")
  );
}

export function isPassportRestoreIntent(query: string) {
  return isPassportLossQuery(normalizeSearchText(query));
}

// Алиментные запросы (неуплата/взыскание/долг/приставы) не должны уходить в лишение
// родительских прав — только при явном «лишить/лишение».
function isAlimonyPaymentQuery(normalizedQuery: string) {
  return normalizedQuery.includes("алимент") && !normalizedQuery.includes("лиш");
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
    ...legalCategories.map((category) => ({
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
        description: "Шаблон документа, который можно подготовить и проверить перед отправкой.",
        href: `/documents/${document.slug}/`,
        type: "document" as const,
        categoryLabel: `Документ: ${document.category}`,
        actionLabel: "Скачать документ",
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
  if (href.includes("/rabota-zarplata-i-trudovye-prava/")) return "employment";
  if (href.includes("/semya-i-deti/")) return "family";
  if (href.includes("/zhile-nedvizhimost-i-zemlya/") || href.includes("/zhkh-i-kommunalnye-uslugi/")) return "housing";
  if (href.includes("/pokupki-uslugi-i-zashchita-potrebiteley/")) return "consumer";
  if (href.includes("/nasledstvo/")) return "inheritance";
  if (href.includes("/dokumenty-personalnye-dannye-i-gosuslugi/")) return "documents";
  if (href.includes("/dolgi-kredity-i-pristavy/") || href.includes("/sud-zhaloby-i-zashchita-prav/")) return "debtCourt";
  return "other";
}

function categorySlugToDomain(categorySlug: string): SearchDomain {
  if (categorySlug === "rabota-zarplata-i-trudovye-prava") return "employment";
  if (categorySlug === "semya-i-deti") return "family";
  if (categorySlug === "zhile-nedvizhimost-i-zemlya" || categorySlug === "zhkh-i-kommunalnye-uslugi") return "housing";
  if (categorySlug === "pokupki-uslugi-i-zashchita-potrebiteley") return "consumer";
  if (categorySlug === "nasledstvo") return "inheritance";
  if (categorySlug === "dokumenty-personalnye-dannye-i-gosuslugi") return "documents";
  if (categorySlug === "dolgi-kredity-i-pristavy" || categorySlug === "sud-zhaloby-i-zashchita-prav") return "debtCourt";
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

  // Паспорт РФ: исключаем нерелевантные документы (загран/архив/миграция) — даже при
  // точном текстовом совпадении, иначе «потерял паспорт» уводит в архивные документы.
  if (isPassportLossQuery(normalizedQuery) && passportWrongHrefs.some((needle) => result.href.includes(needle))) return true;
  // Алименты без явного «лишить»: исключаем лишение/ограничение родительских прав.
  if (isAlimonyPaymentQuery(normalizedQuery) && result.href.includes("/lishenie")) return true;
  // Судебная и военная повестки используют одно слово, но требуют разных маршрутов.
  if (normalizedQuery.includes("повестка") && normalizedQuery.includes("суд") && result.href.includes("/voennaya-sluzhba-")) return true;
  if (
    normalizedQuery.includes("повестка") &&
    /(военком|военн|мобилизац|армия)/.test(normalizedQuery) &&
    result.href.includes("/sud-zhaloby-i-zashchita-prav/")
  ) {
    return true;
  }

  // Точное совпадение названия — сильный прямой сигнал, домен-конфликт не применяем.
  if (result.normalizedTitle === normalizedQuery) return false;

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

function directIntentBoost(result: SearchableResult, normalizedQuery: string) {
  const href = result.href;
  if (isJudicialOrderDebtQuery(normalizedQuery) && href === judicialOrderDebtRoute.canonicalUrl) return 1100;
  if (normalizedQuery.includes("уволили") && normalizedQuery.includes("без причины") && href.includes("/nezakonno-uvolili/")) return 980;
  if (normalizedQuery.includes("выселя") && normalizedQuery.includes("квартир") && href.includes("/vyselenie-iz-kvartiry/")) return 980;
  if (normalizedQuery.includes("соседи") && normalizedQuery.includes("шум") && href.includes("/shumnye-sosedi/")) return 980;
  if (normalizedQuery.includes("доля") && normalizedQuery.includes("квартир") && href.includes("/spor-o-dole-v-kvartire/")) return 980;
  if (normalizedQuery.includes("ремонт") && normalizedQuery.includes("квартир") && href.includes("/nekachestvennaya-usluga/")) return 960;
  if (normalizedQuery.includes("магазин") && normalizedQuery.includes("гарант") && href.includes("/tovar-slomalsya-na-garantii/")) return 980;
  if (normalizedQuery.includes("умер") && normalizedQuery.includes("родственник") && href.includes("/vstuplenie-v-nasledstvo/")) return 980;
  // Алименты (неуплата/задолженность/взыскание/приставы/исполнительный лист) ведут на
  // взыскание алиментов, а не на лишение родительских прав. Лишение — только при явном
  // «лишить/лишение» (см. isConflictingResult: для алиментных запросов lishenie исключается).
  if (normalizedQuery.includes("алимент") && !normalizedQuery.includes("лиш") && href.includes("/semya-i-deti/alimenty/")) return 980;
  if (isZagsProcedureQuery(normalizedQuery) && href.includes("/problems/semya-i-deti/brak-zags-i-smena-familii/")) return 990;
  if (isZagsProcedureQuery(normalizedQuery) && href.includes("/documents/zayavlenie-v-zags/")) return 970;
  // Развод/расторжение брака ведут на развод, а не на смежные семейные темы (алименты).
  if ((normalizedQuery.includes("развод") || normalizedQuery.includes("расторжен")) && !normalizedQuery.includes("алимент") && href.includes("/semya-i-deti/razvod/")) return 980;
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
