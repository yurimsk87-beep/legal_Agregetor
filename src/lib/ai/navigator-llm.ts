import { setDefaultResultOrder } from "node:dns";

// LLM-слой ИИ-консультанта. Он формирует один уточняющий вопрос за шаг,
// а после трёх ответов — краткий итог по найденным материалам сайта.

try {
  setDefaultResultOrder("ipv4first");
} catch {
  // В браузере этот модуль не выполняется, но оставляем защиту для нестандартных рантаймов.
}

export type NavigatorResult = {
  title: string;
  description?: string;
  href: string;
  type: string;
  categoryLabel?: string;
  actionLabel?: string;
  riskLevel?: string | null;
  urgency?: string | null;
};

export type NavigatorLegalReference = {
  code: string;
  article: string;
  title?: string;
  url: string;
};

export type NavigatorResponse = {
  query: string;
  mode: "navigator";
  urgent: boolean;
  confidence: "high" | "medium" | "low";
  summary: string;
  riskLevel: string | null;
  urgency: string | null;
  primaryAction: { label: string; href: string } | null;
  steps: string[];
  sections: {
    situations: NavigatorResult[];
    instructions: NavigatorResult[];
    documents: NavigatorResult[];
    questions: NavigatorResult[];
    lawyers: NavigatorResult[];
  };
  clarifyingQuestions: string[];
  clarificationApplied?: boolean;
  missingContentTopic?: "passport_restore";
  filteredQuestionCount?: number;
  llmStatus?: NavigatorLlmStatus;
  fallbackUsed?: boolean;
  siteAnswerFound?: boolean;
  // Нормы закона выбранной страницы (с реальными ссылками на consultant.ru).
  // Заполняет роут из данных сайта, а не LLM — чтобы не выдумывались статьи.
  legalReferences?: NavigatorLegalReference[];
  disclaimer: string;
  // Состояние последовательного диалога с LLM.
  dialogStatus?: DialogStatus;
  clarificationStep?: number;
  maxClarificationSteps?: number;
  canContinue?: boolean;
};

export type DialogStatus = "active" | "enough_info" | "low_confidence" | "completed" | "max_steps_reached";
export type NavigatorLlmStatus = "skipped" | "disabled" | "success" | "error" | "timeout";

export type ClarificationAnswer = {
  question: string;
  answer: string;
};

export type EnrichNavigatorParams = {
  query: string;
  baseResponse: NavigatorResponse;
  clarificationAnswers?: ClarificationAnswer[];
  clarificationStep?: number;
  // Реальные страницы сайта, найденные поиском (инструмент навигатора). LLM выбирает
  // из них главную (primaryHref). Если не передать — LLM работает как раньше.
  candidates?: NavigatorResult[];
};

type NavigatorLlmContentFields = Partial<Pick<NavigatorResponse, "summary" | "steps" | "clarifyingQuestions" | "siteAnswerFound">> & {
  // Страница, выбранная LLM как главная. Роут проверяет, что это реальный href из
  // переданных кандидатов, и только тогда делает её primaryAction.
  primaryHref?: string;
};

export type NavigatorLlmFields = NavigatorLlmContentFields & {
  status: NavigatorLlmStatus;
};

// Таймаут одного шага диалога с LLM.
const LLM_TIMEOUT_MS = Number(process.env.AI_LLM_TIMEOUT_MS) || 16000;
const LLM_MAX_ATTEMPTS = Number(process.env.AI_LLM_MAX_ATTEMPTS) || 2;
// Ответ навигатора короткий (резюме + до 5 шагов + один вопрос). Ограничиваем
// длину, чтобы модель не «растекалась» и отвечала быстрее.
const LLM_MAX_TOKENS = Number(process.env.AI_LLM_MAX_TOKENS) || 700;

export function isNavigatorLlmEnabled() {
  return (
    process.env.AI_NAVIGATOR_LLM_ENABLED === "true" &&
    Boolean(process.env.AI_API_KEY) &&
    Boolean(process.env.AI_BASE_URL) &&
    Boolean(process.env.AI_MODEL)
  );
}

