import { NextResponse } from "next/server";
import {
  enrichNavigatorResponseWithLLM,
  filterRepeatedClarifyingQuestions,
  type ClarificationAnswer,
  type DialogStatus,
  type NavigatorLegalReference,
  type NavigatorResponse,
  type NavigatorResult
} from "@/lib/ai/navigator-llm";
import {
  groupSearchResults,
  isPassportRestoreIntent,
  isUrgentSearch,
  searchSite,
  type SiteSearchResult
} from "@/lib/site-search";
import { maybeFixKeyboardLayout } from "@/lib/keyboard-layout";
import { getLegalProblem } from "@/data/legal-problems";
import { getNavigatorDocument } from "@/data/documents";
import { getLegalReferences } from "@/data/legal-references";
import { getJudicialOrderCheckHref, isJudicialOrderDebtQuery, judicialOrderDebtRoute } from "@/lib/judicial-order-flow";

// AI-ready навигатор поверх умного поиска. Структура результатов детерминирована тем
// же поиском, что и /api/search-suggestions/, но собирается в процессе (без HTTP-хопа
// через прокси). Опциональный LLM-слой (по env) улучшает только текстовые поля
// summary/steps/clarifyingQuestions — см. lib/ai/navigator-llm.ts.

export const dynamic = "force-dynamic";

const MIN_QUERY_LENGTH = 2;
const MAX_CLARIFICATION_STEPS = 3;
const MAX_CLARIFICATION_ANSWERS = 12;
const MAX_CLARIFICATION_QUESTION_LENGTH = 300;
const MAX_CLARIFICATION_ANSWER_LENGTH = 500;
const DISCLAIMER = "Это предварительная правовая ориентация, а не юридическое заключение.";
const SEARCH_SECTION_TYPES = ["situation", "instruction", "document"] as const;

const NO_PRIMARY_STEPS = [
  "Уточните проблему несколькими словами.",
  "Укажите, кто именно совершил действие: банк, пристав, работодатель, суд или другая сторона.",
  "Добавьте, когда вы узнали о проблеме."
];

function buildSteps(primary: NavigatorResult | null): string[] {
  if (!primary) return NO_PRIMARY_STEPS;
  if (primary.riskLevel === "high" || primary.urgency === "few_days") {
    return [
      "Проверьте документы и основание проблемы.",
      "Обратите внимание на сроки — ситуация может быть срочной.",
      "Откройте подходящую инструкцию на ПравоПоиске.",
      "Если есть документы, подготовьте их для проверки или обращения к юристу."
    ];
  }
  return [
    "Откройте подходящую ситуацию или инструкцию.",
    "Проверьте, какие документы могут понадобиться.",
    "Сравните вашу ситуацию с похожими вопросами пользователей.",
    "При необходимости обратитесь к юристу."
  ];
}

// Ставит выбранную LLM страницу первой в её секции, чтобы пользователь увидел
// именно её как основную ссылку. Работает только для контентных типов.
function promoteChosenResult(
  sections: NavigatorResponse["sections"],
  chosen: NavigatorResult
): NavigatorResponse["sections"] {
  const key =
    chosen.type === "situation"
      ? "situations"
      : chosen.type === "instruction"
        ? "instructions"
        : chosen.type === "document"
          ? "documents"
          : null;
  if (!key) return sections;
  const current = sections[key];
  if (current[0]?.href === chosen.href) return sections;
  return { ...sections, [key]: [chosen, ...current.filter((item) => item.href !== chosen.href)] };
}

// Реальные нормы закона выбранной страницы (ситуации или документа) со ссылками
// на consultant.ru. Берём из данных сайта — LLM статьи не выдумывает.
function getLegalReferencesForHref(href: string | null | undefined): NavigatorLegalReference[] {
  if (!href) return [];
  let keys: readonly string[] | undefined;
  const problemMatch = href.match(/^\/problems\/([^/]+)\/([^/]+)\/?$/);
  if (problemMatch) {
    keys = getLegalProblem(problemMatch[1], problemMatch[2])?.legalReferenceKeys;
  } else {
    const documentMatch = href.match(/^\/documents\/([^/]+)\/?$/);
    if (documentMatch) keys = getNavigatorDocument(documentMatch[1])?.legalReferenceKeys;
  }
  return getLegalReferences(keys)
    .filter((reference) => Boolean(reference.url))
    .slice(0, 4)
    .map((reference) => ({ code: reference.code, article: reference.article, title: reference.title, url: reference.url! }));
}

type IntentContent = { summary: string; steps: string[] };

