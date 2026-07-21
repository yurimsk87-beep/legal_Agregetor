type NavigatorResponse = {
  confidence: "high" | "medium" | "low";
  primaryAction: { label: string; href: string } | null;
  summary: string;
  steps: string[];
  clarifyingQuestions: string[];
  dialogStatus?: "active" | "enough_info" | "low_confidence" | "completed" | "max_steps_reached";
  clarificationStep?: number;
  canContinue?: boolean;
  filteredQuestionCount?: number;
  missingContentTopic?: "passport_restore";
  llmStatus?: "skipped" | "disabled" | "success" | "error" | "timeout";
  sections: {
    situations: Array<{ href: string }>;
    instructions: Array<{ href: string }>;
    documents: Array<{ href: string }>;
    questions: Array<{ href: string }>;
    lawyers: Array<{ href: string }>;
  };
};

type QualityCase = {
  query: string;
  forbidden: string[];
  expected?: string[];
  allowNoPrimary?: boolean;
  expectedConfidence?: Array<NavigatorResponse["confidence"]>;
  expectedMissingContentTopic?: NavigatorResponse["missingContentTopic"];
  expectedDomain?: string;
};

function routeDomain(href: string | null): string | null {
  return href?.match(/^\/problems\/([^/]+)/)?.[1] ?? null;
}

// Маршрут детерминирован поиском, LLM его не меняет — поэтому проверяем быстрый
// (?fast=1) ответ: так скрипт не ждёт LLM и валидирует именно deterministic-route.
const baseUrl = process.env.AI_NAVIGATOR_CHECK_URL || "http://localhost:3000";

