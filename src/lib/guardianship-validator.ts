import {
  GUARDIANSHIP_SCENARIOS,
  type GuardianshipField,
  type GuardianshipScenarioKey
} from "@/data/guardianship-route";

export type GuardianshipValues = Record<string, string | undefined>;

export type GuardianshipIssue = { field?: string; message: string };

export type GuardianshipDocumentItem = {
  title: string;
  purpose: string;
  issuedBy: string;
  format: string;
  validity?: string;
  selfProvision: string;
  source: string;
};

export type GuardianshipDecision = {
  allowed: boolean;
  outputMode: "official-helper" | "draft" | "manual-review";
  documentTitle: string;
  draftText: string;
  issues: GuardianshipIssue[];
  notices: string[];
  requiresLegalReview: boolean;
  officialFormUrl?: string;
  providedDocuments: GuardianshipDocumentItem[];
  interagencyInformation: GuardianshipDocumentItem[];
  originals: string[];
  copies: string[];
  regionalDocuments: string[];
  additionalDocuments: string[];
  fee: string;
  deadline: string;
  filingSteps: string[];
};

const officialCandidateForm = "https://publication.pravo.gov.ru/Document/View/0001201903270001";
const reportFormFallback = "https://www.consultant.ru/document/cons_doc_LAW_88016/eaab4a5e0a11c6851796243fadc4f85804fbdd3b/";

export function getVisibleGuardianshipFields(scenarioKey: GuardianshipScenarioKey, values: GuardianshipValues) {
  return GUARDIANSHIP_SCENARIOS[scenarioKey].helperFields.filter((field) => isGuardianshipFieldVisible(scenarioKey, field.name, values));
}

export function isGuardianshipFieldVisible(
  scenarioKey: GuardianshipScenarioKey,
  fieldName: string,
  values: GuardianshipValues
) {
  if (scenarioKey === "appointment" && fieldName === "householdConsent") return values.householdAdults === "yes";
  if (scenarioKey === "parent-period") {
    if (fieldName === "parentsData") return values.applicantRole !== "child-14";
    if (fieldName === "otherRepresentative") return values.applicantRole !== "both-parents";
  }
  if (scenarioKey === "property-report") {
    const action = values.propertyAction;
    if (fieldName === "reportYear") return action === "annual-report";
    if (["operationDetails", "rightsImpact", "complexProperty", "conflictInterest"].includes(fieldName)) {
      return action === "permission" || action === "real-estate";
    }
  }
  if (scenarioKey === "refusal-inaction") {
    if (["responseDate", "refusalDetails"].includes(fieldName)) return values.responseState === "written-refusal";
    if (fieldName === "responseDeadlineExpired") return values.responseState === "no-response";
  }
  return true;
}

export function resetGuardianshipDependentValues(
  scenarioKey: GuardianshipScenarioKey,
  changedField: string,
  values: GuardianshipValues
) {
  const next = { ...values };
  if (scenarioKey === "appointment" && changedField === "householdAdults" && next.householdAdults !== "yes") {
    delete next.householdConsent;
  }
  if (scenarioKey === "parent-period" && changedField === "applicantRole") {
    if (next.applicantRole === "child-14") {
      delete next.parentsData;
      delete next.otherRepresentative;
    } else if (next.applicantRole === "both-parents") {
      delete next.otherRepresentative;
    }
  }
  if (scenarioKey === "property-report" && changedField === "propertyAction") {
    if (next.propertyAction !== "annual-report") delete next.reportYear;
    if (!(["permission", "real-estate"].includes(next.propertyAction ?? ""))) {
      delete next.operationDetails;
      delete next.rightsImpact;
      delete next.complexProperty;
      delete next.conflictInterest;
    }
  }
  if (scenarioKey === "refusal-inaction" && changedField === "responseState" && next.responseState !== "written-refusal") {
    delete next.responseDate;
    delete next.refusalDetails;
  }
  if (scenarioKey === "refusal-inaction" && changedField === "responseState" && next.responseState !== "no-response") {
    delete next.responseDeadlineExpired;
  }
  return next;
}