function buildIntentContent(query: string, primary: NavigatorResult | null): IntentContent | null {
  const q = query.toLowerCase().replace(/ё/g, "е");
  const href = primary?.href ?? "";
  if (isJudicialOrderDebtQuery(q) || href === judicialOrderDebtRoute.canonicalUrl) {
    return {
      summary: "Похоже, вы получили судебный приказ по банковскому долгу, кредиту или займу. Сначала важно проверить дату получения, срок на возражения и есть ли уже приставы или списания.",
      steps: [
        "Проверьте, что документ действительно называется «судебный приказ».",
        "Зафиксируйте дату получения копии приказа: от неё обычно считается десятидневный срок.",
        "Если срок предварительно не пропущен, подготовьте возражение на судебный приказ и подайте его в суд, который вынес приказ."
      ]
    };
  }

  if (q.includes("алимент") || q.includes("алемент") || href.includes("/alimenty/")) {
    return {
      summary: "Похоже, алименты не платят или уже образовалась задолженность. Сначала нужно проверить основание взыскания и понять, передан ли исполнительный документ приставам или работодателю.",
      steps: [
        "Проверьте, есть ли соглашение, судебный приказ, решение суда или исполнительный лист.",
        "Зафиксируйте период, за который алименты не поступали.",
        "Если исполнительный документ ещё не передан, подготовьте его для обращения к приставам или работодателю плательщика."
      ]
    };
  }
  if (/(п[ао]тер|утер|украл|восстанов|замен).*(п[ао]спорт)/.test(q)) {
    return {
      summary: "Похоже, нужно восстановить утраченный паспорт. Важно уточнить, потерян он или украден, и собрать документы, которые подтвердят личность.",
      steps: [
        "Уточните, паспорт потерян, украден или повреждён.",
        "Подготовьте копию паспорта или другие документы, подтверждающие личность, если они сохранились.",
        "Откройте раздел о личных документах и выберите порядок восстановления паспорта."
      ]
    };
  }
  if ((/(пристав|престав|арест)/.test(q) && /(карт|счет)/.test(q)) || href.includes("arestovali")) {
    return {
      summary: "Похоже, приставы арестовали карту или счёт. Нужно проверить исполнительное производство, назначение счёта и были ли списаны защищённые выплаты.",
      steps: [
        "Найдите номер исполнительного производства и постановление пристава.",
        "Получите выписку банка и подтвердите, какие деньги поступают на арестованный счёт.",
        "Подготовьте обращение приставу, если нужно снять ограничение или сохранить защищённые выплаты."
      ]
    };
  }
  if (q.includes("увол") || href.includes("nezakonno-uvolili")) {
    return {
      summary: "Похоже, вы оспариваете увольнение. Для следующего шага важны дата увольнения, основание в приказе и документы, которые вы подписывали.",
      steps: [
        "Получите копию приказа об увольнении и сведения из трудовой книжки.",
        "Зафиксируйте дату получения приказа и указанное работодателем основание.",
        "Сопоставьте документы с маршрутом по незаконному увольнению и не откладывайте проверку сроков."
      ]
    };
  }
  if (q.includes("наслед") || href.includes("vstuplenie-v-nasledstvo")) {
    return {
      summary: "Похоже, вопрос связан со вступлением в наследство. Важно проверить дату смерти, наличие завещания и обращение к нотариусу.",
      steps: [
        "Уточните дату смерти наследодателя и не пропущен ли шестимесячный срок.",
        "Соберите документы о родстве, имуществе и завещании, если оно есть.",
        "Обратитесь к нотариусу или проверьте статус уже открытого наследственного дела."
      ]
    };
  }
  if ((q.includes("сосед") || q.includes("сасед")) && (q.includes("шум") || href.includes("sosed"))) {
    return {
      summary: "Похоже, соседи регулярно шумят и мешают ночью. Сначала стоит зафиксировать время и повторяемость шума, затем выбрать подходящий способ обращения.",
      steps: [
        "Записывайте даты, время и характер шума.",
        "Сохраните записи, показания свидетелей и другие подтверждения.",
        "В зависимости от ситуации обратитесь к соседям, в полицию или управляющую организацию."
      ]
    };
  }
  if (q.includes("подпис") || q.includes("падпис") || href.includes("vernut-dengi")) {
    return {
      summary: "Похоже, сервис списал деньги за подписку. Нужно отменить дальнейшие списания, сохранить подтверждения и проверить основание для возврата.",
      steps: [
        "Отключите подписку и сохраните подтверждение отмены.",
        "Соберите чек, выписку, условия подписки и переписку с сервисом.",
        "Направьте письменное требование о возврате, если списание было ошибочным или услуга не оказана."
      ]
    };
  }
  if ((q.includes("банк") && q.includes("суд")) || href.includes("bank-podal-v-sud")) {
    return {
      summary: "Похоже, банк обратился в суд из-за долга. Сначала нужно определить вид судебного документа и проверить указанный в нём срок ответа.",
      steps: [
        "Уточните, получен иск, судебный приказ, повестка или другое уведомление.",
        "Проверьте дату получения, заседания и срок для возражений или ответа.",
        "Соберите кредитный договор, расчёт долга, платежи и переписку с банком."
      ]
    };
  }
  if (q.includes("повест") || q.includes("повес") || href.includes("prishla-povestka")) {
    return {
      summary: "Похоже, вы получили повестку. Важно проверить, кем она выдана, куда и к какой дате требуется явиться.",
      steps: [
        "Проверьте орган, причину вызова, дату и способ вручения повестки.",
        "Не игнорируйте указанный срок и подготовьте документы по ситуации.",
        "Откройте подходящий маршрут или обратитесь к юристу, если содержание повестки непонятно."
      ]
    };
  }
  if (q.includes("развод") || q.includes("развест") || href.endsWith("/razvod/")) {
    return {
      summary: "Похоже, нужно оформить развод. Порядок зависит от наличия общих несовершеннолетних детей, согласия второго супруга и споров об имуществе.",
      steps: [
        "Уточните, есть ли общие несовершеннолетние дети и согласие обоих супругов.",
        "Определите, есть ли спор о детях, алиментах или разделе имущества.",
        "После этого выберите оформление через ЗАГС или обращение в суд и подготовьте документы."
      ]
    };
  }
  return null;
}