const cases: QualityCase[] = [
  // --- трудовое ---
  {
    query: "уволили без причины",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/rabota-zarplata-i-trudovye-prava/nezakonno-uvolili/"],
    expectedDomain: "rabota-zarplata-i-trudovye-prava"
  },
  {
    query: "меня уволили без объяснения причин",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/rabota-zarplata-i-trudovye-prava/nezakonno-uvolili/"],
    expectedDomain: "rabota-zarplata-i-trudovye-prava"
  },
  // --- долги/приставы ---
  {
    query: "приставы арестовали карту",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/dolgi-kredity-i-pristavy/arestovali-zarplatnuyu-kartu/"],
    expectedDomain: "dolgi-kredity-i-pristavy"
  },
  {
    query: "банк подал в суд",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/dolgi-kredity-i-pristavy/bank-podal-v-sud-po-kreditu/"],
    expectedDomain: "dolgi-kredity-i-pristavy"
  },
  // --- наследство ---
  {
    query: "как вступить в наследство",
    forbidden: ["/problems/semya-i-deti/nasilie-v-seme/"],
    expected: ["/problems/nasledstvo/vstuplenie-v-nasledstvo/"],
    expectedDomain: "nasledstvo"
  },
  // --- алименты (фикс #1): неуплата/исполнительный лист → взыскание, НЕ лишение прав ---
  {
    query: "бывший муж не платит алименты",
    forbidden: ["/lishenie"],
    expected: ["/problems/semya-i-deti/alimenty/"],
    expectedDomain: "semya-i-deti"
  },
  {
    query: "исполнительный лист по алиментам",
    forbidden: ["/lishenie"],
    expected: ["/problems/semya-i-deti/alimenty/"],
    expectedDomain: "semya-i-deti"
  },
  {
    query: "отец не платит алименты",
    forbidden: ["/lishenie"],
    expected: ["/problems/semya-i-deti/alimenty/"],
    expectedDomain: "semya-i-deti"
  },
  // лишение прав — только при явном «лишить» (не должно сломаться)
  {
    query: "лишить отца родительских прав",
    forbidden: ["/problems/semya-i-deti/alimenty/"],
    expected: ["/lishenie"],
    expectedDomain: "semya-i-deti"
  },
  // развод → развод, а не алименты
  {
    query: "хочу подать на развод",
    forbidden: ["/problems/semya-i-deti/alimenty/", "/problems/semya-i-deti/brak-zags-i-smena-familii/"],
    expected: ["/problems/semya-i-deti/razvod/"],
    expectedDomain: "semya-i-deti"
  },
  // Брак и ЗАГС → отдельный маршрут, не развод/алименты/дети
  {
    query: "хочу зарегистрировать брак",
    forbidden: ["/problems/semya-i-deti/razvod/", "/problems/semya-i-deti/alimenty/"],
    expected: ["/problems/semya-i-deti/brak-zags-i-smena-familii/"],
    expectedDomain: "semya-i-deti"
  },
  {
    query: "как подать заявление в загс",
    forbidden: ["/problems/semya-i-deti/razvod/", "/problems/semya-i-deti/alimenty/"],
    expected: ["/problems/semya-i-deti/brak-zags-i-smena-familii/"],
    expectedDomain: "semya-i-deti"
  },
  {
    query: "сменить фамилию после свадьбы",
    forbidden: ["/problems/semya-i-deti/razvod/", "/problems/semya-i-deti/alimenty/"],
    expected: ["/problems/semya-i-deti/brak-zags-i-smena-familii/"],
    expectedDomain: "semya-i-deti"
  },
  {
    query: "получить справку о браке после развода",
    forbidden: ["/problems/semya-i-deti/alimenty/"],
    expected: ["/problems/semya-i-deti/brak-zags-i-smena-familii/"],
    expectedDomain: "semya-i-deti"
  },
  {
    query: "исправить ошибку в свидетельстве загс",
    forbidden: ["/problems/semya-i-deti/razvod/", "/problems/semya-i-deti/alimenty/"],
    expected: ["/problems/semya-i-deti/brak-zags-i-smena-familii/"],
    expectedDomain: "semya-i-deti"
  },
  // --- ЖКХ ---
  {
    query: "соседи шумят ночью",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/zhkh-i-kommunalnye-uslugi/shumnye-sosedi/"],
    expectedDomain: "zhkh-i-kommunalnye-uslugi"
  },
  // --- потребители ---
  {
    query: "магазин отказал в гарантии",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/pokupki-uslugi-i-zashchita-potrebiteley/tovar-slomalsya-na-garantii/"],
    expectedDomain: "pokupki-uslugi-i-zashchita-potrebiteley"
  },
  {
    query: "списали деньги за подписку",
    forbidden: ["/problems/dolgi-kredity-i-pristavy/spisali-dengi-pristavy/"],
    allowNoPrimary: true,
    expectedConfidence: ["low"]
  },
  // --- паспорт (фикс #2): НЕ архив/загран, а паспорт РФ ---
  {
    query: "потерял паспорт",
    forbidden: ["/arhivnye-dokumenty/", "/zagranpasport/"],
    expected: ["/problems/dokumenty-personalnye-dannye-i-gosuslugi/"],
    expectedConfidence: ["low"],
    expectedMissingContentTopic: "passport_restore",
    expectedDomain: "dokumenty-personalnye-dannye-i-gosuslugi"
  },
  {
    query: "восстановить паспорт",
    forbidden: ["/arhivnye-dokumenty/", "/zagranpasport/"],
    expected: ["/problems/dokumenty-personalnye-dannye-i-gosuslugi/"],
    expectedConfidence: ["low"],
    expectedMissingContentTopic: "passport_restore",
    expectedDomain: "dokumenty-personalnye-dannye-i-gosuslugi"
  },
  {
    query: "украли паспорт",
    forbidden: ["/arhivnye-dokumenty/", "/zagranpasport/"],
    expected: ["/problems/dokumenty-personalnye-dannye-i-gosuslugi/"],
    expectedConfidence: ["low"],
    expectedMissingContentTopic: "passport_restore",
    expectedDomain: "dokumenty-personalnye-dannye-i-gosuslugi"
  },
  // --- воинский учёт ---
  {
    query: "пришла повестка",
    forbidden: ["/problems/semya-i-deti/"],
    expected: ["/problems/voennaya-sluzhba-mobilizaciya-i-svo/prishla-povestka/"],
    expectedDomain: "voennaya-sluzhba-mobilizaciya-i-svo"
  },
  // --- low-signal: не должно быть уверенного юр-маршрута ---
  {
    query: "привет",
    forbidden: ["/problems/"],
    allowNoPrimary: true,
    expectedConfidence: ["low"]
  }
];