export function validateGuardianshipApplication(
  scenarioKey: GuardianshipScenarioKey,
  inputValues: GuardianshipValues
): GuardianshipDecision {
  const values = normalize(inputValues);
  const issues: GuardianshipIssue[] = [];
  const notices: string[] = [];
  const visibleFields = getVisibleGuardianshipFields(scenarioKey, values);

  for (const field of visibleFields.filter((item) => item.required)) {
    if (!values[field.name]) issues.push({ field: field.name, message: `Заполните поле «${field.label}».` });
  }

  const base = baseDecision(scenarioKey, values, issues, notices);
  if (scenarioKey === "appointment") validateAppointment(values, base);
  if (scenarioKey === "parent-period") validateParentPeriod(values, base);
  if (scenarioKey === "property-report") validateProperty(values, base);
  if (scenarioKey === "refusal-inaction") validateComplaint(values, base);
  base.allowed = base.issues.length === 0 && base.outputMode !== "manual-review";
  return base;
}

function validateAppointment(values: GuardianshipValues, decision: GuardianshipDecision) {
  const childAge = numericAge(values.childAge);
  const candidateAge = numericAge(values.candidateAge);
  if (childAge === null || childAge < 0 || childAge >= 18) {
    decision.issues.push({ field: "childAge", message: "Маршрут применяется только к ребёнку младше 18 лет." });
  }
  if (candidateAge === null || candidateAge < 18) {
    decision.issues.push({ field: "candidateAge", message: "Опекуном или попечителем может быть только совершеннолетний кандидат." });
  }
  if (values.candidateCapacity !== "yes") {
    decision.issues.push({ field: "candidateCapacity", message: "Без подтверждённой полной дееспособности подготовка документа невозможна." });
  }
  if (values.candidateObstacles !== "no") {
    decision.issues.push({ field: "candidateObstacles", message: "Препятствия или неопределённость должен проверить орган опеки до подготовки заявления." });
  }
  if (values.householdAdults === "yes" && values.householdConsent !== "yes") {
    decision.issues.push({ field: "householdConsent", message: "Для общего порядка требуется письменное согласие совместно проживающих совершеннолетних членов семьи с учётом мнения детей от 10 лет." });
  }
  if (values.urgentNeed === "unsure" || !values.urgentNeed) {
    decision.issues.push({ field: "urgentNeed", message: "Нужно определить, требуется ли немедленное предварительное назначение." });
  }

  const isPreliminary = values.urgentNeed === "yes";
  const childStatus = childAge !== null && childAge >= 14 ? "попечителя" : "опекуна";
  if (!isPreliminary && values.childWithoutCare !== "yes") {
    decision.issues.push({ field: "childWithoutCare", message: "Обычное назначение в этом маршруте применяется к ребёнку, оставшемуся без попечения родителей. Проверьте маршрут заявления родителей по статье 13." });
  }
  if (isPreliminary && values.childWithoutCare !== "yes") {
    decision.requiresLegalReview = true;
    decision.notices.push("Не подтверждён статус отсутствия попечения родителей. Срочность и основание предварительной опеки должен определить орган опеки.");
  }

  if (isPreliminary) {
    decision.outputMode = "draft";
    decision.documentTitle = `Обращение об установлении предварительной ${childStatus === "опекуна" ? "опеки" : "попечительства"}`;
    decision.requiresLegalReview = true;
    decision.draftText = buildPreliminaryRequest(values, childStatus);
    decision.providedDocuments = [
      item("Документ, удостоверяющий личность", "Подтверждает личность совершеннолетнего кандидата.", "компетентный орган, выдавший документ", "оригинал для предъявления", "предъявляет кандидат", "статья 12 Закона № 48-ФЗ"),
      item("Черновик обращения", "Фиксирует просьбу о немедленном назначении и обстоятельства.", "составляет заявитель", "свободная форма; проверить в органе", "предоставляет заявитель", "федеральная форма не подтверждена")
    ];
    decision.originals = ["Паспорт или иной документ, удостоверяющий личность."];
    decision.additionalDocuments = ["Документы о срочности и положении ребёнка — только по подтверждённому запросу органа."];
    decision.deadline = "Предварительная опека прекращается через 6 месяцев; при исключительных обстоятельствах срок может быть увеличен до 8 месяцев.";
  } else {
    decision.outputMode = "official-helper";
    decision.documentTitle = `Данные для официального заявления кандидата о назначении ${childStatus}`;
    decision.officialFormUrl = officialCandidateForm;
    decision.providedDocuments = candidateDocuments(values);
    decision.interagencyInformation = [
      item("Сведения о зарегистрированных совместно гражданах", "Проверка состава проживающих.", "компетентные органы и реестры", "межведомственные сведения", "самостоятельно не запрашиваются, если орган получает сведения межведомственно", "пункт 5 Правил № 423"),
      item("Сведения об установленных законом препятствиях", "Проверка части сведений о кандидате.", "компетентные органы и реестры", "межведомственные сведения", "самостоятельно не запрашиваются в части межведомственного обмена", "пункты 4-6(1) Правил № 423")
    ];
    decision.originals = ["Документ, удостоверяющий личность.", "Оригиналы приложенных документов до вынесения решения."];
    decision.copies = ["Свидетельство о браке — если заявитель состоит в браке и документ применим.", "Свидетельство о подготовке — если освобождение не применяется."];
    decision.deadline = "Орган запрашивает подтверждение сведений в течение 2 рабочих дней; обследование проводится в течение 3 рабочих дней после получения подтверждений. Итоговый срок зависит от межведомственных ответов.";
  }
}