const SYSTEM_PROMPT = `Ты — ИИ-консультант сайта ПравоПоиск. Ты главный: понимаешь запрос пользователя и ведёшь его к решению. Поиск по сайту — твой инструмент: он присылает список реальных страниц (candidates с настоящими href), из которых ты выбираешь навигацию.

Ты НЕ являешься юристом и не даёшь окончательное юридическое заключение.

Понимание запроса:
- Пользователь может писать с опечатками или в НЕПРАВИЛЬНОЙ РАСКЛАДКЕ (латиницей вместо кириллицы, когда забыл переключить клавиатуру: «edjkbkb c hf,jns» = «уволили с работы», «ghbcnfds» = «приставы»). Мысленно восстанови нормальный русский смысл и работай уже с ним, не переспрашивая про раскладку.

Выбор главной страницы (primaryHref):
- Выбери из candidates ОДНУ самую подходящую страницу и верни её href в поле primaryHref. Бери href строго из списка candidates — не выдумывай, не меняй и не додумывай ссылки.
- Если ни одна страница не подходит под ситуацию — primaryHref = null.

Диалог состоит из трёх последовательных уточнений:
- если ответов ещё нет — задай только вопрос №1;
- после первого ответа — только вопрос №2 с учётом запроса и первого ответа;
- после второго ответа — только вопрос №3 с учётом всей переписки;
- после третьего ответа вопросов больше не задавай: дай краткую юридическую оценку ситуации и первые шаги.

Правила:
1. Опирайся только на запрос пользователя, ответы пользователя и присланные candidates. Не добавляй правовые факты, законы, сроки, суды и гарантии результата, которых нет в контексте.
2. Не добавляй новые URL. И primaryHref, и любые упоминаемые страницы — только из candidates.
3. Каждый вопрос должен относиться именно к запросу и ответам пользователя. Используй выбранную страницу только если она прямо совпадает с темой; при конфликте не уходи в соседнюю юридическую тему.
4. Не упоминай шаблон, заявление, жалобу или иной документ, если его нет в candidates, запросе или ответах пользователя.
5. Не задавай слишком общие вопросы, если можно задать предметный; не задавай вопросы, ответы на которые очевидны из запроса; не повторяй уже отвеченные.
5.1. Даже если latestAnswer неполный, не переформулируй предыдущий вопрос — выбери следующий по важности неизвестный факт по этой же ситуации.
6. Если запрос связан со сроками — один вопрос уточняет дату/момент получения документа или момент, когда пользователь узнал о проблеме.
7. Если запрос связан с документом, судом, приставами, работодателем, банком, магазином или нотариусом — спроси о ключевом документе или основании.
8. За один вызов clarifyingQuestions содержит не больше одного вопроса. До третьего ответа итог не подводи; после третьего верни clarifyingQuestions: [].
9. Мини-оценка (после третьего ответа): summary — короткая юридическая оценка ситуации простым языком (что происходит и на что человек имеет право); steps — 3-5 конкретных рекомендаций по действиям.
10. siteAnswerFound=true только если хотя бы одна страница из candidates (ситуация, инструкция или документ) прямо относится к запросу и ответам пользователя. Ссылки Q/A и на юриста сами по себе не считаются найденным ответом.
11. Если подходящего материала нет — siteAnswerFound=false, primaryHref=null, не выдумывай юридическую рекомендацию.
12. Пиши простым русским языком. Ответ строго JSON без markdown.`;

// Основной результат, на который указывает primaryAction (по href). Даёт LLM
// title/description/categoryLabel найденной темы для точных вопросов.
function findPrimaryResult(baseResponse: NavigatorResponse): NavigatorResult | null {
  const href = baseResponse.primaryAction?.href;
  if (!href) return null;
  const all = [
    ...baseResponse.sections.situations,
    ...baseResponse.sections.instructions,
    ...baseResponse.sections.documents,
    ...baseResponse.sections.questions,
    ...baseResponse.sections.lawyers
  ];
  return all.find((result) => result.href === href) ?? null;
}

