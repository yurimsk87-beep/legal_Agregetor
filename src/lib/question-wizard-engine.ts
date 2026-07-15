import { hasForbiddenContact, redactForbiddenContacts } from "./contact-safety";
import type { City, Service } from "./types";

export type QuestionWizardStep =
  | "INPUT"
  | "CLARIFICATIONS"
  | "ENRICHED_PREVIEW"
  | "ANALYZING"
  | "PRELIMINARY_ANSWER"
  | "TRANSFER_TO_LAWYER";

export type LegalStage = "до суда" | "суд" | "приставы" | "нотариус" | "полиция" | "договор" | "неизвестно";
export type UrgencyLevel = "обычная" | "срочная" | "критичная";
export type RiskLevel = "низкий" | "средний" | "высокий";

export type ClarificationQuestion = {
  id: string;
  label: string;
  placeholder?: string;
};

export type LegalScenario = {
  scenarioId: string;
  serviceSlug?: string;
  title: string;
  description: string;
  keywords: string[];
  requiredFacts: string[];
  clarificationQuestions: ClarificationQuestion[];
  documents: string[];
  riskSignals: string[];
  escalationRules: string[];
  answerTemplate: {
    conclusion: string;
    nextStep: string;
  };
};

export type QuestionClassification = {
  scenario: LegalScenario;
  legalStage: LegalStage;
  urgency: UrgencyLevel;
  riskLevel: RiskLevel;
  missingFacts: string[];
};

export type EnrichedQuestion = {
  title: string;
  text: string;
  facts: string[];
  missingFacts: string[];
  seoQualityScore: number;
};

export type PreliminaryAnswer = {
  text: string;
  status: "SCENARIO_STUB" | "FALLBACK";
};

export type ClarificationAnswers = Record<string, string>;

const GENERAL_SCENARIO_ID = "general_legal_question";

