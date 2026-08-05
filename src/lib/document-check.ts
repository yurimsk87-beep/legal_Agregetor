export type DocumentCheckSender =
  | "court"
  | "bailiff"
  | "bank"
  | "employer"
  | "seller"
  | "management_company"
  | "other"
  | "unknown";

export type DocumentCheckGoal =
  | "understand"
  | "respond"
  | "prepare_document"
  | "check_before_send"
  | "check_deadline"
  | "send_lawyer";

export type DocumentCheckUrgency =
  | "deadline_in_document"
  | "received_today"
  | "money_withdrawn"
  | "court_soon"
  | "unknown";

export type DocumentCheckInput = {
  description?: string;
  fileName?: string;
  goal?: DocumentCheckGoal | "";
  knownType?: string;
  sender?: DocumentCheckSender | "";
  urgency?: DocumentCheckUrgency | "";
};

export type DocumentCheckAnalysis = {
  confidence: "high" | "medium" | "low";
  detectedFacts: string[];
  expectedAction: string;
  foundAmount?: string;
  foundCaseNumber?: string;
  foundDate?: string;
  isUnknown: boolean;
  nextSteps: string[];
  relatedDocuments: RelatedDocument[];
  risks: string[];
  senderLabel: string;
  termText: string;
  typeId: string;
  typeTitle: string;
  whatIs: string;
};

export type RelatedDocument = {
  href: string;
  label: string;
  title: string;
};

type Option<T extends string> = {
  label: string;
  value: T;
};

type DocumentTypeProfile = {
  deadline: string;
  expectedAction: string;
  id: string;
  keywords: string[];
  nextSteps: string[];
  relatedDocuments: RelatedDocument[];
  risks: string[];
  senderHints?: DocumentCheckSender[];
  title: string;
  whatIs: string;
};

export const documentCheckSenderOptions: Option<DocumentCheckSender>[] = [
  { value: "court", label: "Суд" },
  { value: "bailiff", label: "Пристав" },
  { value: "bank", label: "Банк" },
  { value: "employer", label: "Работодатель" },
  { value: "seller", label: "Продавец или исполнитель услуг" },
  { value: "management_company", label: "Управляющая компания" },
  { value: "other", label: "Другой человек или организация" },
  { value: "unknown", label: "Не знаю" }
];

export const documentCheckGoalOptions: Option<DocumentCheckGoal>[] = [
  { value: "understand", label: "Понять, что это значит" },
  { value: "respond", label: "Ответить на документ" },
  { value: "prepare_document", label: "Подготовить жалобу или заявление" },
  { value: "check_before_send", label: "Проверить перед отправкой" },
  { value: "check_deadline", label: "Узнать сроки" },
  { value: "send_lawyer", label: "Отправить юристу" }
];

export const documentCheckUrgencyOptions: Option<DocumentCheckUrgency>[] = [
  { value: "deadline_in_document", label: "Срок указан в документе" },
  { value: "received_today", label: "Документ получил сегодня" },
  { value: "money_withdrawn", label: "Деньги уже списали" },
  { value: "court_soon", label: "Скоро суд или заседание" },
  { value: "unknown", label: "Не знаю" }
];

export const documentReviewCheckOptions = [
  "Проверить перед отправкой",
  "Понять, что означает документ",
  "Проверить срок",
  "Проверить ошибки",
  "Подготовить ответ",
  "Оценить риски"
];

export const documentReviewStatuses = [
  "Документ загружен",
  "Ожидает проверки",
  "Юрист изучает документ",
  "Нужны уточнения",
  "Ответ готов",
  "Проверка завершена"
];

export const supportedDocumentTypeOptions = [
  { value: "", label: "Не знаю, пусть сервис попробует определить" },
  { value: "court_order", label: "Судебный приказ" },
  { value: "bailiff_order", label: "Постановление пристава" },
  { value: "writ", label: "Исполнительный лист" },
  { value: "claim", label: "Претензия" },
  { value: "claim_response", label: "Ответ на претензию" },
  { value: "complaint", label: "Жалоба" },
  { value: "court_application", label: "Заявление в суд" },
  { value: "contract", label: "Договор" },
  { value: "employer_notice", label: "Уведомление от работодателя" },
  { value: "alimony", label: "Документ по алиментам" }
];

