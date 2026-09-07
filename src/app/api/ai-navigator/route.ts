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

function isZagsNavigatorIntent(query: string, primary: NavigatorResult | null) {
  const normalized = query.toLowerCase().replace(/ё/g, "е");
  const href = primary?.href ?? "";
  return (
    href.includes("/problems/semya-i-deti/brak-zags-i-smena-familii/") ||
    href.includes("/documents/zayavlenie-v-zags/") ||
    /(загс|заключить брак|зарегистрировать брак|переменить имя|сменить фамилию|повторное свидетельство|исправить запись)/.test(normalized)
  );
}

function isGuardianshipNavigatorIntent(query: string, primary: NavigatorResult | null) {
  const normalized = query.toLowerCase().replace(/ё/g, "е");
  if (/(усынов|удочер|лишен.*родитель|совершеннолет|опека над взросл)/.test(normalized) || (normalized.includes("недееспособ") && normalized.includes("взросл"))) return false;
  const href = primary?.href ?? "";
  return href.includes("opeka-i-popechitelstvo-nad-rebenkom") ||
    href.includes("naznachenii-opekuna") ||
    href.includes("imushchestvu-podopechnogo") ||
    href.includes("zhaloba-na-organ-opeki") ||
    /(опек.*ребен|попечитель.*ребен|предварительн.*опек|отчет опекуна|орган опеки.*(отказ|не отвечает)|имущество ребенка.*опек)/.test(normalized);
}

function buildIntentContent(query: string, primary: NavigatorResult | null): IntentContent | null {
  if (isGuardianshipNavigatorIntent(query, primary)) {
    return {
      summary: "Похоже, вопрос касается опеки или попечительства над несовершеннолетним. Маршрут разделяет обычное и предварительное назначение, заявление родителей, отчётность и имущественные разрешения.",
      steps: [
        "Выберите задачу: оформление, временное отсутствие родителей, имущество и отчёт либо отказ органа опеки.",
        "Ответьте на вопросы о возрасте ребёнка, заявителе и требуемом результате.",
        "Получите персональный перечень и подготовьте данные для официальной формы либо маркированный черновик."
      ]
    };
  }
  if (!isZagsNavigatorIntent(query, primary)) return null;
  return {
    summary: "Похоже, вопрос связан с регистрацией брака или другой процедурой ЗАГС. Сначала выберите нужную процедуру, затем подготовьте сведения для соответствующего официального бланка.",
    steps: [
      "Выберите процедуру: заключение брака, перемена имени, повторный документ или исправление записи.",
      "Проверьте перечень обязательных сведений и приложений для выбранной процедуры.",
      "Используйте официальную форму и проверьте способ подачи перед обращением в ЗАГС."
    ]
  };
}

function buildClarifyingQuestions(query: string, primary: NavigatorResult | null): string[] {
  if (isGuardianshipNavigatorIntent(query, primary)) {
    return [
      "Что требуется: назначить опекуна, оформить период отсутствия родителей, решить имущественный вопрос или обжаловать действие органа опеки?",
      "Сколько лет ребёнку и остался ли он без попечения родителей?",
      "Есть письменное решение органа опеки или зарегистрированное обращение без ответа?"
    ];
  }
  if (!isZagsNavigatorIntent(query, primary)) return [];
  return [
    "Что именно вы хотите сделать: заключить брак, переменить имя, получить повторный документ или исправить запись ЗАГС?",
    "Документ или запись уже существуют, и если да, сохранился ли соответствующий документ?",
    "Планируете обратиться лично, через МФЦ или в электронной форме?"
  ];
}

function pickResult(result: SiteSearchResult): NavigatorResult {
  return {
    title: result.title,
    description: result.description,
    href: result.href,
    type: result.type,
    categoryLabel: result.categoryLabel,
    actionLabel: result.actionLabel,
    riskLevel: result.riskLevel ?? null,
    urgency: result.urgency ?? null
  };
}

function emptySections(): NavigatorResponse["sections"] {
  return { situations: [], instructions: [], documents: [], questions: [], lawyers: [] };
}

const SPECIALIZATION_RULES: Array<{ pattern: RegExp; slug: string; label: string }> = [
  { pattern: /(алимент|развод|брак|супруг|ребен|загс)/, slug: "semeynye-spory", label: "Семейные споры" },
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
    documents: passportRestoreIntent ? [] : documentResults.filter(keepRelevantMaterial),
    questions: supportSections.questions,
    lawyers: supportSections.lawyers
  };
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

  const primaryAction = primary ? { label: primary.actionLabel || "Открыть", href: primary.href } : null;
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
  const effectivePrimaryAction = effectivePrimary
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