function validateParentPeriod(values: GuardianshipValues, decision: GuardianshipDecision) {
  const childAge = numericAge(values.childAge);
  if (childAge === null || childAge < 0 || childAge >= 18) {
    decision.issues.push({ field: "childAge", message: "Укажите возраст несовершеннолетнего от 0 до 17 лет." });
  }
  if (values.applicantRole === "child-14" && (childAge === null || childAge < 14)) {
    decision.issues.push({ field: "childAge", message: "Заявление самого несовершеннолетнего допускается только после достижения 14 лет." });
  }
  if (values.applicantRole === "one-parent" || values.applicantRole === "unsure") {
    decision.outputMode = "manual-review";
    decision.requiresLegalReview = true;
    decision.issues.push({ field: "applicantRole", message: "Часть 1 статьи 13 предусматривает совместное заявление родителей. Односторонний случай требует индивидуальной проверки." });
  }
  if (values.nomineeConsent !== "yes") {
    decision.issues.push({ field: "nomineeConsent", message: "Без согласия предлагаемого лица подготовка заявления небезопасна." });
  }
  if (values.childInterests !== "no") {
    decision.issues.push({ field: "childInterests", message: "При сомнении в интересах ребёнка кандидатуру должен сначала проверить орган опеки." });
  }
  if (values.otherRepresentative === "yes" || values.otherRepresentative === "unsure") {
    decision.outputMode = "manual-review";
    decision.requiresLegalReview = true;
    decision.issues.push({ field: "otherRepresentative", message: "Позиция второго представителя не определена. Нужна индивидуальная проверка применимости статьи 13." });
  }
  if (values.periodStart && values.periodEnd && values.periodEnd < values.periodStart) {
    decision.issues.push({ field: "periodEnd", message: "Дата окончания не может быть раньше даты начала." });
  }

  decision.outputMode = decision.outputMode === "manual-review" ? "manual-review" : "draft";
  decision.documentTitle = values.applicantRole === "child-14"
    ? "Заявление несовершеннолетнего о назначении конкретного попечителя"
    : "Совместное заявление родителей о назначении опекуна или попечителя на определённый период";
  decision.requiresLegalReview = true;
  decision.draftText = buildParentPeriodRequest(values);
  decision.providedDocuments = [
    item("Документы, удостоверяющие личности заявителей", "Подтверждают личность и возраст.", "компетентные органы, выдавшие документы", "оригиналы", "предъявляют заявители", "статья 13 Закона № 48-ФЗ"),
    item("Черновик заявления", "Указывает лицо, причину и определённый период.", "составляют заявители", "свободная форма; проверить в органе", "предоставляют заявители", "статья 13 Закона № 48-ФЗ")
  ];
  decision.originals = ["Документы, удостоверяющие личности заявителей и предлагаемого лица."];
  decision.regionalDocuments = ["Подтверждения уважительной причины и региональный способ подачи — уточнить в выбранном органе."];
  decision.deadline = "Срок полномочий указывается в акте органа опеки. Универсальный срок принятия решения для всех регионов не подтверждён.";
}