async function checkCase(testCase: QualityCase) {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/ai-navigator/?fast=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: testCase.query, page: "quality-script" }),
      signal: AbortSignal.timeout(20_000)
    });
  } catch (error) {
    throw new Error(`${testCase.query}: request failed (${error instanceof Error ? error.message : error})`);
  }

  if (!response.ok) throw new Error(`${testCase.query}: API responded ${response.status}`);
  const data = (await response.json()) as NavigatorResponse;
  const href = data.primaryAction?.href ?? null;

  if (!href && !testCase.allowNoPrimary) throw new Error(`${testCase.query}: primaryAction is missing`);
  if (href && testCase.forbidden.some((forbidden) => href.includes(forbidden))) {
    throw new Error(`${testCase.query}: forbidden primaryAction ${href}`);
  }
  if (href && testCase.expected?.length && !testCase.expected.some((expected) => href.includes(expected))) {
    throw new Error(`${testCase.query}: expected ${testCase.expected.join(" or ")}, got ${href}`);
  }
  if (testCase.expectedConfidence && !testCase.expectedConfidence.includes(data.confidence)) {
    throw new Error(`${testCase.query}: expected confidence ${testCase.expectedConfidence.join("/")}, got ${data.confidence}`);
  }
  if (!testCase.expectedConfidence && testCase.expected?.length && data.confidence === "low") {
    throw new Error(`${testCase.query}: expected confident route, got low confidence`);
  }
  if (testCase.expectedDomain && routeDomain(href) !== testCase.expectedDomain) {
    throw new Error(`${testCase.query}: expected domain ${testCase.expectedDomain}, got ${routeDomain(href) ?? "none"}`);
  }
  if (testCase.expectedMissingContentTopic && data.missingContentTopic !== testCase.expectedMissingContentTopic) {
    throw new Error(`${testCase.query}: expected missingContentTopic ${testCase.expectedMissingContentTopic}, got ${data.missingContentTopic ?? "none"}`);
  }
  if (!data.summary.trim()) throw new Error(`${testCase.query}: summary is empty`);
  if (!Array.isArray(data.steps) || data.steps.length === 0) throw new Error(`${testCase.query}: steps are empty`);
  if (data.clarifyingQuestions.length !== 0) {
    throw new Error(`${testCase.query}: deterministic route must not return clarifying questions`);
  }

  return { query: testCase.query, confidence: data.confidence, primaryAction: href ?? "none" };
}

async function postNavigator(body: Record<string, unknown>): Promise<NavigatorResponse> {
  const response = await fetch(`${baseUrl}/api/ai-navigator/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`clarification flow: API responded ${response.status}`);
  return (await response.json()) as NavigatorResponse;
}

async function checkClarificationFlow() {
  const query = "бывший муж не платит алименты";
  const clarificationAnswers: Array<{ question: string; answer: string }> = [];
  const questions: string[] = [];

  for (let step = 0; step < 3; step += 1) {
    const response = await postNavigator({ query, clarificationAnswers, clarificationStep: step });
    if (response.llmStatus !== "success" || response.dialogStatus !== "active" || response.clarifyingQuestions.length !== 1) {
      throw new Error(`step ${step + 1}: expected one LLM question, got ${response.clarifyingQuestions.length} (${response.llmStatus})`);
    }
    const question = response.clarifyingQuestions[0];
    if (questions.includes(question)) throw new Error(`step ${step + 1}: repeated question ${question}`);
    questions.push(question);
    clarificationAnswers.push({ question, answer: answerForAlimonyQuestion(question, step) });
  }

  const final = await postNavigator({
    query,
    clarificationAnswers,
    clarificationStep: 3,
    dialogCompleted: true
  });
  if (final.llmStatus !== "success" || final.dialogStatus !== "completed" || final.canContinue !== false || final.clarifyingQuestions.length) {
    throw new Error("clarification flow did not complete with an LLM consultation after 3 answers");
  }
  if (!final.summary.trim() || final.steps.length < 3) throw new Error("final mini consultation is incomplete");
  if (!final.sections.questions.length || !final.sections.lawyers.some((item) => item.href.includes("category=semeynye-spory"))) {
    throw new Error("final response does not include contextual Q/A and specialized lawyer links");
  }
  return { sequentialLlmQuestions: questions.length, completedAfterThreeAnswers: true };
}

function answerForAlimonyQuestion(question: string, step: number) {
  const normalized = question.toLowerCase().replace(/ё/g, "е");
  if (/(соглаш|приказ|решени|исполнительн.*лист)/.test(normalized) && !/(передал|передан|пристав)/.test(normalized)) {
    return "Есть судебный приказ";
  }
  if (/(пристав|передал|передан|работодател)/.test(normalized)) return "К приставам еще не обращалась";
  if (/(месяц|период|сколько|давно|задолж)/.test(normalized)) return "Не платит шесть месяцев";
  return ["Есть судебный приказ", "Не платит шесть месяцев", "К приставам еще не обращалась"][step];
}

async function main() {
  const results = [];
  for (const testCase of cases) results.push(await checkCase(testCase));
  const clarificationFlow = await checkClarificationFlow();
  console.log(JSON.stringify({ ok: true, checked: results.length, clarificationFlow, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