// Компактный контекст для LLM: только нужное, без keywords и без огромного объекта.
function buildCompactContext(
  baseResponse: NavigatorResponse,
  clarificationAnswers: ClarificationAnswer[] = [],
  clarificationStep = 0
) {
  const slim = (r: NavigatorResult) => ({
    title: r.title,
    description: r.description?.slice(0, 360),
    href: r.href,
    type: r.type,
    categoryLabel: r.categoryLabel
  });
  const first = (arr: NavigatorResult[]) => arr.slice(0, 1).map(slim);
  const primaryResult = findPrimaryResult(baseResponse);
  return {
    query: baseResponse.query,
    urgent: baseResponse.urgent,
    riskLevel: baseResponse.riskLevel,
    urgency: baseResponse.urgency,
    primaryAction: baseResponse.primaryAction,
    primary: primaryResult ? slim(primaryResult) : null,
    situations: first(baseResponse.sections.situations),
    instructions: first(baseResponse.sections.instructions),
    documents: first(baseResponse.sections.documents),
    questions: first(baseResponse.sections.questions),
    lawyers: first(baseResponse.sections.lawyers),
    conversation: clarificationAnswers,
    previousQuestions: clarificationAnswers.map((item) => item.question),
    previousAnswers: clarificationAnswers.map((item) => item.answer),
    latestAnswer: clarificationAnswers.at(-1)?.answer ?? null,
    clarificationStep
  };
}

function slimCandidate(result: NavigatorResult) {
  // Без описания: title + категория обычно достаточны для выбора страницы,
  // а лишние токены замедляют ответ модели.
  return {
    href: result.href,
    title: result.title,
    type: result.type,
    categoryLabel: result.categoryLabel
  };
}

function buildUserPrompt(
  query: string,
  baseResponse: NavigatorResponse,
  clarificationAnswers: ClarificationAnswer[] = [],
  clarificationStep = 0,
  candidates: NavigatorResult[] = []
) {
  const context = buildCompactContext(baseResponse, clarificationAnswers, clarificationStep);
  const isFinal = clarificationStep >= 3 || clarificationAnswers.length >= 3;
  const questionNumber = Math.min(clarificationAnswers.length + 1, 3);
  const candidatesJson = candidates.length
    ? JSON.stringify(candidates.map(slimCandidate), null, 2)
    : "[]";
  const dialogContext = JSON.stringify(
    {
      conversation: context.conversation,
      latestAnswer: context.latestAnswer,
      clarificationStep: context.clarificationStep
    },
    null,
    2
  );

  return `Пользовательский запрос (может быть с опечатками или в неправильной раскладке — сначала пойми его смысл):
${query}

Страницы сайта, найденные поиском (candidates). Выбери ОДНУ самую подходящую и верни её href в primaryHref. Бери href только отсюда:
${candidatesJson}

История уточнений:
${dialogContext}

${isFinal
  ? "Пользователь ответил на все три вопроса. Дай краткую юридическую оценку ситуации простым языком (summary) и 3-5 конкретных рекомендаций по действиям (steps). Если ни одна страница из candidates прямо не относится к ситуации — siteAnswerFound=false, primaryHref=null, кратко сообщи об этом и не выдумывай шаги. Новых вопросов не задавай."
  : `Сформулируй ровно один вопрос №${questionNumber} из 3. Он должен уточнять только то, чего ещё нет в запросе и conversation, и реально влиять на следующий шаг. Учитывай latestAnswer. НЕ повторяй уже заданные вопросы из conversation ни дословно, ни по смыслу.`}

Верни JSON строго такого вида:
{
  "primaryHref": "<href одной страницы из candidates или null>",
  "siteAnswerFound": true,
  "summary": "${isFinal ? "краткая юридическая оценка ситуации и с чего начать" : "короткое объяснение, что вероятно происходит"}",
  "steps": ["шаг 1", "шаг 2", "шаг 3"],
  "clarifyingQuestions": ${isFinal ? "[]" : `["точный вопрос №${questionNumber}"]`}
}`;
}