// Доменные наборы уточняющих вопросов — используются как детерминированный
// fallback (LLM выключена/упала) и как ориентир для LLM. Каждый набор предметный
// под тему, без общих вопросов вроде «Когда произошла ситуация?».
type ClarificationDomain = "employment" | "debt" | "consumer" | "family" | "housing" | "inheritance" | "documents";

const DOMAIN_CLARIFICATIONS: Record<ClarificationDomain, string[]> = {
  employment: [
    "Когда вас уволили или сообщили об увольнении?",
    "Какое основание указано в приказе или трудовой книжке?",
    "Вы подписывали заявление по собственному желанию или соглашение сторон?",
    "Получили ли вы расчёт и копию приказа?"
  ],
  debt: [
    "Вы знаете номер исполнительного производства?",
    "Когда вы узнали о списании или аресте?",
    "С какого счёта списали деньги: зарплата, пенсия, пособие или обычная карта?",
    "Получали ли вы судебный приказ, решение суда или постановление пристава?"
  ],
  consumer: [
    "Когда вы купили товар или заказали услугу?",
    "Есть ли чек, договор, переписка или подтверждение оплаты?",
    "Что именно ответил продавец или исполнитель?",
    "Вы уже подавали письменную претензию?"
  ],
  family: [
    "Есть ли уже решение суда, соглашение или исполнительный лист?",
    "Сколько лет ребёнку, если вопрос связан с детьми или алиментами?",
    "Пытались ли вы договориться письменно или через суд?",
    "Какая цель сейчас: взыскать, изменить порядок, оспорить или оформить?"
  ],
  housing: [
    "Вы собственник, наниматель или зарегистрированы в жилье?",
    "Есть ли акт, уведомление, договор или переписка по ситуации?",
    "Когда возникла проблема и обращались ли вы в УК, суд или к соседям?",
    "Что нужно сделать: устранить нарушение, взыскать деньги, выписать человека или защититься от выселения?"
  ],
  inheritance: [
    "Когда умер наследодатель?",
    "Обращались ли вы к нотариусу и есть ли наследственное дело?",
    "Есть ли завещание или наследование идёт по закону?",
    "Пропущен ли шестимесячный срок принятия наследства?"
  ],
  documents: [
    "Какой документ нужно восстановить или оформить?",
    "Когда и где он был выдан или утрачен?",
    "Есть ли копия, фото, номер или подтверждение обращения?",
    "Для чего нужен документ сейчас: суд, сделка, госуслуга или работа?"
  ]
};

const GENERIC_CLARIFICATIONS = [
  "Когда произошла ситуация и есть ли важный срок?",
  "Какой документ вы получили или какой нужно подготовить?",
  "Кто вторая сторона: банк, пристав, работодатель, продавец, суд или другая?"
];