const profiles: DocumentTypeProfile[] = [
  {
    id: "court_order",
    title: "судебный приказ",
    keywords: ["судебный приказ", "мировой судья", "возражения относительно исполнения", "взыскатель", "должник"],
    senderHints: ["court"],
    whatIs: "Похоже, это судебный приказ — документ суда, по которому взыскатель может требовать деньги без обычного судебного заседания.",
    expectedAction: "Если вы не согласны с требованием, обычно важно решить вопрос с возражением и проверить срок с даты получения.",
    deadline: "Проверьте дату фактического получения судебного приказа. От неё может зависеть срок подачи возражения.",
    risks: [
      "Если ничего не делать, взыскание может продолжиться.",
      "Если срок спорный или пропущен, может понадобиться заявление о восстановлении срока.",
      "Если деньги уже списали, может понадобиться отдельный порядок возврата."
    ],
    nextSteps: [
      "Проверьте дату получения документа.",
      "Решите, согласны ли вы с требованием.",
      "Подготовьте возражение на судебный приказ.",
      "При спорном сроке подготовьте заявление о восстановлении срока.",
      "Отправьте документы в суд и сохраните подтверждение отправки."
    ],
    relatedDocuments: []
  },
  {
    id: "bailiff_order",
    title: "постановление пристава",
    keywords: ["постановление пристава", "судебный пристав", "исполнительное производство", "фссп", "арест счета", "удержание"],
    senderHints: ["bailiff"],
    whatIs: "Похоже, это постановление пристава по исполнительному производству. В нём может быть указано, что пристав сделал или требует сделать.",
    expectedAction: "Обычно нужно проверить номер производства, основание взыскания, сумму, срок для обжалования и то, какие ограничения уже применены.",
    deadline: "Проверьте дату постановления и дату, когда вы фактически узнали о нём. Сроки жалобы могут зависеть от этих дат.",
    risks: [
      "Взыскание, арест счета или удержания могут продолжиться.",
      "Если деньги уже списали, может понадобиться заявление о снятии ареста или возврате удержаний.",
      "Если жалоба подана без фактов и приложений, её могут оставить без результата."
    ],
    nextSteps: [
      "Проверьте номер исполнительного производства.",
      "Сверьте сумму и основание взыскания.",
      "Соберите постановления, выписки и подтверждения оплаты.",
      "Подготовьте жалобу или заявление приставу.",
      "При спорном сроке покажите документ юристу."
    ],
    relatedDocuments: []
  },
  {
    id: "writ",
    title: "исполнительный лист",
    keywords: ["исполнительный лист", "исполнительного листа", "лист выдан", "принудительное исполнение"],
    senderHints: ["court", "bailiff"],
    whatIs: "Похоже, это исполнительный лист — документ для принудительного исполнения судебного акта.",
    expectedAction: "Важно понять, кто взыскатель и должник, какая сумма указана и куда документ уже направлен.",
    deadline: "Проверьте дату выдачи и дату предъявления. В некоторых ситуациях важен срок предъявления исполнительного документа.",
    risks: [
      "Если исполнительный лист уже у приставов или в банке, взыскание может начаться без отдельного предупреждения.",
      "Если сумма или стороны указаны неверно, может понадобиться заявление или жалоба.",
      "Если деньги уже списали, важно быстро проверить основание удержания."
    ],
    nextSteps: [
      "Проверьте суд, номер дела, стороны и сумму.",
      "Уточните, предъявлен ли лист приставам, в банк или работодателю.",
      "Если данные неверные, подготовьте обращение или жалобу.",
      "Сохраните копии всех постановлений и выписок."
    ],
    relatedDocuments: []
  },
  {
    id: "claim",
    title: "претензия",
    keywords: ["претензия", "требую вернуть", "досудебная претензия", "возврат денег", "некачественный товар", "услуга"],
    senderHints: ["seller", "management_company", "bank", "other"],
    whatIs: "Похоже, это претензия — письменное требование решить спор до суда или до подачи жалобы.",
    expectedAction: "Нужно понять, кто требует действие, какой срок указан и нужно ли отвечать письменно.",
    deadline: "Проверьте срок ответа в тексте претензии и дату её получения. Для разных ситуаций сроки могут отличаться.",
    risks: [
      "Если не ответить, спор может перейти в суд или жалобу.",
      "Если ответить неаккуратно, можно признать лишние факты или сумму.",
      "Если вы сами готовите претензию, важно указать требование, срок и приложения."
    ],
    nextSteps: [
      "Проверьте, кто направил претензию и что именно требует.",
      "Найдите срок ответа и дату получения.",
      "Соберите договор, чеки, переписку и акты.",
      "Подготовьте ответ или свою претензию.",
      "Перед отправкой проверьте формулировки."
    ],
    relatedDocuments: []
  },
  {
    id: "claim_response",
    title: "ответ на претензию",
    keywords: ["ответ на претензию", "в ответ на вашу претензию", "рассмотрев претензию", "отказываем", "удовлетворить претензию"],
    senderHints: ["seller", "management_company", "bank", "other"],
    whatIs: "Похоже, это ответ на претензию. В нём обычно указано, согласна ли организация с требованием и что предлагает сделать дальше.",
    expectedAction: "Важно понять, удовлетворили требование полностью, частично или отказали, и какой следующий шаг возможен.",
    deadline: "Проверьте дату ответа и срок, если он указан. Если ответ отрицательный, дальше может идти срок для жалобы или суда.",
    risks: [
      "Если отказ необоснованный, может понадобиться жалоба или иск.",
      "Если ответ частичный, важно не потерять оставшуюся часть требований.",
      "Если срок уже идёт, лучше не откладывать подготовку следующего документа."
    ],
    nextSteps: [
      "Сравните ответ с вашей претензией.",
      "Проверьте, есть ли признание долга, отказ или предложение компенсации.",
      "Соберите приложения и доказательства.",
      "Подготовьте жалобу, повторную претензию или заявление в суд."
    ],
    relatedDocuments: []
  },
  {
    id: "complaint",
    title: "жалоба",
    keywords: ["жалоба", "прошу провести проверку", "обжалую", "незаконные действия", "бездействие"],
    senderHints: ["other"],
    whatIs: "Похоже, это жалоба или проект жалобы. Такой документ обычно нужен, чтобы попросить орган проверить действия, отказ или бездействие.",
    expectedAction: "Проверьте адресата, факты, даты, требования и приложения. Для некоторых жалоб важен срок.",
    deadline: "Проверьте дату события или отказа, который вы обжалуете. От неё может зависеть допустимый срок обращения.",
    risks: [
      "Если адресат выбран неверно, рассмотрение может затянуться.",
      "Если нет дат и доказательств, жалобу могут оставить без результата.",
      "Если срок пропущен, может понадобиться объяснение причин."
    ],
    nextSteps: [
      "Проверьте, кому адресована жалоба.",
      "Сверьте факты, даты и требования.",
      "Добавьте документы и доказательства.",
      "Сохраните подтверждение отправки."
    ],
    relatedDocuments: []
  },
  {
    id: "court_application",
    title: "заявление в суд",
    keywords: ["заявление в суд", "исковое заявление", "прошу суд", "истец", "ответчик", "мировому судье", "районный суд"],
    senderHints: ["court"],
    whatIs: "Похоже, это заявление в суд или проект судебного заявления.",
    expectedAction: "Нужно проверить суд, стороны, требования, цену иска, приложения и госпошлину.",
    deadline: "Проверьте срок обращения в суд или срок исправления недостатков, если суд уже прислал определение.",
    risks: [
      "Если не хватает приложений, заявление могут оставить без движения.",
      "Если выбран не тот суд, документы могут вернуть или передать по подсудности.",
      "Если срок пропущен, может понадобиться отдельное ходатайство."
    ],
    nextSteps: [
      "Проверьте суд и подсудность.",
      "Сверьте данные сторон и требования.",
      "Проверьте приложения и госпошлину.",
      "Перед отправкой проверьте документ у юриста."
    ],
    relatedDocuments: []
  },
  {
    id: "contract",
    title: "договор",
    keywords: ["договор", "стороны договора", "предмет договора", "исполнитель", "заказчик", "арендодатель", "покупатель"],
    senderHints: ["bank", "seller", "employer", "other"],
    whatIs: "Похоже, это договор или проект договора. В нём фиксируются обязанности сторон, сроки, цена и ответственность.",
    expectedAction: "Перед подписанием важно проверить предмет, цену, сроки, порядок расторжения, штрафы и ответственность.",
    deadline: "Если договор уже подписан, проверьте сроки исполнения, оплаты, уведомлений и расторжения.",
    risks: [
      "Неясные условия могут привести к спору о деньгах, сроках или качестве.",
      "Скрытые штрафы и односторонние условия могут быть важны перед подписанием.",
      "Если вы уже получили претензию по договору, может идти срок ответа."
    ],
    nextSteps: [
      "Проверьте стороны, предмет, цену и сроки.",
      "Отдельно посмотрите штрафы, порядок отказа и подсудность.",
      "Сверьте приложения и реквизиты.",
      "При сомнениях отправьте договор юристу."
    ],
    relatedDocuments: []
  },
  {
    id: "employer_notice",
    title: "уведомление от работодателя",
    keywords: ["уведомление работодателя", "сокращение", "увольнение", "изменение условий труда", "заработная плата", "приказ работодателя"],
    senderHints: ["employer"],
    whatIs: "Похоже, это документ от работодателя: уведомление, приказ или требование по трудовым отношениям.",
    expectedAction: "Важно проверить основание, дату получения, срок ответа и последствия для зарплаты или работы.",
    deadline: "Проверьте дату получения и срок, указанный в документе. В трудовых спорах сроки часто имеют значение.",
    risks: [
      "Если подписать документ без замечаний, может быть сложнее спорить с фактами.",
      "Если пропустить срок обращения, защита трудовых прав может усложниться.",
      "Если не хватает копий документов, сначала стоит запросить их у работодателя."
    ],
    nextSteps: [
      "Не подписывайте непонятный документ без отметки о несогласии, если есть спор.",
      "Сохраните копию и дату получения.",
      "Соберите трудовой договор, расчётные листки и переписку.",
      "Подготовьте жалобу или вопрос юристу."
    ],
    relatedDocuments: []
  },
  {
    id: "alimony",
    title: "документ по алиментам",
    keywords: ["алименты", "взыскание алиментов", "содержание ребенка", "родитель", "ребенок", "исполнительный лист по алиментам"],
    senderHints: ["court", "bailiff", "other"],
    whatIs: "Похоже, это документ по алиментам: заявление, судебный акт, исполнительный документ или постановление пристава.",
    expectedAction: "Нужно понять, на какой стадии находится вопрос: подача заявления, получение судебного акта или исполнение через приставов.",
    deadline: "Проверьте дату документа, дату получения и срок, если он указан. Для жалоб и возражений сроки могут быть важны.",
    risks: [
      "Если неверно выбран порядок взыскания, заявление могут вернуть или потребуется иск вместо приказа.",
      "Если исполнительный документ не направлен на исполнение, выплаты могут задерживаться.",
      "Если есть спор о ребёнке или доходах, лучше проверить формулировки у юриста."
    ],
    nextSteps: [
      "Определите стадию: заявление, судебный акт или исполнение.",
      "Проверьте данные ребёнка, сторон и сумму.",
      "Соберите свидетельство о рождении и подтверждения проживания ребёнка.",
      "Подготовьте заявление или обращение приставу."
    ],
    relatedDocuments: []
  }
];