function validateProperty(values: GuardianshipValues, decision: GuardianshipDecision) {
  const action = values.propertyAction;
  if (action === "unsure" || !action) {
    decision.outputMode = "manual-review";
    decision.issues.push({ field: "propertyAction", message: "Сначала определите результат: отчёт, номинальный счёт или имущественное разрешение." });
    return;
  }
  if (action === "annual-report") {
    if (!values.reportYear) decision.issues.push({ field: "reportYear", message: "Укажите отчётный год." });
    decision.outputMode = "official-helper";
    decision.documentTitle = "Данные для официального ежегодного отчёта опекуна";
    decision.officialFormUrl = reportFormFallback;
    decision.providedDocuments = [
      item("Официальная форма отчёта", "Фиксирует имущество, доходы и расходы за год.", "заполняет опекун по утверждённой форме", "утверждённая форма; не заменять свободным текстом", "предоставляет опекун", "Постановление Правительства РФ № 423"),
      item("Платёжные документы", "Подтверждают отражённые доходы и расходы, кроме исключённых законом мелких бытовых расходов.", "банки, продавцы, налоговые и иные компетентные организации", "копии", "предоставляет опекун, когда документ подтверждает включённые в отчёт сведения", "статья 25 Закона № 48-ФЗ")
    ];
    decision.copies = ["Товарные чеки, налоговые квитанции, страховые и другие платёжные документы — когда они подтверждают сведения отчёта."];
    decision.deadline = "Опекун-гражданин представляет отчёт за предыдущий год не позднее 1 февраля, если договором не установлен иной срок.";
    return;
  }
  if (action === "nominal-account") {
    decision.outputMode = "official-helper";
    decision.documentTitle = "Памятка по выплатам и отдельному номинальному счёту";
    decision.notices.push("Это информационный результат, а не заявление в банк или орган опеки.");
    decision.providedDocuments = [
      item("Документы банка по номинальному счёту", "Подтверждают реквизиты счёта и операции.", "банк, в котором открыт счёт", "по правилам банка", "получает и хранит опекун", "статья 37 ГК РФ"),
      item("Подтверждения целевого расходования", "Нужны для отчётности в предусмотренных законом пределах.", "продавцы, банки и иные участники расчётов", "копии", "предоставляет опекун в применимых пределах", "статья 25 Закона № 48-ФЗ")
    ];
    decision.deadline = "Отчётность по расходованию включается в ежегодный отчёт в применимых пределах.";
    return;
  }

  if (!values.operationDetails) decision.issues.push({ field: "operationDetails", message: "Опишите действие и его условия." });
  if (!values.rightsImpact) decision.issues.push({ field: "rightsImpact", message: "Опишите, как сохраняются права и имущество ребёнка." });
  if (values.conflictInterest === "yes") {
    decision.outputMode = "manual-review";
    decision.requiresLegalReview = true;
    decision.issues.push({ field: "conflictInterest", message: "Конфликт интересов и сделки с опекуном или его близкими нельзя автоматизировать." });
  } else {
    decision.outputMode = "draft";
  }
  if (action === "real-estate" || values.complexProperty !== "no" || values.conflictInterest !== "no") {
    decision.requiresLegalReview = true;
    decision.notices.push("Сложный имущественный случай: черновик нельзя считать готовым разрешением или гарантией законности сделки.");
  }
  decision.documentTitle = "Обращение за предварительным разрешением на распоряжение имуществом подопечного";
  decision.draftText = buildPropertyPermissionRequest(values);
  decision.providedDocuments = [
    item("Черновик обращения", "Описывает имущество, действие и сохранение прав ребёнка.", "составляет заявитель", "свободная форма; проверить в органе", "предоставляет заявитель", "статьи 20-21 Закона № 48-ФЗ"),
    item("Документы на имущество", "Подтверждают право ребёнка и характеристики объекта.", "Росреестр, нотариус или иной компетентный источник — по виду имущества", "оригиналы и копии по запросу", "способ получения и межведомственного обмена проверяется по региональному регламенту", "статьи 20-21 Закона № 48-ФЗ")
  ];
  decision.originals = ["Правоустанавливающие документы — для сверки органом, если это предусмотрено способом подачи."];
  decision.copies = ["Проект сделки, оценка и документы о приобретаемом объекте — если применимы и подтверждены местным регламентом."];
  decision.regionalDocuments = ["Конкретный перечень приложений и электронный канал подачи зависят от регионального регламента."];
  decision.deadline = "Письменное разрешение или мотивированный отказ — не позднее 15 дней с даты подачи заявления.";
}