const CLARIFICATION_DOMAIN_BY_CATEGORY: Array<[string, ClarificationDomain]> = [
  ["/rabota-zarplata-i-trudovye-prava/", "employment"],
  ["/semya-i-deti/", "family"],
  ["/zhile-nedvizhimost-i-zemlya/", "housing"],
  ["/zhkh-i-kommunalnye-uslugi/", "housing"],
  ["/pokupki-uslugi-i-zashchita-potrebiteley/", "consumer"],
  ["/nasledstvo/", "inheritance"],
  ["/dokumenty-personalnye-dannye-i-gosuslugi/", "documents"],
  ["/dolgi-kredity-i-pristavy/", "debt"],
  ["/sud-zhaloby-i-zashchita-prav/", "debt"]
];

function getClarificationDomain(query: string, primary: NavigatorResult | null): ClarificationDomain | null {
  const href = primary?.href ?? "";
  for (const [needle, domain] of CLARIFICATION_DOMAIN_BY_CATEGORY) {
    if (href.includes(needle)) return domain;
  }
  const q = query.toLowerCase().replace(/ё/g, "е");
  if (/(увол|работодател|зарплат|трудов|больничн|сокращ|не оформили)/.test(q)) return "employment";
  if (/(пристав|списал|арест|коллектор|кредит|долг|взыскан|судебный приказ|исполнительн)/.test(q)) return "debt";
  if (/(магазин|товар|гарант|услуг|возврат|заказ|доставк|продавец|претензи|подписк)/.test(q)) return "consumer";
  if (/(развод|брак|алимент|супруг|опек|усыновл|родительск|раздел имущества|место жительства ребен)/.test(q)) return "family";
  if (/(квартир|жил|выселя|сосед|затопил|управляющ|застройщик|недвижим|доля|крыш)/.test(q)) return "housing";
  if (/(наследств|завещан|нотариус|умер|умерла|наследник)/.test(q)) return "inheritance";
  if (/(паспорт|снилс|госуслуг)/.test(q)) return "documents";
  return null;
}

function buildClarifyingQuestions(query: string, primary: NavigatorResult | null): string[] {
  const q = query.toLowerCase().replace(/ё/g, "е");
  const href = primary?.href ?? "";
  if (isJudicialOrderDebtQuery(q) || href === judicialOrderDebtRoute.canonicalUrl) {
    return [
      "Когда вы получили копию судебного приказа и каким способом?",
      "Кто взыскатель: банк, МФО, коллектор или другая организация?",
      "Исполнительное производство уже началось или деньги ещё не списывали?"
    ];
  }
  if (q.includes("алимент") || q.includes("алемент") || href.includes("/alimenty/")) {
    return [
      "Есть ли уже соглашение, судебный приказ, решение суда или исполнительный лист по алиментам?",
      "С какого месяца алименты не платят или платят не полностью?",
      "Исполнительный документ уже передавали приставам или работодателю плательщика?"
    ];
  }
  if (/(п[ао]тер|утер|украл|восстанов|замен).*(п[ао]спорт)/.test(q) || href.includes("dokumenty-personalnye-dannye")) {
    return [
      "Паспорт потерян, украден или его нужно заменить по другой причине?",
      "Когда и где вы обнаружили пропажу или повреждение паспорта?",
      "Есть ли у вас копия паспорта или другой документ, удостоверяющий личность?"
    ];
  }
  if ((/(пристав|престав|арест)/.test(q) && /(карт|счет)/.test(q)) || href.includes("arestovali")) {
    return [
      "Какой счёт или карту арестовали: зарплатную, социальную или обычную?",
      "Есть ли номер исполнительного производства или постановление пристава?",
      "Когда вы узнали об аресте и списывались ли уже деньги?"
    ];
  }
  if (q.includes("увол") || href.includes("nezakonno-uvolili")) {
    return [
      "Когда вас уволили и получили ли вы копию приказа?",
      "Какое основание увольнения указано в приказе или трудовой книжке?",
      "Подписывали ли вы заявление по собственному желанию или соглашение сторон?"
    ];
  }
  if (q.includes("наслед") || href.includes("vstuplenie-v-nasledstvo")) {
    return [
      "Когда умер наследодатель?",
      "Обращались ли вы к нотариусу и открыто ли наследственное дело?",
      "Есть ли завещание или документы, подтверждающие родство?"
    ];
  }
  if ((q.includes("сосед") || q.includes("сасед")) && (q.includes("шум") || href.includes("sosed"))) {
    return [
      "Какой именно шум мешает и в какое время он обычно происходит?",
      "Шум повторяется регулярно и есть ли записи, свидетели или другие подтверждения?",
      "Обращались ли вы уже к соседям, в полицию или управляющую организацию?"
    ];
  }
  if (q.includes("подпис") || q.includes("падпис") || href.includes("vernut-dengi")) {
    return [
      "Какой сервис списал деньги, когда и какую сумму?",
      "Вы подключали пробный период или подтверждали платную подписку?",
      "Подписку уже отменили и обращались ли за возвратом денег?"
    ];
  }
  if ((q.includes("банк") && q.includes("суд")) || href.includes("bank-podal-v-sud")) {
    return [
      "Какой документ вы получили: иск, судебный приказ, повестку или уведомление банка?",
      "Когда вы получили документ и какая дата заседания или срок ответа указаны?",
      "По какому кредиту возник спор и какая сумма долга заявлена банком?"
    ];
  }
  if (q.includes("повест") || q.includes("повес") || href.includes("prishla-povestka")) {
    return [
      "Как вам вручили повестку: лично, по почте или другим способом?",
      "Какая дата явки указана в повестке?",
      "Какая причина вызова и куда именно нужно явиться?"
    ];
  }
  if (q.includes("развод") || q.includes("развест") || href.endsWith("/razvod/")) {
    return [
      "Есть ли у супругов общие несовершеннолетние дети?",
      "Согласен ли второй супруг на развод?",
      "Есть ли спор о детях или разделе совместного имущества?"
    ];
  }
  const domain = getClarificationDomain(query, primary);
  return domain ? DOMAIN_CLARIFICATIONS[domain] : GENERIC_CLARIFICATIONS;
}