export const legalScenarios: LegalScenario[] = [
  {
    scenarioId: "inheritance_missed_deadline",
    serviceSlug: "nasledstvo",
    title: "Пропущен срок вступления в наследство",
    description: "Вопрос о наследстве, сроках, нотариусе и возможном судебном порядке.",
    keywords: ["наслед", "нотари", "умер", "смерт", "срок", "завещ", "родств", "егрн"],
    requiredFacts: ["дата события", "обращение к нотариусу", "причина пропуска срока", "другие наследники", "документы о родстве"],
    clarificationQuestions: [
      { id: "event_date", label: "Когда возникла ситуация или был пропущен срок?", placeholder: "Например: узнал о наследстве в мае 2026 года" },
      { id: "notary_contacted", label: "Обращались ли вы к нотариусу или другому органу?", placeholder: "Да/нет, если да - какой ответ получили" },
      { id: "other_parties", label: "Есть ли другие участники спора?", placeholder: "Другие наследники, родственники, собственники" },
      { id: "documents", label: "Какие документы уже есть на руках?", placeholder: "Свидетельство, выписка, переписка, отказ" }
    ],
    documents: ["свидетельство о смерти", "документы о родстве", "ответ нотариуса", "выписка ЕГРН", "переписка и доказательства сроков"],
    riskSignals: ["пропущен срок", "имущество уже оформлено", "есть спор между наследниками"],
    escalationRules: ["нужно восстановить срок", "есть спор о праве", "получен отказ нотариуса"],
    answerTemplate: {
      conclusion: "По описанию вопрос может потребовать проверки сроков, документов и возможного обращения в суд.",
      nextStep: "Безопасный следующий шаг - собрать документы и проверить, можно ли восстановить срок или выбрать другой порядок защиты."
    }
  },
  {
    scenarioId: "family_alimony_or_children",
    serviceSlug: "alimenty",
    title: "Семейный спор, алименты или вопросы о детях",
    description: "Вопрос о семейных обязательствах, алиментах, порядке общения или соглашении.",
    keywords: ["алимент", "ребен", "дет", "развод", "супруг", "брак", "общени", "родител"],
    requiredFacts: ["возраст ребенка", "есть ли решение суда", "есть ли соглашение", "размер дохода", "задолженность"],
    clarificationQuestions: [
      { id: "court_order", label: "Есть ли уже судебное решение или соглашение?", placeholder: "Да/нет, когда вынесено или подписано" },
      { id: "child_details", label: "Сколько лет ребенку и с кем он проживает?", placeholder: "Кратко, без лишних персональных данных" },
      { id: "payment_status", label: "Есть ли долг, выплаты или исполнительное производство?", placeholder: "Например: долг есть, приставы уже ведут производство" }
    ],
    documents: ["свидетельство о рождении", "судебное решение или соглашение", "справки о доходах", "постановления приставов", "переписка"],
    riskSignals: ["есть задолженность", "идет суд", "есть исполнительное производство"],
    escalationRules: ["нужно обращаться в суд", "нужно менять порядок выплат", "есть спор о детях"],
    answerTemplate: {
      conclusion: "По описанию ситуация зависит от действующих документов, доходов сторон и стадии спора.",
      nextStep: "Следует проверить действующее решение или соглашение и выбрать порядок: переговоры, заявление приставам или обращение в суд."
    }
  },
  {
    scenarioId: "housing_property_dispute",
    serviceSlug: "zhilishchnye-spory",
    title: "Жилищный или имущественный спор",
    description: "Вопрос о жилье, собственности, регистрации, управляющей компании или соседях.",
    keywords: ["квартир", "жиль", "собствен", "пропис", "регистрац", "ук", "сосед", "доля", "дом"],
    requiredFacts: ["право на объект", "кто зарегистрирован", "есть ли документы", "стадия спора", "обращения в УК или органы"],
    clarificationQuestions: [
      { id: "property_status", label: "Какое у вас право на жилье или имущество?", placeholder: "Собственник, наниматель, зарегистрирован, другое" },
      { id: "documents", label: "Какие документы подтверждают вашу позицию?", placeholder: "Выписка, договор, решение, квитанции" },
      { id: "current_stage", label: "На какой стадии спор?", placeholder: "Переговоры, претензия, суд, приставы" }
    ],
    documents: ["выписка ЕГРН", "договор", "квитанции", "претензии", "акты", "переписка"],
    riskSignals: ["идет суд", "есть риск выселения", "спор о праве собственности"],
    escalationRules: ["нужно подать иск", "нужно подготовить претензию", "нужно проверить документы на жилье"],
    answerTemplate: {
      conclusion: "По описанию нужно установить право на объект, документы и текущую стадию конфликта.",
      nextStep: "Чаще всего сначала проверяют документы и переписку, затем выбирают претензионный или судебный порядок."
    }
  },
  {
    scenarioId: "debt_credit_dispute",
    serviceSlug: "kredity-i-dolgi",
    title: "Кредит, долг или взыскание",
    description: "Вопрос о долгах, кредитах, коллекторах, суде или приставе.",
    keywords: ["кредит", "долг", "займ", "банк", "коллект", "пристав", "исполнитель", "судебный приказ", "взыск"],
    requiredFacts: ["сумма долга", "есть ли судебный акт", "стадия взыскания", "дата последнего платежа", "документы от банка или пристава"],
    clarificationQuestions: [
      { id: "debt_stage", label: "На какой стадии взыскание?", placeholder: "Звонки, претензия, судебный приказ, суд, приставы" },
      { id: "last_payment", label: "Когда был последний платеж или контакт по долгу?", placeholder: "Примерно месяц и год" },
      { id: "documents", label: "Какие документы вы получили?", placeholder: "Приказ, иск, постановление, уведомление" }
    ],
    documents: ["договор", "график платежей", "судебный приказ или иск", "постановление пристава", "переписка"],
    riskSignals: ["приставы уже взыскивают", "получен судебный приказ", "есть арест счетов"],
    escalationRules: ["срок на возражения может быть ограничен", "нужно проверить судебный акт", "нужно оценить документы по долгу"],
    answerTemplate: {
      conclusion: "По описанию важно понять, есть ли уже судебный акт и не пропущены ли процессуальные сроки.",
      nextStep: "Стоит проверить документы и сроки, затем определить, можно ли подать возражения, заявление или жалобу."
    }
  },
  {
    scenarioId: GENERAL_SCENARIO_ID,
    title: "Общий юридический вопрос",
    description: "Базовый сценарий, когда конкретная категория еще не определена.",
    keywords: [],
    requiredFacts: ["что произошло", "когда произошло", "какой результат нужен", "какие документы есть"],
    clarificationQuestions: [
      { id: "event_date", label: "Когда произошла ситуация или когда вы о ней узнали?", placeholder: "Дата или примерный период" },
      { id: "current_stage", label: "Что уже сделано по вопросу?", placeholder: "Обращения, претензии, суд, ответы органов" },
      { id: "desired_result", label: "Какой результат вы хотите получить?", placeholder: "Например: вернуть деньги, отменить решение, подготовить документы" },
      { id: "documents", label: "Какие документы или доказательства есть?", placeholder: "Договор, чеки, переписка, решения, уведомления" }
    ],
    documents: ["договор или иной основной документ", "переписка", "платежные документы", "претензии и ответы", "судебные или административные документы"],
    riskSignals: ["есть суд", "есть ограниченный срок", "есть финансовые или имущественные последствия"],
    escalationRules: ["нужна проверка документов", "возможен судебный порядок", "важны сроки обращения"],
    answerTemplate: {
      conclusion: "По описанию можно сделать только первичную оценку: точный вывод зависит от документов, сроков и стадии спора.",
      nextStep: "Нужно уточнить факты, проверить документы и выбрать безопасный порядок действий."
    }
  }
];