type ChatMessage = { role: "system" | "user"; content: string };

async function callChatCompletions(messages: ChatMessage[], useResponseFormat: boolean, signal: AbortSignal) {
  const baseUrl = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
  const body: Record<string, unknown> = {
    model: process.env.AI_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: LLM_MAX_TOKENS
  };
  if (useResponseFormat) body.response_format = { type: "json_object" };

  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "pravopoisk-ai-consultant/1.0"
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal
  });
}

function getNetworkErrorCode(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const cause = (error as Error & { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") return null;
  const code = (cause as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = getNetworkErrorCode(error);
  return (
    error.message === "fetch failed" &&
    (code === "UND_ERR_CONNECT_TIMEOUT" || code === "ECONNRESET" || code === "ETIMEDOUT" || code === "EAI_AGAIN" || code === null)
  );
}

async function callChatCompletionsWithRetry(messages: ChatMessage[], useResponseFormat: boolean, signal: AbortSignal) {
  const attempts = Math.max(1, Math.min(3, LLM_MAX_ATTEMPTS));
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await callChatCompletions(messages, useResponseFormat, signal);
    } catch (error) {
      lastError = error;
      if (signal.aborted || !isRetryableNetworkError(error) || attempt === attempts) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LLM request failed");
}

function parseLooseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("LLM response does not contain JSON");
  }
}

const MAX_CLARIFYING_QUESTION_LENGTH = 220;

// Слишком общие вопросы: принимаем их только если нет более предметных.
const GENERIC_QUESTION_PATTERNS = [
  "когда произошла ситуация",
  "есть ли у вас документы",
  "есть ли документы",
  "что вы уже",
  "опишите ситуацию",
  "что произошло",
  "расскажите подробнее"
];

function normalizeQuestion(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function isGenericQuestion(value: string): boolean {
  const normalized = normalizeQuestion(value);
  return GENERIC_QUESTION_PATTERNS.some((pattern) => normalized.includes(pattern));
}

const QUESTION_TOKEN_STOPWORDS = new Set([
  "есть", "если", "или", "для", "что", "как", "уже", "вас", "ваш", "ваша", "ваше", "ваши",
  "этот", "эта", "это", "при", "над", "под", "про", "нет", "был", "были", "ли", "вы", "по"
]);

const QUESTION_RELEVANCE_RULES: Array<{ query: RegExp; question: RegExp }> = [
  {
    query: /алимент/,
    question: /(алимент|плат|долг|задолж|ребен|суд|приказ|соглашен|исполнительн|пристав)/
  },
  {
    query: /(паспорт|утер|потер.*документ)/,
    question: /(паспорт|утер|потер|украл|замен|восстанов|документ|полици|госуслуг)/
  },
  {
    query: /(пристав|арест|исполнительн|списал.*карт|банк подал|кредит|долг)/,
    question: /(пристав|арест|исполнительн|счет|карт|банк|кредит|долг|суд|приказ|списан|постановлен)/
  },
  {
    query: /(увол|зарплат|работодател|трудов)/,
    question: /(увол|зарплат|работ|работодател|приказ|трудов|договор|расчет|соглашен)/
  },
  {
    query: /(наслед|завещ|нотариус|умер)/,
    question: /(наслед|завещ|нотариус|умер|родств|срок|имуще)/
  },
  {
    query: /(сосед|квартир|жкх|затоп|высел)/,
    question: /(сосед|квартир|жиль|жкх|шум|затоп|высел|собствен|ук|акт)/
  },
  {
    query: /(магазин|товар|гарант|подписк|услуг|продавец)/,
    question: /(магазин|товар|гарант|подписк|услуг|продавец|покуп|оплат|чек|претензи|возврат)/
  },
  {
    query: /(повестк|воен|мобилиз)/,
    question: /(повестк|воен|мобилиз|комиссариат|вручил|здоров|отсроч)/
  },
  {
    query: /(развод|расторжен.*брак)/,
    question: /(развод|брак|супруг|ребен|имуще|загс|суд|соглас)/
  }
];

function significantQuestionTokens(value: string): string[] {
  return normalizeQuestion(value)
    .split(" ")
    .filter((token) => token.length >= 4 && !QUESTION_TOKEN_STOPWORDS.has(token));
}

function keepStrictlyRelevantQuestions(questions: string[], query: string): string[] {
  const normalizedQuery = normalizeQuestion(query);
  const rule = QUESTION_RELEVANCE_RULES.find((item) => item.query.test(normalizedQuery));
  if (!rule) return questions;
  return questions.filter((question) => rule.question.test(normalizeQuestion(question)));
}

function keepGroundedSteps(
  steps: string[] | undefined,
  query: string,
  baseResponse: NavigatorResponse,
  clarificationAnswers: ClarificationAnswer[]
): string[] | undefined {
  if (!steps) return undefined;
  const sourceText = normalizeQuestion(
    [
      query,
      ...clarificationAnswers.flatMap((item) => [item.question, item.answer]),
      ...baseResponse.sections.documents.flatMap((item) => [item.title, item.description ?? ""])
    ].join(" ")
  );
  const controlledDocumentStems = ["шаблон", "образец", "претенз", "жалоб", "заявлен", "исков"];
  const hasUnsupportedDocument = steps.some((step) => {
    const normalizedStep = normalizeQuestion(step);
    return controlledDocumentStems.some((stem) => normalizedStep.includes(stem) && !sourceText.includes(stem));
  });
  return hasUnsupportedDocument ? undefined : steps;
}

// #3: фильтр повторных уточняющих вопросов. Убирает дубли внутри списка, дословные
// повторы ранее заданных вопросов и вопросы, уже закрытые предыдущими Q&A
// (≥2 общих значимых токена). Возвращает оставшиеся вопросы и число отфильтрованных.
export function filterRepeatedClarifyingQuestions(
  questions: string[],
  clarificationAnswers: ClarificationAnswer[] = []
): { kept: string[]; filteredCount: number } {
  const previousNormalized = clarificationAnswers.map((a) => normalizeQuestion(a.question)).filter(Boolean);
  const previousQuestionTokenSets = clarificationAnswers.map((a) => new Set(significantQuestionTokens(a.question)));
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const question of questions) {
    const normalized = normalizeQuestion(question);
    if (!normalized || seen.has(normalized)) continue; // дубль внутри списка
    // дословный повтор ранее заданного вопроса
    if (previousNormalized.some((prev) => prev === normalized || prev.includes(normalized) || normalized.includes(prev))) continue;
    // Почти полный лексический дубль. Два разных уточнения одной юридической темы
    // должны проходить, поэтому обычное пересечение терминов не блокируем.
    const tokens = significantQuestionTokens(question);
    const repeatedByTokens =
      tokens.length >= 3 &&
      previousQuestionTokenSets.some((set) => {
        const overlap = tokens.filter((token) => set.has(token)).length;
        return overlap >= 3 && (overlap / tokens.length >= 0.5 || overlap / set.size >= 0.5);
      });
    if (repeatedByTokens) continue;
    seen.add(normalized);
    kept.push(question);
  }

  return { kept, filteredCount: questions.length - kept.length };
}

// Берём только прошедшие проверку поля — остальное роут оставит из baseResponse.
function validateFields(
  parsed: unknown,
  expectedQuestionCount: 0 | 1,
  answeredQuestions: string[] = [],
  allowedHrefs: Set<string> = new Set()
): NavigatorLlmContentFields {
  const out: NavigatorLlmContentFields = {};
  if (!parsed || typeof parsed !== "object") return out;
  const obj = parsed as Record<string, unknown>;

  // Маршрут принимаем только если LLM выбрал реальный href из кандидатов —
  // никаких выдуманных ссылок.
  if (typeof obj.primaryHref === "string" && allowedHrefs.has(obj.primaryHref)) out.primaryHref = obj.primaryHref;

  if (typeof obj.siteAnswerFound === "boolean") out.siteAnswerFound = obj.siteAnswerFound;

  if (typeof obj.summary === "string") {
    const s = obj.summary.trim();
    if (s.length >= 20 && s.length <= 500) out.summary = s;
  }

  if (Array.isArray(obj.steps)) {
    const steps = obj.steps.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
    if (steps.length >= 3 && steps.length <= 5) out.steps = steps;
  }

  if (Array.isArray(obj.clarifyingQuestions)) {
    const answeredNormalized = answeredQuestions.map(normalizeQuestion).filter(Boolean);
    const seen = new Set<string>();
    const cleaned = obj.clarifyingQuestions
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim().slice(0, MAX_CLARIFYING_QUESTION_LENGTH))
      .filter((question) => {
        const normalized = normalizeQuestion(question);
        if (!normalized || seen.has(normalized)) return false; // дубли
        // почти совпадает с уже отвеченным вопросом → отбрасываем
        if (answeredNormalized.some((answered) => answered === normalized || answered.includes(normalized) || normalized.includes(answered))) {
          return false;
        }
        seen.add(normalized);
        return true;
      });

    // Для каждого шага нужен один предметный вопрос. Общий используем только
    // когда модель не вернула более точного варианта.
    const specific = cleaned.filter((question) => !isGenericQuestion(question));
    const questions = (specific.length ? specific : cleaned).slice(0, expectedQuestionCount);

    if (questions.length === expectedQuestionCount) {
      out.clarifyingQuestions = questions;
    }
  }

  return out;
}