function validateComplaint(values: GuardianshipValues, decision: GuardianshipDecision) {
  if (values.responseState === "oral-refusal") {
    decision.outputMode = "manual-review";
    decision.issues.push({ field: "responseState", message: "Сначала подайте и зарегистрируйте письменное обращение либо запросите письменное решение." });
  }
  if (values.responseState === "unsure" || !values.responseState) {
    decision.outputMode = "manual-review";
    decision.issues.push({ field: "responseState", message: "Нужно определить, есть письменный отказ или подтверждённое отсутствие ответа." });
  }
  if (values.complaintChannel === "court" || values.complaintChannel === "unsure") {
    decision.outputMode = "manual-review";
    decision.requiresLegalReview = true;
    decision.issues.push({ field: "complaintChannel", message: "Судебная форма, подсудность, срок и пошлина требуют индивидуальной процессуальной проверки." });
  }
  if (values.responseState === "written-refusal" && (!values.responseDate || !values.refusalDetails)) {
    decision.issues.push({ field: "refusalDetails", message: "Для письменного отказа укажите дату, реквизиты и причины." });
  }
  if (values.responseState === "no-response" && values.responseDeadlineExpired !== "yes") {
    decision.outputMode = "manual-review";
    decision.issues.push({
      field: "responseDeadlineExpired",
      message: "Бездействие нельзя подтверждать автоматически, пока не установлен и не истёк применимый срок ответа. Сверьте срок исходной процедуры."
    });
  }
  if (values.urgentThreat === "yes" || values.urgentThreat === "unsure") {
    decision.requiresLegalReview = true;
    decision.notices.push("При непосредственной угрозе жизни или здоровью ребёнка не ждите подготовки документа: обратитесь в экстренные и компетентные органы.");
  }
  if (decision.outputMode !== "manual-review") decision.outputMode = "draft";
  decision.requiresLegalReview = true;
  decision.documentTitle = values.responseState === "no-response"
    ? "Жалоба на бездействие органа опеки"
    : "Жалоба на решение органа опеки";
  decision.draftText = buildComplaint(values);
  decision.providedDocuments = [
    item("Исходное обращение", "Подтверждает предмет и объём просьбы.", "составляет заявитель", "копия", "предоставляет заявитель", "фактическое основание жалобы"),
    item("Подтверждение подачи", "Подтверждает дату регистрации.", "орган или сервис, принявший обращение", "копия", "предоставляет заявитель", "фактическое основание жалобы"),
    item("Письменный отказ", "Подтверждает оспариваемое решение и мотивы.", "орган опеки", "копия, если получен", "не требуется при подтверждённом бездействии", "фактическое основание жалобы")
  ];
  decision.copies = ["Исходное обращение и подтверждение его регистрации.", "Письменный отказ и приложения — если получены."];
  decision.additionalDocuments = ["Документы о правах заявителя и затронутых интересах ребёнка."];
  decision.deadline = "Универсальный срок не подтверждается: он определяется по исходной процедуре и выбранному способу обжалования.";
}