export function classifyQuestion(input: { text: string; service?: Service | null }): QuestionClassification {
  const scenario = matchScenario(input.text, input.service);
  const legalStage = detectLegalStage(input.text);
  const urgency = detectUrgency(input.text);
  const riskLevel = detectRiskLevel(input.text, scenario, urgency, legalStage);

  return {
    scenario,
    legalStage,
    urgency,
    riskLevel,
    missingFacts: scenario.requiredFacts.slice(0, 5)
  };
}

export function getClarificationQuestions(classification: QuestionClassification) {
  return classification.scenario.clarificationQuestions.slice(0, 5);
}

export function selectClarificationQuestions(classification: QuestionClassification) {
  return getClarificationQuestions(classification);
}

export function buildEnrichedQuestion(input: {
  rawText: string;
  city?: City | null;
  service?: Service | null;
  classification: QuestionClassification;
  answers: ClarificationAnswers;
}) {
  const safeRawText = cleanPublicText(input.rawText);
  const answeredFacts = Object.entries(input.answers)
    .map(([id, value]) => ({ id, value: cleanPublicText(value) }))
    .filter((item) => item.value.length > 0);
  const serviceName = input.service?.name ?? "юридическому вопросу";
  const cityName = input.city?.name ? ` в городе ${input.city.name}` : "";
  const title = buildTitle(safeRawText, serviceName);
  const factLines = answeredFacts.map((item) => {
    const label = input.classification.scenario.clarificationQuestions.find((question) => question.id === item.id)?.label ?? item.id;
    return `${label}: ${item.value}`;
  });
  const missingFacts = input.classification.scenario.requiredFacts
    .filter((fact) => !factLines.some((line) => line.toLowerCase().includes(fact.toLowerCase().slice(0, 6))))
    .slice(0, 5);
  const text = [
    `Нужна первичная правовая оценка по теме "${serviceName}"${cityName}.`,
    `Исходное описание ситуации: ${safeRawText}`,
    factLines.length ? `Уточненные обстоятельства:\n${factLines.map((line) => `- ${line}`).join("\n")}` : null,
    missingFacts.length ? `Пока не хватает данных: ${missingFacts.join(", ")}.` : null,
    "Прошу оценить возможный порядок действий, документы и риски без публикации личных контактов."
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title,
    text,
    facts: factLines,
    missingFacts,
    seoQualityScore: calculateSeoQualityScore({ title, text, confirmed: true })
  } satisfies EnrichedQuestion;
}

export function generatePreliminaryAnswer(input: {
  enrichedQuestion: EnrichedQuestion;
  classification: QuestionClassification;
}) {
  const scenario = input.classification.scenario;
  const important = input.enrichedQuestion.facts.length
    ? input.enrichedQuestion.facts.slice(0, 4)
    : ["стадия спора", "сроки", "наличие документов", "желаемый результат"];
  const documents = scenario.documents.slice(0, 5);
  const missingFacts = input.enrichedQuestion.missingFacts.slice(0, 4);
  const riskLine =
    input.classification.riskLevel === "высокий"
      ? "Если уже идет суд, взыскание или есть короткий срок, лучше не откладывать проверку документов."
      : "Если появятся документы, сроки или спор перейдет в официальную стадию, оценку стоит уточнить.";
  const text = [
    "Краткий вывод",
    scenario.answerTemplate.conclusion,
    "",
    "Что важно в вашей ситуации",
    ...important.map((item) => `- ${item}`),
    ...(missingFacts.length ? ["", "Что еще желательно уточнить", ...missingFacts.map((item) => `- ${item}`)] : []),
    "",
    "Какие документы могут понадобиться",
    ...documents.map((item) => `- ${item}`),
    "",
    "Возможный следующий шаг",
    scenario.answerTemplate.nextStep,
    "",
    "Когда стоит обратиться к юристу",
    `${riskLine} Для точного вывода юристу нужно изучить документы и проверить фактические обстоятельства.`
  ].join("\n");

  return { text, status: "SCENARIO_STUB" } satisfies PreliminaryAnswer;
}