function pickResult(r: SiteSearchResult): NavigatorResult {
  return {
    title: r.title,
    description: r.description,
    href: r.href,
    type: r.type,
    categoryLabel: r.categoryLabel,
    actionLabel: r.actionLabel,
    riskLevel: r.riskLevel ?? null,
    urgency: r.urgency ?? null
  };
}

function emptySections(): NavigatorResponse["sections"] {
  return { situations: [], instructions: [], documents: [], questions: [], lawyers: [] };
}

const SPECIALIZATION_RULES: Array<{ pattern: RegExp; slug: string; label: string }> = [
  { pattern: /(алимент|развод|брак|супруг|ребен)/, slug: "semeynye-spory", label: "Семейные споры" },
  { pattern: /(наслед|завещ|нотариус)/, slug: "nasledstvo", label: "Наследство" },
  { pattern: /(увол|работодател|зарплат|трудов)/, slug: "trudovye-spory", label: "Трудовые споры" },
  { pattern: /(пристав|арест|исполнительн)/, slug: "ispolnitelnoe-proizvodstvo", label: "Исполнительное производство" },
  { pattern: /(банк|кредит|долг|коллектор)/, slug: "kredity-dolgi", label: "Кредиты и долги" },
  { pattern: /(сосед|жкх|коммунал|управляющ)/, slug: "zhilishchnye-spory", label: "Жилищные споры" },
  { pattern: /(квартир|недвижим|застройщик|доля)/, slug: "nedvizhimost", label: "Недвижимость" },
  { pattern: /(товар|услуг|магазин|продавец|подписк)/, slug: "zashchita-prav-potrebiteley", label: "Защита прав потребителей" },
  { pattern: /(повест|воен|мобилиз|военком)/, slug: "voennoe-pravo", label: "Военное право" },
  { pattern: /(суд|иск|приказ)/, slug: "predstavitelstvo-v-sude", label: "Судебные споры" }
];

function getSpecialization(query: string) {
  const normalized = query.toLowerCase().replace(/ё/g, "е");
  return SPECIALIZATION_RULES.find((rule) => rule.pattern.test(normalized)) ?? null;
}

function buildSupportSections(query: string): Pick<NavigatorResponse["sections"], "questions" | "lawyers"> {
  const specialization = getSpecialization(query);
  const categoryParam = specialization ? `&category=${encodeURIComponent(specialization.slug)}` : "";
  return {
    questions: [
      {
        title: specialization ? `Похожие вопросы: ${specialization.label}` : "Похожие вопросы пользователей",
        description: "Ответы юристов по близким ситуациям.",
        href: `/questions/?q=${encodeURIComponent(query)}${categoryParam}`,
        type: "question",
        categoryLabel: "Вопросы и ответы",
        actionLabel: "Посмотреть вопросы",
        riskLevel: null,
        urgency: null
      }
    ],
    lawyers: [
      {
        title: specialization ? `Задать вопрос юристу: ${specialization.label}` : "Задать вопрос юристу",
        description: "Передайте описание и документы специалисту, если нужен индивидуальный разбор.",
        href: `/questions/?q=${encodeURIComponent(query)}${categoryParam}#question`,
        type: "lawyer",
        categoryLabel: "Юристы",
        actionLabel: "Задать вопрос",
        riskLevel: null,
        urgency: null
      }
    ]
  };
}