function baseDecision(
  scenarioKey: GuardianshipScenarioKey,
  values: GuardianshipValues,
  issues: GuardianshipIssue[],
  notices: string[]
): GuardianshipDecision {
  const scenario = GUARDIANSHIP_SCENARIOS[scenarioKey];
  return {
    allowed: false,
    outputMode: "official-helper",
    documentTitle: scenario.mainDocument,
    draftText: "",
    issues,
    notices,
    requiresLegalReview: false,
    providedDocuments: [],
    interagencyInformation: [],
    originals: [],
    copies: [],
    regionalDocuments: ["Региональный способ подачи и местный регламент необходимо проверить вручную."],
    additionalDocuments: [],
    fee: scenario.fee,
    deadline: scenario.term,
    filingSteps: [
      `Проверьте официальное наименование: ${values.authorityName || "орган опеки не указан"}.`,
      `Уточните компетенцию для муниципального образования: ${values.municipality || "не указано"}.`,
      "Сверьте региональный способ подачи и часы приёма на официальном сайте органа.",
      "Подготовьте документ и персональные приложения.",
      "Предъявите оригиналы, если это предусмотрено применимым порядком.",
      "Получите подтверждение регистрации обращения.",
      "Получите письменное решение и проверьте срок, условия и реквизиты.",
      "При отказе сохраните полный текст решения для выбора способа обжалования."
    ]
  };
}

function candidateDocuments(values: GuardianshipValues): GuardianshipDocumentItem[] {
  const result = [
    item("Краткая автобиография", "Сведения о кандидате.", "составляет кандидат", "оригинал", "предоставляет кандидат", "пункт 4 Правил № 423"),
    item("Подтверждение дохода", "Подтверждает доход кандидата либо супруга.", "работодатель или иной компетентный источник дохода", "оригинал или иной подтверждающий документ", "предоставляет кандидат в предусмотренном Правилами случае", "пункт 4 Правил № 423", "1 год со дня выдачи для документа, указанного Правилами"),
    item("Медицинское заключение", "Подтверждает результаты освидетельствования кандидата.", "медицинская организация по приказу Минздрава № 254н", "форма по приказу Минздрава № 254н", "предоставляет кандидат", "пункт 4 Правил № 423", "6 месяцев со дня выдачи"),
    item("Письменное согласие членов семьи", "Подтверждает согласие совместно проживающих совершеннолетних с учётом мнения детей от 10 лет.", "составляют соответствующие члены семьи", "оригинал", "предоставляет кандидат, если такие лица совместно проживают", "пункт 4 Правил № 423")
  ];
  if (values.closeRelative !== "yes") {
    result.push(item("Свидетельство о прохождении подготовки", "Подтверждает обязательную подготовку кандидата.", "уполномоченная организация подготовки", "копия", "не предоставляется при подтверждённом законом освобождении", "пункт 4 Правил № 423"));
  }
  return result;
}

function buildPreliminaryRequest(values: GuardianshipValues, role: string) {
  return `В ${value(values, "authorityName")}\n\nОт: ${value(values, "candidateData")}\n\nОБРАЩЕНИЕ\nоб установлении предварительной опеки или попечительства\n\nПрошу рассмотреть вопрос о немедленном временном назначении меня в качестве ${role} в отношении ребёнка: ${value(values, "childData")}.\n\nОбстоятельства: ребёнок ${values.childWithoutCare === "yes" ? "остался без попечения родителей" : "нуждается в срочной оценке органом опеки"}. Прошу провести обследование условий моей жизни и принять письменный акт в пределах статьи 12 Федерального закона № 48-ФЗ.\n\nМне известно, что предварительно назначенный опекун или попечитель не вправе распоряжаться имуществом подопечного.\n\nДата: ____________    Подпись: ____________`;
}