const unknownProfile: DocumentTypeProfile = {
  id: "unknown",
  title: "тип документа не определён",
  keywords: [],
  whatIs: "Мы не смогли точно определить тип документа. Ниже покажем общие шаги, но для точного разбора лучше отправить документ юристу.",
  expectedAction: "Можно описать ситуацию подробнее, выбрать отправителя документа или передать документ юристу на проверку.",
  deadline: "Мы не нашли явный срок в документе. Но в таких ситуациях срок может зависеть от даты получения или события.",
  risks: [
    "В документе может быть срок для ответа, жалобы или подачи заявления.",
    "Если документ связан с судом, приставами, работодателем или деньгами, лучше не откладывать проверку.",
    "Если тип документа неясен, самостоятельный ответ может быть рискованным."
  ],
  nextSteps: [
    "Проверьте, кто прислал документ.",
    "Найдите дату документа и дату получения.",
    "Посмотрите, есть ли требование что-то оплатить, подписать или отправить.",
    "Опишите ситуацию или отправьте документ юристу на проверку."
  ],
  relatedDocuments: []
};

export function analyzeDocumentCheck(input: DocumentCheckInput): DocumentCheckAnalysis {
  const sourceText = `${input.fileName ?? ""} ${input.description ?? ""}`;
  const profileScore = getBestProfile(input, sourceText);
  const profile = profileScore.profile;
  const foundDate = findFirstDate(sourceText);
  const foundAmount = findFirstAmount(sourceText);
  const foundCaseNumber = findFirstCaseNumber(sourceText);
  const detectedFacts = [
    foundDate ? `В тексте или названии найдена дата: ${foundDate}` : "",
    foundAmount ? `Возможная сумма: ${foundAmount}` : "",
    foundCaseNumber ? `Возможный номер дела или производства: ${foundCaseNumber}` : "",
    input.sender ? `Отправитель по вашему уточнению: ${getSenderLabel(input.sender)}` : ""
  ].filter(Boolean);

  return {
    confidence: profileScore.confidence,
    detectedFacts,
    expectedAction: adjustExpectedAction(profile.expectedAction, input.goal),
    foundAmount,
    foundCaseNumber,
    foundDate,
    isUnknown: profile.id === "unknown",
    nextSteps: adjustNextSteps(profile.nextSteps, input),
    relatedDocuments: profile.relatedDocuments,
    risks: adjustRisks(profile.risks, input),
    senderLabel: input.sender ? getSenderLabel(input.sender) : "Не указан",
    termText: adjustDeadlineText(profile.deadline, foundDate, input),
    typeId: profile.id,
    typeTitle: profile.title,
    whatIs: profile.whatIs
  };
}