export function calculateLeadScore(input: {
  classification: QuestionClassification;
  answers: ClarificationAnswers;
  transferRequested?: boolean;
}) {
  const answeredCount = Object.values(input.answers).filter((value) => value.trim().length > 0).length;
  const urgencyScore = input.classification.urgency === "критичная" ? 30 : input.classification.urgency === "срочная" ? 20 : 10;
  const riskScore = input.classification.riskLevel === "высокий" ? 30 : input.classification.riskLevel === "средний" ? 20 : 10;
  const stageScore = input.classification.legalStage === "неизвестно" ? 5 : 15;
  const transferScore = input.transferRequested ? 20 : 0;

  return Math.min(100, urgencyScore + riskScore + stageScore + answeredCount * 5 + transferScore);
}

export function calculateSeoQualityScore(input: { title: string; text: string; confirmed: boolean }) {
  if (hasForbiddenContact(`${input.title}\n${input.text}`)) return 0;
  return Math.min(
    100,
    (input.title.trim().length >= 20 ? 20 : 10) +
      (input.text.trim().length >= 300 ? 35 : input.text.trim().length >= 120 ? 25 : 10) +
      (input.confirmed ? 20 : 0) +
      (input.text.includes("Уточненные обстоятельства") ? 15 : 5) +
      (input.text.includes("Пока не хватает данных") ? 10 : 5)
  );
}

export function cleanPublicText(value: string) {
  return redactForbiddenContacts(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

export function matchScenario(text: string, service?: Service | null) {
  const normalized = text.toLowerCase();
  const serviceSlug = service?.slug;
  const scored = legalScenarios
    .filter((scenario) => scenario.scenarioId !== GENERAL_SCENARIO_ID)
    .map((scenario) => {
      const keywordScore = scenario.keywords.filter((keyword) => normalized.includes(keyword)).length;
      const serviceScore = scenario.serviceSlug && scenario.serviceSlug === serviceSlug ? 3 : 0;
      return { scenario, score: keywordScore + serviceScore };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score ? scored[0].scenario : legalScenarios.find((scenario) => scenario.scenarioId === GENERAL_SCENARIO_ID)!;
}

function detectLegalStage(text: string): LegalStage {
  const normalized = text.toLowerCase();
  if (/(пристав|исполнительн|арест счет|фссп)/i.test(normalized)) return "приставы";
  if (/(суд|иск|приказ|заседан|решени)/i.test(normalized)) return "суд";
  if (/(нотари|наследств|завещан)/i.test(normalized)) return "нотариус";
  if (/(полици|уголовн|заявлен.*преступ|следств)/i.test(normalized)) return "полиция";
  if (/(договор|контракт|соглашен|акт)/i.test(normalized)) return "договор";
  if (/(претенз|переговор|пока не обращал|до суда)/i.test(normalized)) return "до суда";
  return "неизвестно";
}

function detectUrgency(text: string): UrgencyLevel {
  const normalized = text.toLowerCase();
  if (/(завтра|сегодня|срочно|арест|выселен|суд через|истекает|пристав|угрожают)/i.test(normalized)) return "критичная";
  if (/(срок|повестк|заседан|приказ|жалоб|претенз|отказ)/i.test(normalized)) return "срочная";
  return "обычная";
}

function detectRiskLevel(text: string, scenario: LegalScenario, urgency: UrgencyLevel, legalStage: LegalStage): RiskLevel {
  const normalized = text.toLowerCase();
  const riskHits = scenario.riskSignals.filter((signal) => normalized.includes(signal.toLowerCase())).length;
  if (urgency === "критичная" || legalStage === "суд" || legalStage === "приставы" || riskHits >= 2) return "высокий";
  if (urgency === "срочная" || riskHits === 1) return "средний";
  return "низкий";
}

function buildTitle(text: string, serviceName: string) {
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? "";
  const base = firstSentence.length >= 20 ? firstSentence : `Вопрос по теме: ${serviceName}`;
  const normalized = base.length > 86 ? `${base.slice(0, 83).trim()}...` : base;
  return normalized;
}