function normalizeClarificationAnswers(raw: unknown): ClarificationAnswer[] {
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, MAX_CLARIFICATION_ANSWERS).flatMap((item): ClarificationAnswer[] => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const question = typeof record.question === "string" ? record.question.trim().slice(0, MAX_CLARIFICATION_QUESTION_LENGTH) : "";
    const answer =
      typeof record.answer === "string"
        ? maybeFixKeyboardLayout(record.answer.trim()).slice(0, MAX_CLARIFICATION_ANSWER_LENGTH)
        : "";
    if (!question || !answer) return [];
    return [{ question, answer }];
  });
}

function clarifyResponse(query: string, clarificationApplied = false): NavigatorResponse {
  return {
    query,
    mode: "navigator",
    urgent: false,
    confidence: "low",
    summary: "Опишите проблему хотя бы несколькими словами — так навигатор сможет подобрать решение.",
    riskLevel: null,
    urgency: null,
    primaryAction: null,
    steps: NO_PRIMARY_STEPS,
    sections: emptySections(),
    clarifyingQuestions: buildClarifyingQuestions(query, null),
    clarificationApplied,
    dialogStatus: "low_confidence",
    clarificationStep: 0,
    maxClarificationSteps: MAX_CLARIFICATION_STEPS,
    canContinue: false,
    disclaimer: DISCLAIMER
  };
}

function getClarificationStep(raw: unknown, answerCount: number): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return Math.min(answerCount, MAX_CLARIFICATION_STEPS);
  return Math.max(0, Math.min(MAX_CLARIFICATION_STEPS, Math.trunc(raw)));
}