function buildParentPeriodRequest(values: GuardianshipValues) {
  const isChild = values.applicantRole === "child-14";
  return `В ${value(values, "authorityName")}\n\nЗаявитель: ${isChild ? value(values, "childData") : value(values, "parentsData")}\n\nЗАЯВЛЕНИЕ\nо назначении конкретного ${Number(values.childAge) < 14 ? "опекуна" : "попечителя"}\n\n${isChild ? "Прошу назначить" : "Просим назначить"} ${value(values, "nomineeData")} ${Number(values.childAge) < 14 ? "опекуном" : "попечителем"} ребёнка ${value(values, "childData")} на период с ${value(values, "periodStart")} по ${value(values, "periodEnd")}.\n\nПричина: ${value(values, "reason")}\n\nПредлагаемое лицо согласно на назначение. Просим проверить соответствие назначения закону и интересам ребёнка и выдать письменный акт.\n\nДата: ____________    Подпись (подписи): ____________`;
}

function buildPropertyPermissionRequest(values: GuardianshipValues) {
  return `В ${value(values, "authorityName")}\n\nОт: ${value(values, "guardianData")}\n\nОБРАЩЕНИЕ\nо предварительном разрешении на распоряжение имуществом подопечного\n\nПодопечный: ${value(values, "childData")}\n\nИмущество и относящиеся к нему сведения: ${value(values, "assetDetails")}\n\nПредполагаемое действие: ${value(values, "operationDetails")}\n\nСохранение прав и интересов ребёнка: ${value(values, "rightsImpact")}\n\nПрошу рассмотреть обращение, проверить соответствие предполагаемого действия интересам подопечного и выдать письменное предварительное разрешение либо мотивированный отказ.\n\nДата: ____________    Подпись: ____________`;
}

function buildComplaint(values: GuardianshipValues) {
  const addressee = values.complaintChannel === "prosecutor" ? "В прокуратуру (компетенцию уточнить)" : "В вышестоящий орган (компетенцию уточнить)";
  return `${addressee}\n\nОт: ${value(values, "applicantData")}\n\nЖАЛОБА\nна ${values.responseState === "no-response" ? "бездействие" : "решение"} органа опеки и попечительства\n\n${value(values, "initialRequestDate")} я обратился(ась) в ${value(values, "authorityName")} со следующим вопросом: ${value(values, "requestedAction")}\n\nПодтверждение подачи: ${value(values, "filingProof")}\n\n${values.responseState === "written-refusal" ? `Получен письменный отказ от ${value(values, "responseDate")}: ${value(values, "refusalDetails")}` : "На дату подготовки жалобы ответ не получен. Заявитель подтверждает, что применимый срок ответа по исходной процедуре истёк."}\n\nЗатронутые права и интересы ребёнка: ${value(values, "childInterest")}\n\nПрошу проверить законность решения или бездействия в пределах компетенции адресата, сообщить результат письменно и разъяснить порядок дальнейшего обжалования.\n\nДата: ____________    Подпись: ____________`;
}

function item(title: string, purpose: string, issuedBy: string, format: string, selfProvision: string, source: string, validity?: string): GuardianshipDocumentItem {
  return { title, purpose, issuedBy, format, selfProvision, source, validity };
}

function normalize(values: GuardianshipValues) {
  return Object.fromEntries(Object.entries(values).map(([key, raw]) => [key, raw?.trim() || undefined]));
}

function numericAge(raw: string | undefined) {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function value(values: GuardianshipValues, key: string) {
  return values[key] || "не указано";
}

export function fieldByName(scenarioKey: GuardianshipScenarioKey, name: string): GuardianshipField | undefined {
  return GUARDIANSHIP_SCENARIOS[scenarioKey].helperFields.find((field) => field.name === name);
}