function getBestProfile(input: DocumentCheckInput, sourceText: string) {
  const knownType = input.knownType?.trim();
  const knownProfile = knownType ? profiles.find((profile) => profile.id === knownType) : undefined;
  if (knownProfile) {
    return { confidence: "medium" as const, profile: knownProfile };
  }

  const text = normalizeText(`${sourceText} ${input.goal ?? ""} ${input.sender ?? ""}`);
  const scored = profiles
    .map((profile) => ({ profile, score: getProfileScore(profile, text, input.sender) }))
    .sort((left, right) => right.score - left.score);

  const best = scored[0];
  if (!best || best.score <= 0) return { confidence: "low" as const, profile: unknownProfile };

  return {
    confidence: best.score >= 4 ? ("high" as const) : best.score >= 2 ? ("medium" as const) : ("low" as const),
    profile: best.profile
  };
}

function getProfileScore(profile: DocumentTypeProfile, text: string, sender?: DocumentCheckSender | "") {
  const keywordScore = profile.keywords.reduce((score, keyword) => (text.includes(normalizeText(keyword)) ? score + 2 : score), 0);
  const senderScore = sender && profile.senderHints?.includes(sender) ? 1 : 0;
  return keywordScore + senderScore;
}

function adjustExpectedAction(expectedAction: string, goal?: DocumentCheckGoal | "") {
  if (goal === "check_before_send") {
    return `${expectedAction} Перед отправкой особенно важно проверить адресата, сроки, формулировки и приложения.`;
  }

  if (goal === "check_deadline") {
    return `${expectedAction} Начните с даты документа и даты фактического получения.`;
  }

  if (goal === "send_lawyer") {
    return `${expectedAction} Если документ непонятен или срок уже идёт, лучше показать его юристу.`;
  }

  return expectedAction;
}