function resolveDialogStatus(params: {
  confidence: NavigatorResponse["confidence"];
  questions: string[];
  clarificationStep: number;
  completed: boolean;
}): DialogStatus {
  if (params.completed) return "completed";
  if (params.clarificationStep >= MAX_CLARIFICATION_STEPS) return "max_steps_reached";
  return params.questions.length === 1 ? "active" : "low_confidence";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY", message: "Тело запроса должно быть корректным JSON." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "INVALID_BODY", message: "Тело запроса должно быть JSON-объектом." }, { status: 400 });
  }

  const rawQuery = (body as { query?: unknown }).query;
  // Чиним раскладку, если запрос набран латиницей по ошибке (edjkbkb -> уволили).
  // Дальше и поиск маршрута, и LLM работают уже с исправленным русским текстом.
  const query = maybeFixKeyboardLayout(typeof rawQuery === "string" ? rawQuery.trim() : "");
  const clarificationAnswers = normalizeClarificationAnswers((body as { clarificationAnswers?: unknown }).clarificationAnswers);
  const clarificationApplied = clarificationAnswers.length > 0;
  const clarificationStep = getClarificationStep(
    (body as { clarificationStep?: unknown }).clarificationStep,
    clarificationAnswers.length
  );
  const dialogCompleted = (body as { dialogCompleted?: unknown }).dialogCompleted === true;
  // Быстрый детерминированный режим (?fast=1): пропускаем медленный LLM-слой, чтобы
  // мгновенно отдать маршрут для dropdown; LLM-улучшение клиент догружает отдельным
  // запросом без ?fast. Контракт тела запроса не меняется.
  const fast = new URL(request.url).searchParams.get("fast") === "1";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(clarifyResponse(query, clarificationApplied), { headers: { "Cache-Control": "no-store" } });
  }

  const passportRestoreIntent = isPassportRestoreIntent(query);

  // Первый ответ строится только по локальному индексу сайта. Запросы к БД вопросов
  // и профилей здесь создавали задержку на каждом вводе и дублировались LLM-веткой.
  const results = searchSite(query, 50);
  const searchUrgent = isUrgentSearch(query, results);
  const groups = groupSearchResults(query, results, { limitPerGroup: 1, types: [...SEARCH_SECTION_TYPES] });
  const byType = (type: string): NavigatorResult[] => (groups.find((g) => g.type === type)?.results ?? []).map(pickResult);
  const supportSections = buildSupportSections(query);
  const normalizedQuery = query.toLowerCase().replace(/ё/g, "е");
  const alimonyNonPaymentIntent =
    /(алимент|алемент)/.test(normalizedQuery) && /(не плат|долг|задолж|пристав|исполнитель)/.test(normalizedQuery);
  const subscriptionIntent = /(подпис|падпис)/.test(normalizedQuery);
  const keepRelevantMaterial = (item: NavigatorResult) =>
    !subscriptionIntent || /(подпис|автоплат|сервис)/.test(`${item.title} ${item.description ?? ""}`.toLowerCase());
  const documentResults = byType("document").filter(
    (item) =>
      !alimonyNonPaymentIntent ||
      /(пристав|задолж|исполнитель)/.test(`${item.title} ${item.description ?? ""}`.toLowerCase())
  );
  const sections: NavigatorResponse["sections"] = {
    situations: passportRestoreIntent ? [] : byType("situation").filter(keepRelevantMaterial),
    instructions: passportRestoreIntent ? [] : byType("instruction").filter(keepRelevantMaterial),
    documents: passportRestoreIntent
      ? [
          {
            title: "Документы, персональные данные и госуслуги",
            description: "Раздел о восстановлении, замене и оформлении личных документов.",
            href: "/problems/dokumenty-personalnye-dannye-i-gosuslugi/",
            type: "document",
            categoryLabel: "Документы и госуслуги",
            actionLabel: "Открыть раздел",
            riskLevel: null,
            urgency: null
          }
        ]
      : documentResults.filter(keepRelevantMaterial),
    questions: supportSections.questions,
    lawyers: supportSections.lawyers
  };
  if (isJudicialOrderDebtQuery(query)) {
    const judicialOrderResult: NavigatorResult = {
      title: "Пришёл судебный приказ по долгу",
      description: "Проверьте срок, риски и подготовьте возражение на судебный приказ по кредиту, займу, банку или МФО.",
      href: judicialOrderDebtRoute.canonicalUrl,
      type: "situation",
      categoryLabel: "Долги, кредиты и приставы",
      actionLabel: "Разобрать ситуацию",
      riskLevel: "high",
      urgency: "few_days"
    };
    sections.situations = [judicialOrderResult, ...sections.situations.filter((item) => item.href !== judicialOrderResult.href)].slice(0, 1);
    sections.documents = [
      {
        title: "Возражение на судебный приказ",
        description: "Шаблон возражения для приказа по банковскому долгу, кредиту, займу или МФО.",
        href: `/documents/${judicialOrderDebtRoute.documentSlug}/?variant=${judicialOrderDebtRoute.documentVariant}&route_id=${judicialOrderDebtRoute.routeId}#fill-online`,
        type: "document",
        categoryLabel: "Документ",
        actionLabel: "Сформировать возражение",
        riskLevel: "high",
        urgency: "few_days"
      },
      ...sections.documents
    ].slice(0, 1);
  }

  // Пул реальных страниц для выбора маршрута LLM (поиск = инструмент навигатора):
  // по несколько кандидатов каждого типа. LLM выберет из них главную (primaryHref).
  const candidateGroups = groupSearchResults(query, results, { limitPerGroup: 3, types: [...SEARCH_SECTION_TYPES] });
  const candidateResults: NavigatorResult[] = SEARCH_SECTION_TYPES.flatMap(
    (type) => (candidateGroups.find((group) => group.type === type)?.results ?? []).map(pickResult)
  ).slice(0, 6);

  // 4) primaryAction — первый результат по приоритету типов (детерминированный
  // запасной маршрут; ниже его может переопределить выбор LLM).
  const primary =
    [sections.situations, sections.instructions, sections.documents].find(
      (arr) => arr.length > 0
    )?.[0] ?? null;

  const primaryAction = isJudicialOrderDebtQuery(query)
    ? { label: "Проверить мою ситуацию", href: getJudicialOrderCheckHref("ai-navigator", judicialOrderDebtRoute.canonicalUrl) }
    : primary ? { label: primary.actionLabel || "Открыть", href: primary.href } : null;
  const intentContent = buildIntentContent(query, primary);

  // 5) confidence (lawyer-only результат тоже даёт medium).
  const confidence: NavigatorResponse["confidence"] = passportRestoreIntent
    ? "low"
    : sections.situations.length
    ? "high"
    : sections.instructions.length || sections.documents.length
      ? "medium"
      : "low";

  // 8) summary.
  const summary = intentContent?.summary ?? (passportRestoreIntent
    ? "Точного материала о восстановлении паспорта пока нет. Уточните обстоятельства, и консультант подберёт безопасный следующий шаг."
    : primary
    ? `Похоже, вопрос связан с темой: ${primary.title}.`
    : "Мы не нашли точного совпадения. Попробуйте уточнить проблему другими словами.");

  // Уточняющие вопросы формирует только LLM. Детерминированный поиск отвечает
  // за маршруты и материалы, но не подставляет список вопросов в интерфейс.
  const baseQuestions: string[] = [];
  const baseDialogStatus = resolveDialogStatus({ confidence, questions: baseQuestions, clarificationStep, completed: dialogCompleted });

  const response: NavigatorResponse = {
    query,
    mode: "navigator",
    urgent: searchUrgent,
    confidence,
    summary,
    riskLevel: passportRestoreIntent ? null : primary?.riskLevel ?? null,
    urgency: passportRestoreIntent ? null : primary?.urgency ?? null,
    primaryAction,
    steps: intentContent?.steps ?? buildSteps(primary),
    sections,
    clarifyingQuestions: baseQuestions,
    clarificationApplied,
    missingContentTopic: passportRestoreIntent ? "passport_restore" : undefined,
    filteredQuestionCount: 0,
    dialogStatus: baseDialogStatus,
    clarificationStep,
    maxClarificationSteps: MAX_CLARIFICATION_STEPS,
    canContinue: baseDialogStatus === "active",
    disclaimer: DISCLAIMER
  };

  // Опциональное LLM-обогащение только текстовых полей. В быстром режиме (?fast=1)
  // пропускаем его. Если LLM выключена/упала/вернула невалидный ответ — enrich вернёт
  // {}, и останутся детерминированные поля.
  const enriched = fast
    ? { status: "skipped" as const }
    : await enrichNavigatorResponseWithLLM({ query, baseResponse: response, clarificationAnswers, clarificationStep, candidates: candidateResults });

  // LLM — главный по навигации: если он выбрал реальную страницу из кандидатов,
  // делаем её главным действием и ставим первой в списке ссылок. Иначе остаётся
  // детерминированный маршрут поиска (безопасный откат). Для сценария восстановления
  // паспорта маршрут остаётся спец-детерминированным.
  const llmChosen =
    !passportRestoreIntent && enriched.primaryHref
      ? candidateResults.find((candidate) => candidate.href === enriched.primaryHref) ?? null
      : null;
  const effectivePrimary = llmChosen ?? primary;
  const effectivePrimaryAction = isJudicialOrderDebtQuery(query)
    ? primaryAction
    : effectivePrimary
      ? { label: effectivePrimary.actionLabel || "Открыть", href: effectivePrimary.href }
      : primaryAction;
  const effectiveSections = llmChosen ? promoteChosenResult(sections, llmChosen) : sections;
  const expectsQuestion = !fast && !dialogCompleted && clarificationStep < MAX_CLARIFICATION_STEPS;
  const enrichedQuestionFilter = filterRepeatedClarifyingQuestions(enriched.clarifyingQuestions ?? [], clarificationAnswers);
  const fallbackQuestionFilter =
    !fast && expectsQuestion && enrichedQuestionFilter.kept.length === 0
      ? filterRepeatedClarifyingQuestions(buildClarifyingQuestions(query, primary), clarificationAnswers)
      : { kept: [], filteredCount: 0 };
  const finalQuestions = expectsQuestion
    ? (enrichedQuestionFilter.kept.length ? enrichedQuestionFilter.kept : fallbackQuestionFilter.kept).slice(0, 1)
    : [];
  const usedQuestionFallback = expectsQuestion && enrichedQuestionFilter.kept.length === 0 && finalQuestions.length === 1;
  const questionReady = !expectsQuestion || finalQuestions.length === 1;
  const noSiteAnswer = dialogCompleted && enriched.siteAnswerFound === false;
  const consultationReady =
    !dialogCompleted || noSiteAnswer || Boolean(enriched.summary && enriched.steps && enriched.steps.length >= 3);
  const llmReady = enriched.status === "success" && questionReady && consultationReady;
  const usedFinalFallback = dialogCompleted && !llmReady && !noSiteAnswer && response.steps.length >= 3;
  const effectiveLlmStatus = enriched.status === "success" && !llmReady ? "error" : enriched.status;
  const dialogStatus = resolveDialogStatus({
    confidence,
    questions: finalQuestions,
    clarificationStep,
    completed: dialogCompleted && (llmReady || usedFinalFallback)
  });

  return NextResponse.json(
    {
      ...response,
      primaryAction: effectivePrimaryAction,
      sections: effectiveSections,
      legalReferences: getLegalReferencesForHref(effectivePrimaryAction?.href),
      riskLevel: passportRestoreIntent ? null : effectivePrimary?.riskLevel ?? null,
      urgency: passportRestoreIntent ? null : effectivePrimary?.urgency ?? null,
      summary: enriched.summary ?? response.summary,
      steps: enriched.steps ?? response.steps,
      clarifyingQuestions: finalQuestions,
      filteredQuestionCount: enrichedQuestionFilter.filteredCount + fallbackQuestionFilter.filteredCount,
      dialogStatus,
      clarificationStep,
      maxClarificationSteps: MAX_CLARIFICATION_STEPS,
      canContinue: dialogStatus === "active",
      llmStatus: effectiveLlmStatus,
      siteAnswerFound: enriched.siteAnswerFound,
      fallbackUsed: !fast && (!llmReady || usedQuestionFallback || usedFinalFallback)
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