export async function enrichNavigatorResponseWithLLM(params: EnrichNavigatorParams): Promise<NavigatorLlmFields> {
  if (!isNavigatorLlmEnabled()) return { status: "disabled" };
  const clarificationAnswers = params.clarificationAnswers ?? [];
  const clarificationStep = params.clarificationStep ?? clarificationAnswers.length;
  const expectedQuestionCount: 0 | 1 = clarificationStep >= 3 || clarificationAnswers.length >= 3 ? 0 : 1;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: buildUserPrompt(params.query, params.baseResponse, clarificationAnswers, clarificationStep, params.candidates ?? [])
    }
  ];
  const allowedHrefs = new Set((params.candidates ?? []).map((candidate) => candidate.href));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    // Сначала быстрый путь без response_format: на structured output некоторые
    // модели тратят заметно больше времени (для gpt-5.5 ~2x). Если провайдер
    // отклонил запрос (400) — повторяем с response_format=json_object.
    let res = await callChatCompletionsWithRetry(messages, false, controller.signal);
    if (res.status === 400) {
      res = await callChatCompletionsWithRetry(messages, true, controller.signal);
    }
    if (!res.ok) {
      console.error(`[ai-navigator] LLM HTTP ${res.status}`);
      return { status: "error" };
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.error("[ai-navigator] LLM empty content");
      return { status: "error" };
    }

    const validated = validateFields(
      parseLooseJson(content),
      expectedQuestionCount,
      clarificationAnswers.map((answer) => answer.question),
      allowedHrefs
    );
    const relevantQuestions = expectedQuestionCount
      ? keepStrictlyRelevantQuestions(validated.clarifyingQuestions ?? [], params.query).slice(0, 1)
      : [];
    const groundedSteps = keepGroundedSteps(validated.steps, params.query, params.baseResponse, clarificationAnswers);
    return {
      ...validated,
      steps: groundedSteps,
      clarifyingQuestions:
        expectedQuestionCount === 0 ? [] : relevantQuestions.length === expectedQuestionCount ? relevantQuestions : undefined,
      status: "success"
    };
  } catch (error) {
    if (controller.signal.aborted) console.error("[ai-navigator] LLM timeout");
    else {
      const code = getNetworkErrorCode(error);
      console.error("[ai-navigator] LLM error:", error instanceof Error ? error.message : error, code ? `(${code})` : "");
    }
    return { status: controller.signal.aborted ? "timeout" : "error" };
  } finally {
    clearTimeout(timer);
  }
}