function adjustDeadlineText(deadline: string, foundDate: string | undefined, input: DocumentCheckInput) {
  const parts = [deadline];

  if (foundDate) {
    parts.push(`В документе может быть указана дата: ${foundDate}. Проверьте, когда вы фактически получили документ.`);
  }

  if (input.urgency === "deadline_in_document") {
    parts.push("Вы отметили, что срок указан в документе. Сверьте календарную дату, способ получения и порядок подачи ответа.");
  }

  if (input.urgency === "received_today") {
    parts.push("Если документ получен сегодня, сохраните подтверждение получения: конверт, уведомление, скриншот или отметку в сервисе.");
  }

  return parts.join(" ");
}

function adjustRisks(risks: string[], input: DocumentCheckInput) {
  return [
    ...risks,
    input.urgency === "money_withdrawn" ? "Вы отметили, что деньги уже списали. Может понадобиться отдельный документ о возврате удержанных средств или снятии ареста." : "",
    input.urgency === "court_soon" ? "Если скоро суд или заседание, важно проверить, нужно ли подать документ заранее и в какой форме." : "",
    input.goal === "respond" ? "Ответ на документ лучше готовить после проверки требований, сроков и доказательств." : ""
  ].filter(Boolean);
}

function adjustNextSteps(nextSteps: string[], input: DocumentCheckInput) {
  const steps = [...nextSteps];

  if (input.goal === "check_before_send") {
    steps.push("Перед отправкой проверьте документ у юриста, если есть спорные суммы, сроки или адресат.");
  }

  if (input.goal === "send_lawyer") {
    steps.push("Добавьте комментарий, что именно нужно проверить, и отправьте документ юристу.");
  }

  return steps;
}

function findFirstDate(value: string) {
  const match = value.match(/\b([0-3]?\d[./-][01]?\d[./-](?:20)?\d{2})\b/);
  return match?.[1];
}

function findFirstAmount(value: string) {
  const match = value.match(/\b(\d[\d\s]{2,}(?:[,.]\d{1,2})?\s*(?:руб\.?|₽))\b/i);
  return match?.[1]?.replace(/\s+/g, " ");
}

function findFirstCaseNumber(value: string) {
  const match = value.match(/(?:дел[оау]?|производств[оау]?|№|N)\s*[:№N-]?\s*([А-Яа-яA-Za-z0-9/-]{3,})/i);
  return match?.[1];
}

function getSenderLabel(value: DocumentCheckSender) {
  return documentCheckSenderOptions.find((option) => option.value === value)?.label ?? "Не указан";
}

function normalizeText(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}
