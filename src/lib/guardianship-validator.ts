import {
  GUARDIANSHIP_SCENARIOS,
  type GuardianshipField,
  type GuardianshipScenarioKey
} from "@/data/guardianship-route";
import {
  findGuardianshipTerritory,
  GUARDIANSHIP_DIRECTORY_METADATA,
  RUSSIAN_REGIONS,
  TERRITORY_NOT_FOUND_ID
} from "@/data/guardianship-territories";

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

export const GUARDIANSHIP_OUTCOME_KEYS = [
  "urgent-protection",
  "appointment-standard-child",
  "appointment-standard-candidate",
  "appointment-preliminary",
  "parent-period-parents",
  "parent-period-child-14",
  "parent-period-single-parent-review",
  "annual-report-citizen",
  "annual-report-organization",
  "nominal-account",
  "property-permission-standard",
  "property-permission-complex",
  "oral-refusal-registration",
  "refusal-higher-authority",
  "refusal-prosecutor",
  "refusal-court",
  "inaction-higher-authority",
  "inaction-prosecutor",
  "inaction-court",
  "unresolved"
] as const;

export type GuardianshipOutcomeKey = (typeof GUARDIANSHIP_OUTCOME_KEYS)[number];
export type GuardianshipResultKind = "data-sheet" | "checklist" | "draft" | "urgent";

export type GuardianshipDecision = {
  allowed: boolean;
  outputMode: "official-helper" | "draft" | "manual-review" | "urgent";
  outcomeKey: GuardianshipOutcomeKey;
  resultKind: GuardianshipResultKind;
  resultLabel: string;
  pdfAvailable: boolean;
  lawyerReviewAvailable: boolean;
  filingReady: boolean;
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
const emergencySource = "https://mchs.gov.ru/deyatelnost/bezopasnost-grazhdan/kak-pravilno-vyzvat-skoruyu_5";
const prosecutorReception = "https://epp.genproc.gov.ru/web/gprf/internet-reception/personal-receptionrequest";

export function getVisibleGuardianshipFields(scenarioKey: GuardianshipScenarioKey, values: GuardianshipValues) {
  return GUARDIANSHIP_SCENARIOS[scenarioKey].helperFields.filter((field) => isGuardianshipFieldVisible(scenarioKey, field.name, values));
}

export function isGuardianshipFieldVisible(
  scenarioKey: GuardianshipScenarioKey,
  fieldName: string,
  values: GuardianshipValues
) {
  if (fieldName !== "immediateThreat" && values.immediateThreat === "yes") return false;
  if (scenarioKey === "appointment") {
    const preliminary = values.urgentNeed === "yes";
    if (["candidateObstacles", "candidateMaritalStatus", "closeRelative", "householdAdults", "householdConsent"].includes(fieldName)) {
      if (preliminary) return false;
      if (fieldName === "householdConsent") return values.householdAdults === "yes";
    }
    if (fieldName === "childData") return preliminary || values.knownChild !== "no";
  }
  if (scenarioKey === "parent-period") {
    const parentsOnly = ["reason", "periodStart", "periodEnd", "parentsData"];
    if (parentsOnly.includes(fieldName)) return values.applicantRole !== "child-14";
  }
  if (scenarioKey === "property-report") {
    const action = values.propertyAction;
    if (["guardianData", "childData", "assetDetails"].includes(fieldName)) return action !== "nominal-account";
    if (fieldName === "guardianType") return action === "annual-report";
    if (fieldName === "reportYear") return action === "annual-report";
    if (fieldName === "operationType") return action === "permission" || action === "real-estate";
    if (["operationDetails", "rightsImpact", "complexProperty", "conflictInterest"].includes(fieldName)) {
      return action === "permission" || action === "real-estate";
    }
  }
  if (scenarioKey === "refusal-inaction") {
    if (["responseDate", "refusalDetails"].includes(fieldName)) return values.responseState === "written-refusal";
    if (fieldName === "responseDeadlineExpired") return values.responseState === "no-response";
  }
  if (fieldName === "authorityName") return values.municipality !== TERRITORY_NOT_FOUND_ID;
  return true;
}

export function resetGuardianshipDependentValues(
  scenarioKey: GuardianshipScenarioKey,
  changedField: string,
  values: GuardianshipValues
) {
  const next = { ...values };
  if (changedField === "region") {
    delete next.municipality;
    delete next.authorityName;
  }
  if (changedField === "municipality") delete next.authorityName;
  if (scenarioKey === "appointment" && changedField === "householdAdults" && next.householdAdults !== "yes") {
    delete next.householdConsent;
  }
  if (scenarioKey === "parent-period" && changedField === "applicantRole") {
    if (next.applicantRole === "child-14") {
      delete next.reason;
      delete next.periodStart;
      delete next.periodEnd;
      delete next.parentsData;
    }
  }
  if (scenarioKey === "property-report" && changedField === "propertyAction") {
    if (next.propertyAction !== "annual-report") {
      delete next.guardianType;
      delete next.reportYear;
    }
    if (!(["permission", "real-estate"].includes(next.propertyAction ?? ""))) {
      delete next.operationType;
      delete next.operationDetails;
      delete next.rightsImpact;
      delete next.complexProperty;
      delete next.conflictInterest;
    }
  }
  if (changedField === "immediateThreat" && next.immediateThreat === "yes") {
    return { immediateThreat: "yes" };
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
  const rawValues = normalize(inputValues);
  const issues: GuardianshipIssue[] = [];
  const notices: string[] = [];
  const visibleFields = getVisibleGuardianshipFields(scenarioKey, rawValues);

  for (const field of visibleFields.filter((item) => item.required)) {
    if (!rawValues[field.name]) issues.push({ field: field.name, message: `Заполните поле «${field.label}».` });
  }

  if (rawValues.immediateThreat === "yes") {
    return urgentProtectionDecision();
  }
  if (rawValues.immediateThreat !== "no") {
    issues.push({
      field: "immediateThreat",
      message: "Сначала определите, есть ли непосредственная угроза жизни или здоровью ребёнка. При возможной угрозе звоните 112."
    });
  }

  validateGuardianshipTerritory(rawValues, issues);
  const values = resolveGuardianshipTerritoryValues(rawValues);

  const base = baseDecision(scenarioKey, values, issues, notices);
  if (scenarioKey === "appointment") validateAppointment(values, base);
  if (scenarioKey === "parent-period") validateParentPeriod(values, base);
  if (scenarioKey === "property-report") validateProperty(values, base);
  if (scenarioKey === "refusal-inaction") validateComplaint(values, base);
  base.allowed = base.issues.length === 0 && base.outputMode !== "manual-review";
  const missingRequired = base.issues.some(({ message }) => message.startsWith("Заполните поле"));
  const unverifiedAuthority = base.issues.some(({ field }) => ["region", "municipality", "authorityName"].includes(field ?? ""));
  const manualChecklist = base.outputMode === "manual-review" && base.outcomeKey !== "unresolved";
  if (base.issues.length && !manualChecklist) base.draftText = "";
  base.pdfAvailable = !missingRequired
    && !unverifiedAuthority
    && base.outcomeKey !== "unresolved"
    && (base.issues.length === 0 || manualChecklist);
  base.lawyerReviewAvailable = base.pdfAvailable;
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
  if (values.urgentNeed === "unsure" || !values.urgentNeed) {
    decision.issues.push({ field: "urgentNeed", message: "Нужно определить, требуется ли немедленное предварительное назначение." });
  }

  const isPreliminary = values.urgentNeed === "yes";
  const childStatus = childAge !== null && childAge >= 14 ? "попечителя" : "опекуна";
  if (values.knownChild === "unsure" || !values.knownChild) {
    decision.issues.push({ field: "knownChild", message: "Уточните, подаётся заявление для конкретного ребёнка или для получения заключения о возможности быть опекуном." });
  }
  if (isPreliminary && values.knownChild !== "yes") {
    decision.issues.push({ field: "knownChild", message: "Предварительное назначение применяется в отношении конкретного гражданина, которому немедленно нужен опекун или попечитель." });
  }
  if (values.knownChild === "yes" && !values.childData) {
    decision.issues.push({ field: "childData", message: "Укажите сведения о конкретном ребёнке." });
  }
  if (!isPreliminary && values.candidateObstacles !== "no") {
    decision.issues.push({ field: "candidateObstacles", message: "Препятствия или неопределённость должен проверить орган опеки до подготовки данных для общего порядка." });
  }
  if (!isPreliminary && values.candidateMaritalStatus === "unsure") {
    decision.issues.push({ field: "candidateMaritalStatus", message: "Уточните семейное положение: от него зависит приложение копии свидетельства о браке." });
  }
  if (!isPreliminary && values.householdAdults === "yes" && values.householdConsent !== "yes") {
    decision.issues.push({ field: "householdConsent", message: "Для общего порядка требуется письменное согласие совместно проживающих совершеннолетних членов семьи с учётом мнения детей от 10 лет." });
  }
  if (!isPreliminary && values.childWithoutCare !== "yes") {
    decision.issues.push({ field: "childWithoutCare", message: "Обычное назначение в этом маршруте применяется к ребёнку, оставшемуся без попечения родителей. Проверьте маршрут заявления родителей по статье 13." });
  }
  if (isPreliminary && values.childWithoutCare !== "yes") {
    decision.requiresLegalReview = true;
    decision.notices.push("Не подтверждён статус отсутствия попечения родителей. Срочность и основание предварительной опеки должен определить орган опеки.");
  }

  if (isPreliminary) {
    decision.outcomeKey = "appointment-preliminary";
    decision.outputMode = "draft";
    decision.resultKind = "draft";
    decision.resultLabel = "Маркированный черновик обращения";
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
    decision.filingSteps = authoritySteps(values, [
      "Предъявите документ, удостоверяющий личность. Для предварительного назначения закон также требует обследования условий жизни органом опеки.",
      "Передайте обращение в орган опеки и получите подтверждение регистрации.",
      "Получите письменный акт о предварительной опеке или попечительстве.",
      "Не распоряжайтесь имуществом ребёнка: предварительно назначенный опекун или попечитель такого права не имеет.",
      "До истечения срока пройдите общий порядок назначения, если опека или попечительство должны продолжиться."
    ]);
  } else {
    const appointmentForChild = values.knownChild === "yes";
    decision.outcomeKey = appointmentForChild ? "appointment-standard-child" : "appointment-standard-candidate";
    decision.outputMode = "official-helper";
    decision.resultKind = "data-sheet";
    decision.resultLabel = "Лист подготовленных данных для официальной формы";
    decision.documentTitle = appointmentForChild
      ? `Данные для официального заявления кандидата о назначении ${childStatus}`
      : "Данные для официального заявления о выдаче заключения о возможности быть опекуном или попечителем";
    decision.officialFormUrl = officialCandidateForm;
    decision.providedDocuments = candidateDocuments(values);
    decision.interagencyInformation = [
      item("Сведения о зарегистрированных совместно гражданах", "Проверка состава проживающих.", "компетентные органы и реестры", "межведомственные сведения", "самостоятельно не запрашиваются, если орган получает сведения межведомственно", "пункт 5 Правил № 423"),
      item("Сведения об установленных законом препятствиях", "Проверка части сведений о кандидате.", "компетентные органы и реестры", "межведомственные сведения", "самостоятельно не запрашиваются в части межведомственного обмена", "пункты 4-6(1) Правил № 423")
    ];
    decision.originals = ["Документ, удостоверяющий личность.", "Оригиналы приложенных документов до вынесения решения."];
    decision.copies = [
      ...(values.candidateMaritalStatus === "yes" ? ["Копия свидетельства о браке."] : []),
      ...(values.closeRelative !== "yes" ? ["Копия свидетельства о прохождении подготовки."] : [])
    ];
    decision.deadline = "Орган направляет межведомственные запросы в течение 2 рабочих дней. После подтверждения сведений обследование проводится в течение 3 рабочих дней, решение принимается в течение 10 рабочих дней, а акт или заключение направляется заявителю в течение 3 дней после подписания.";
    decision.filingSteps = authoritySteps(values, [
      "Откройте действующую официальную форму заявления и перенесите в неё подготовленные сведения.",
      "Приложите только документы, которые предоставляет кандидат по федеральным Правилам и вашим ответам.",
      "Подайте заявление лично либо через предусмотренный Правилами № 423 электронный канал или МФЦ, если для выбранного органа такой канал технически доступен и действует соглашение о взаимодействии.",
      "Сохраните подтверждение регистрации и акт обследования условий жизни.",
      appointmentForChild
        ? "Получите письменный акт о назначении либо отказ; при отказе сохраните полный мотивированный текст."
        : "Получите заключение о возможности быть опекуном или попечителем; после постановки на учёт орган предоставляет сведения о детях и направление для посещения ребёнка."
    ]);
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
    decision.outcomeKey = values.applicantRole === "one-parent" ? "parent-period-single-parent-review" : "unresolved";
    decision.resultKind = "checklist";
    decision.resultLabel = "Лист юридической проверки применимого порядка";
    decision.requiresLegalReview = true;
    decision.issues.push({ field: "applicantRole", message: "Часть 1 статьи 13 предусматривает совместное заявление родителей. Односторонний случай требует индивидуальной проверки." });
  }
  if (values.nomineeConsent !== "yes") {
    decision.issues.push({ field: "nomineeConsent", message: "Без согласия предлагаемого лица подготовка заявления небезопасна." });
  }
  if (values.childInterests !== "no") {
    decision.issues.push({ field: "childInterests", message: "При сомнении в интересах ребёнка кандидатуру должен сначала проверить орган опеки." });
  }
  const isChildApplication = values.applicantRole === "child-14";
  if (!isChildApplication && values.periodStart && values.periodEnd && values.periodEnd < values.periodStart) {
    decision.issues.push({ field: "periodEnd", message: "Дата окончания не может быть раньше даты начала." });
  }

  decision.outputMode = decision.outputMode === "manual-review" ? "manual-review" : "draft";
  decision.outcomeKey = decision.outputMode === "manual-review"
    ? decision.outcomeKey
    : isChildApplication ? "parent-period-child-14" : "parent-period-parents";
  decision.resultKind = decision.outputMode === "manual-review" ? "checklist" : "draft";
  decision.resultLabel = decision.outputMode === "manual-review" ? decision.resultLabel : "Маркированный черновик заявления";
  decision.documentTitle = isChildApplication
    ? "Заявление несовершеннолетнего о назначении конкретного попечителя"
    : "Совместное заявление родителей о назначении опекуна или попечителя на определённый период";
  decision.requiresLegalReview = true;
  decision.draftText = decision.outputMode === "manual-review" ? "" : buildParentPeriodRequest(values);
  decision.providedDocuments = [
    item("Документы, удостоверяющие личности заявителей", "Подтверждают личность и возраст.", "компетентные органы, выдавшие документы", "оригиналы", "предъявляют заявители", "статья 13 Закона № 48-ФЗ"),
    item(
      "Черновик заявления",
      isChildApplication ? "Указывает конкретного предлагаемого попечителя." : "Указывает конкретное лицо, уважительную причину и определённый период.",
      "составляют заявители",
      "свободная форма; проверить в органе",
      "предоставляют заявители",
      "статья 13 Закона № 48-ФЗ"
    )
  ];
  decision.originals = ["Документы, удостоверяющие личности заявителей и предлагаемого лица."];
  decision.regionalDocuments = isChildApplication
    ? ["Региональный способ подачи необходимо проверить в выбранном органе."]
    : ["Подтверждения уважительной причины и региональный способ подачи — уточнить в выбранном органе."];
  decision.deadline = isChildApplication
    ? "Универсальный федеральный срок принятия решения по заявлению ребёнка с 14 лет в проверенных нормах не найден."
    : "Срок полномочий указывается в акте органа опеки. Универсальный срок принятия решения для всех регионов не подтверждён.";
  decision.filingSteps = authoritySteps(values, isChildApplication ? [
    "Проверьте данные конкретного предлагаемого попечителя и его согласие.",
    "Подайте самостоятельное заявление ребёнка с 14 лет в орган опеки по месту жительства ребёнка.",
    "Не добавляйте период отсутствия родителей: он относится к совместному заявлению родителей, а не к заявлению ребёнка.",
    "Сохраните подтверждение регистрации заявления.",
    "Получите письменный акт либо мотивированный отказ по указанной кандидатуре."
  ] : [
    "Оба родителя подписывают совместное заявление с указанием конкретного лица, уважительной причины и периода.",
    "Подайте заявление в орган опеки по месту жительства ребёнка и предъявите документы заявителей.",
    "Сохраните подтверждение регистрации заявления.",
    "Получите письменный акт с точным сроком полномочий опекуна или попечителя.",
    "При отказе запросите и сохраните мотивированный письменный текст."
  ]);
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
    if (values.guardianType === "unsure" || !values.guardianType) {
      decision.issues.push({ field: "guardianType", message: "Уточните, кто представляет отчёт: гражданин или организация. Для них установлены разные сроки." });
    }
    decision.outcomeKey = values.guardianType === "organization" ? "annual-report-organization" : "annual-report-citizen";
    decision.outputMode = "official-helper";
    decision.resultKind = "data-sheet";
    decision.resultLabel = "Лист подготовленных данных для официальной формы отчёта";
    decision.documentTitle = "Данные для официального ежегодного отчёта опекуна";
    decision.officialFormUrl = reportFormFallback;
    decision.providedDocuments = [
      item("Официальная форма отчёта", "Фиксирует имущество, доходы и расходы за год.", "заполняет опекун по утверждённой форме", "утверждённая форма; не заменять свободным текстом", "предоставляет опекун", "Постановление Правительства РФ № 423"),
      item("Платёжные документы", "Подтверждают отражённые доходы и расходы, кроме исключённых законом мелких бытовых расходов.", "банки, продавцы, налоговые и иные компетентные организации", "копии", "предоставляет опекун, когда документ подтверждает включённые в отчёт сведения", "статья 25 Закона № 48-ФЗ")
    ];
    decision.copies = ["Товарные чеки, налоговые квитанции, страховые и другие платёжные документы — когда они подтверждают сведения отчёта."];
    decision.deadline = values.guardianType === "organization"
      ? "Организация, на которую возложено исполнение обязанностей опекуна или попечителя, представляет отчёт ежегодно не позднее 1 апреля текущего года."
      : "Опекун или попечитель — гражданин представляет отчёт за предыдущий год не позднее 1 февраля, если договором не установлен иной срок.";
    decision.filingSteps = authoritySteps(values, [
      "Откройте утверждённую форму ежегодного отчёта и перенесите подготовленные сведения.",
      "Приложите подтверждающие платёжные документы в пределах статьи 25 Закона № 48-ФЗ.",
      `Представьте отчёт в орган опеки ${values.guardianType === "organization" ? "не позднее 1 апреля" : "не позднее 1 февраля, если договором не установлен иной срок"}.`,
      "Получите отметку о приёме или иное подтверждение подачи.",
      "Сохраните утверждённый отчёт и замечания органа опеки в документах подопечного."
    ]);
    return;
  }
  if (action === "nominal-account") {
    decision.outcomeKey = "nominal-account";
    decision.outputMode = "official-helper";
    decision.resultKind = "checklist";
    decision.resultLabel = "Персональный чек-лист по номинальному счёту";
    decision.documentTitle = "Памятка по выплатам и отдельному номинальному счёту";
    decision.notices.push("Это информационный результат, а не заявление в банк или орган опеки.");
    decision.providedDocuments = [
      item("Документы банка по номинальному счёту", "Подтверждают реквизиты счёта и операции.", "банк, в котором открыт счёт", "по правилам банка", "получает и хранит опекун", "статья 37 ГК РФ"),
      item("Подтверждения целевого расходования", "Нужны для отчётности в предусмотренных законом пределах.", "продавцы, банки и иные участники расчётов", "копии", "предоставляет опекун в применимых пределах", "статья 25 Закона № 48-ФЗ")
    ];
    decision.deadline = "Универсальный отдельный срок для информационного обращения о номинальном счёте не установлен. Сведения о расходовании отражаются в ежегодном отчёте в предусмотренных статьёй 25 пределах.";
    decision.filingSteps = authoritySteps(values, [
      "Сверьте акт о назначении и правила банка для открытия или обслуживания отдельного номинального счёта.",
      "Храните банковские документы и подтверждения операций в интересах ребёнка.",
      "Не смешивайте средства подопечного с личными средствами опекуна.",
      "Отразите требуемые сведения о расходовании в ежегодном отчёте по статье 25 Закона № 48-ФЗ.",
      "Если планируемое действие уменьшает имущество ребёнка, до операции перейдите к сценарию предварительного разрешения."
    ]);
    return;
  }

  if (values.operationType === "unsure" || !values.operationType) {
    decision.issues.push({ field: "operationType", message: "Уточните вид имущественного действия. Без этого нельзя определить риск и состав обращения." });
  }
  if (!values.operationDetails) decision.issues.push({ field: "operationDetails", message: "Опишите действие и его условия." });
  if (!values.rightsImpact) decision.issues.push({ field: "rightsImpact", message: "Опишите, как сохраняются права и имущество ребёнка." });
  const complexOperation = action === "real-estate"
    || ["real-estate-sale", "real-estate-exchange", "pledge-rent", "waiver-division", "court-settlement", "unsure"].includes(values.operationType ?? "")
    || values.complexProperty !== "no";
  decision.outcomeKey = complexOperation || values.conflictInterest !== "no"
    ? "property-permission-complex"
    : "property-permission-standard";
  decision.resultKind = "draft";
  decision.resultLabel = "Маркированный черновик обращения за предварительным разрешением";
  if (values.conflictInterest === "yes") {
    decision.outputMode = "manual-review";
    decision.resultKind = "checklist";
    decision.resultLabel = "Лист юридической проверки конфликта интересов";
    decision.requiresLegalReview = true;
    decision.issues.push({ field: "conflictInterest", message: "Конфликт интересов и сделки с опекуном или его близкими нельзя автоматизировать." });
  } else {
    decision.outputMode = "draft";
  }
  if (complexOperation || values.conflictInterest !== "no") {
    decision.requiresLegalReview = true;
    decision.notices.push("Сложный имущественный случай: черновик нельзя считать готовым разрешением или гарантией законности сделки.");
  }
  decision.documentTitle = "Обращение за предварительным разрешением на распоряжение имуществом подопечного";
  decision.draftText = decision.outputMode === "manual-review" ? "" : buildPropertyPermissionRequest(values);
  decision.providedDocuments = [
    item("Черновик обращения", "Описывает имущество, действие и сохранение прав ребёнка.", "составляет заявитель", "свободная форма; проверить в органе", "предоставляет заявитель", "статьи 20-21 Закона № 48-ФЗ"),
    item("Документы на имущество", "Подтверждают право ребёнка и характеристики объекта.", "Росреестр, нотариус или иной компетентный источник — по виду имущества", "оригиналы и копии по запросу", "способ получения и межведомственного обмена проверяется по региональному регламенту", "статьи 20-21 Закона № 48-ФЗ")
  ];
  decision.originals = ["Правоустанавливающие документы — для сверки органом, если это предусмотрено способом подачи."];
  decision.copies = ["Проект сделки, оценка и документы о приобретаемом объекте — если применимы и подтверждены местным регламентом."];
  decision.regionalDocuments = ["Конкретный перечень приложений и электронный канал подачи зависят от регионального регламента."];
  decision.deadline = "Письменное разрешение или мотивированный отказ — не позднее 15 дней с даты подачи заявления.";
  decision.filingSteps = authoritySteps(values, [
    "Не совершайте действие и не подписывайте сделку до получения письменного предварительного разрешения.",
    "Подготовьте описание имущества, условий действия и способа сохранения прав ребёнка.",
    "Подайте обращение и подтверждённые приложения в выбранный орган опеки.",
    "Получите письменное разрешение либо мотивированный отказ не позднее 15 дней с даты заявления.",
    complexOperation
      ? "До сделки передайте разрешение, проект сделки и документы на юридическую проверку: сложное имущество нельзя считать проверенным автоматически."
      : "Сопоставьте итоговые условия операции с письменным разрешением и сохраните решение вместе с подтверждениями исполнения."
  ]);
}

function validateComplaint(values: GuardianshipValues, decision: GuardianshipDecision) {
  if (values.responseState === "oral-refusal") {
    decision.outputMode = "manual-review";
    decision.outcomeKey = "oral-refusal-registration";
    decision.resultKind = "checklist";
    decision.resultLabel = "Чек-лист фиксации письменного обращения";
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
  if (decision.outputMode !== "manual-review") decision.outputMode = "draft";
  const responsePrefix = values.responseState === "no-response" ? "inaction" : "refusal";
  const channelSuffix = values.complaintChannel === "prosecutor"
    ? "prosecutor"
    : values.complaintChannel === "court" ? "court" : "higher-authority";
  if (values.responseState !== "oral-refusal" && values.responseState !== "unsure") {
    decision.outcomeKey = `${responsePrefix}-${channelSuffix}` as GuardianshipOutcomeKey;
  }
  decision.resultKind = decision.outputMode === "manual-review" ? "checklist" : "draft";
  decision.resultLabel = decision.outputMode === "manual-review"
    ? "Лист данных для выбора процессуального способа защиты"
    : values.complaintChannel === "prosecutor"
      ? "Маркированный черновик обращения в прокуратуру"
      : "Маркированный черновик обращения в вышестоящий орган";
  decision.requiresLegalReview = true;
  decision.documentTitle = values.responseState === "no-response"
    ? "Жалоба на бездействие органа опеки"
    : "Жалоба на решение органа опеки";
  decision.draftText = decision.outputMode === "manual-review" ? "" : buildComplaint(values);
  decision.providedDocuments = [
    item("Исходное обращение", "Подтверждает предмет и объём просьбы.", "составляет заявитель", "копия", "предоставляет заявитель", "фактическое основание жалобы"),
    item("Подтверждение подачи", "Подтверждает дату регистрации.", "орган или сервис, принявший обращение", "копия", "предоставляет заявитель", "фактическое основание жалобы"),
    item("Письменный отказ", "Подтверждает оспариваемое решение и мотивы.", "орган опеки", "копия, если получен", "не требуется при подтверждённом бездействии", "фактическое основание жалобы")
  ];
  decision.copies = ["Исходное обращение и подтверждение его регистрации.", "Письменный отказ и приложения — если получены."];
  decision.additionalDocuments = ["Документы о правах заявителя и затронутых интересах ребёнка."];
  decision.deadline = "Универсальный срок не подтверждается: он определяется по исходной процедуре и выбранному способу обжалования.";
  if (values.responseState === "oral-refusal") {
    decision.filingSteps = authoritySteps(values, [
      "Подготовьте письменное обращение с конкретной просьбой.",
      "Подайте его способом, позволяющим подтвердить дату и содержание.",
      "Сохраните регистрационный номер, отметку о приёме или электронное подтверждение.",
      "Запросите письменное мотивированное решение.",
      "После получения решения вернитесь в маршрут и выберите подходящий способ обжалования."
    ]);
    return;
  }
  if (values.complaintChannel === "court" || values.complaintChannel === "unsure") {
    decision.filingSteps = [
      "Сохраните исходное обращение, подтверждение подачи и полный письменный отказ либо доказательства бездействия.",
      "Не подавайте универсальный шаблон: сначала определите вид производства, подсудность, участников и применимый срок.",
      "Передайте материалы юристу для выбора процессуального документа и расчёта возможной пошлины.",
      "Подайте документ только после проверки требований к форме, приложениям и направлению копий участникам.",
      "Сохраните подтверждение подачи и отслеживайте движение дела на официальном сайте суда."
    ];
    return;
  }
  decision.filingSteps = values.complaintChannel === "prosecutor"
    ? [
        "Проверьте, относится ли вопрос к компетенции прокуратуры; помощник не заменяет эту проверку.",
        `Официальная интернет-приёмная Генеральной прокуратуры: ${prosecutorReception}.`,
        "Приложите исходное обращение, подтверждение подачи и письменный отказ либо сведения о подтверждённом бездействии.",
        "Сохраните подтверждение регистрации обращения.",
        "Получите письменный ответ; судебный способ и срок при необходимости определяются отдельно."
      ]
    : authoritySteps(values, [
        "Определите вышестоящий орган по официальной структуре выбранного органа опеки; автоматически адресат не подтверждён.",
        "Приложите исходное обращение, подтверждение подачи и письменный отказ либо сведения о подтверждённом бездействии.",
        "Подайте жалобу и сохраните подтверждение регистрации.",
        "Получите письменный ответ вышестоящего органа.",
        "Если нарушение не устранено, отдельно проверьте возможность обращения в прокуратуру или суд."
      ]);
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
    outcomeKey: "unresolved",
    resultKind: "data-sheet",
    resultLabel: "Лист подготовленных данных",
    pdfAvailable: false,
    lawyerReviewAvailable: false,
    filingReady: false,
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
      `Выбранный орган: ${values.authorityName || "орган опеки не подтверждён"}.`,
      `Адрес: ${values.authorityAddress || "не подтверждён"}.`,
      `Муниципальное образование: ${values.municipality || "не подтверждено"}.`,
      `Сверьте способ подачи и часы приёма на официальном сайте: ${values.authorityWebsite || GUARDIANSHIP_DIRECTORY_METADATA.authoritySearchUrl}.`,
      "Подготовьте документ и персональные приложения.",
      "Предъявите оригиналы, если это предусмотрено применимым порядком.",
      "Получите подтверждение регистрации обращения.",
      "Получите письменное решение и проверьте срок, условия и реквизиты.",
      "При отказе сохраните полный текст решения для выбора способа обжалования."
    ]
  };
}

function urgentProtectionDecision(): GuardianshipDecision {
  return {
    allowed: false,
    outputMode: "urgent",
    outcomeKey: "urgent-protection",
    resultKind: "urgent",
    resultLabel: "Срочные действия без подготовки документа",
    pdfAvailable: false,
    lawyerReviewAvailable: false,
    filingReady: false,
    documentTitle: "Непосредственная угроза жизни или здоровью ребёнка",
    draftText: "",
    issues: [],
    notices: [
      "Не ждите подготовки заявления или жалобы. При реальной непосредственной угрозе позвоните 112 и сообщите точный адрес, что произошло и какая помощь нужна.",
      "Статья 77 СК РФ предусматривает немедленные действия органа опеки при непосредственной угрозе жизни ребёнка или его здоровью."
    ],
    requiresLegalReview: false,
    officialFormUrl: emergencySource,
    providedDocuments: [],
    interagencyInformation: [],
    originals: [],
    copies: [],
    regionalDocuments: [],
    additionalDocuments: [],
    fee: "Срочный вызов по номеру 112 является бесплатным. Обычные расчёты расходов в этом состоянии не показываются.",
    deadline: "Действуйте немедленно.",
    filingSteps: [
      "Позвоните 112 при реальной непосредственной угрозе жизни или здоровью ребёнка.",
      "Сообщите диспетчеру точный адрес, что произошло, сколько людей нуждаются в помощи и известные опасные обстоятельства.",
      "Выполняйте указания экстренной службы и не задерживайте обращение ради заполнения формы.",
      "Сообщите о непосредственной угрозе компетентному органу опеки, когда это можно сделать без задержки экстренной помощи.",
      "После устранения непосредственной угрозы сохраните подтверждения обращений и вернитесь к юридическому маршруту."
    ]
  };
}

function authoritySteps(values: GuardianshipValues, steps: string[]) {
  return [
    `Компетентный орган: ${values.authorityName || "не подтверждён"}.`,
    `Адрес: ${values.authorityAddress || "не подтверждён"}.`,
    `Официальный источник: ${values.authorityWebsite || GUARDIANSHIP_DIRECTORY_METADATA.authoritySearchUrl}.`,
    ...steps
  ];
}

function candidateDocuments(values: GuardianshipValues): GuardianshipDocumentItem[] {
  const result = [
    item("Краткая автобиография", "Сведения о кандидате.", "составляет кандидат", "оригинал", "предоставляет кандидат", "пункт 4 Правил № 423"),
    item("Подтверждение дохода", "Подтверждает доход кандидата либо супруга.", "работодатель или иной компетентный источник дохода", "оригинал или иной подтверждающий документ", "предоставляет кандидат в предусмотренном Правилами случае", "пункт 4 Правил № 423", "1 год со дня выдачи для документа, указанного Правилами"),
    item("Медицинское заключение", "Подтверждает результаты освидетельствования кандидата.", "медицинская организация по приказу Минздрава № 254н", "форма по приказу Минздрава № 254н", "предоставляет кандидат", "пункт 4 Правил № 423", "6 месяцев со дня выдачи")
  ];
  if (values.householdAdults === "yes") {
    result.push(item("Письменное согласие членов семьи", "Подтверждает согласие совместно проживающих совершеннолетних с учётом мнения детей от 10 лет.", "составляют соответствующие члены семьи", "оригинал", "предоставляет кандидат", "пункт 4 Правил № 423"));
  }
  if (values.candidateMaritalStatus === "yes") {
    result.push(item("Свидетельство о браке", "Подтверждает семейное положение кандидата.", "орган ЗАГС", "копия; оригинал предъявляется для изготовления копии органом, если копия не приложена", "предоставляет кандидат, состоящий в браке", "пункты 4-5 Правил № 423"));
  }
  if (values.closeRelative !== "yes") {
    result.push(item("Свидетельство о прохождении подготовки", "Подтверждает обязательную подготовку кандидата.", "уполномоченная организация подготовки", "копия", "не предоставляется при подтверждённом законом освобождении", "пункт 4 Правил № 423"));
  }
  return result;
}

function buildPreliminaryRequest(values: GuardianshipValues, role: string) {
  return `В ${value(values, "authorityName")}\n\nОт: ${value(values, "candidateData")}\n\nОБРАЩЕНИЕ\nоб установлении предварительной опеки или попечительства\n\nПрошу рассмотреть вопрос о моём немедленном назначении в предварительном порядке в качестве ${role} в отношении ребёнка: ${value(values, "childData")}.\n\nОбстоятельства: ребёнок ${values.childWithoutCare === "yes" ? "остался без попечения родителей" : "нуждается в срочной оценке органом опеки"}. Прошу провести обследование условий моей жизни и принять письменный акт в пределах статьи 12 Федерального закона № 48-ФЗ.\n\nМне известно, что предварительно назначенный опекун или попечитель не вправе распоряжаться имуществом подопечного.\n\nДата: ____________    Подпись: ____________`;
}

function buildParentPeriodRequest(values: GuardianshipValues) {
  const isChild = values.applicantRole === "child-14";
  if (isChild) {
    return `В ${value(values, "authorityName")}\n\nЗаявитель: ${value(values, "childData")}\n\nЗАЯВЛЕНИЕ\nнесовершеннолетнего о назначении конкретного попечителя\n\nПрошу назначить ${value(values, "nomineeData")} моим попечителем. Указанное лицо согласно на назначение.\n\nПрошу проверить соответствие кандидатуры требованиям закона и моим интересам и выдать письменный акт либо мотивированный отказ.\n\nДата: ____________    Подпись: ____________`;
  }
  return `В ${value(values, "authorityName")}\n\nЗаявители: ${value(values, "parentsData")}\n\nСОВМЕСТНОЕ ЗАЯВЛЕНИЕ\nродителей о назначении опекуна или попечителя на определённый период\n\nПросим назначить ${value(values, "nomineeData")} ${Number(values.childAge) < 14 ? "опекуном" : "попечителем"} ребёнка ${value(values, "childData")} на период с ${value(values, "periodStart")} по ${value(values, "periodEnd")}.\n\nУважительная причина: ${value(values, "reason")}\n\nПредлагаемое лицо согласно на назначение. Просим проверить соответствие назначения закону и интересам ребёнка и выдать письменный акт с указанием срока полномочий.\n\nДата: ____________    Подписи родителей: ____________`;
}

function buildPropertyPermissionRequest(values: GuardianshipValues) {
  return `В ${value(values, "authorityName")}\n\nОт: ${value(values, "guardianData")}\n\nОБРАЩЕНИЕ\nо предварительном разрешении на действие с имуществом подопечного\n\nПодопечный: ${value(values, "childData")}\n\nВид действия: ${operationTypeLabel(values.operationType)}\n\nИмущество и относящиеся к нему сведения: ${value(values, "assetDetails")}\n\nПредполагаемое действие и условия: ${value(values, "operationDetails")}\n\nСохранение прав и интересов ребёнка: ${value(values, "rightsImpact")}\n\nДо получения письменного предварительного разрешения действие совершаться не будет. Прошу выдать письменное разрешение либо мотивированный отказ в срок, предусмотренный статьёй 21 Федерального закона № 48-ФЗ.\n\nДата: ____________    Подпись: ____________`;
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

function operationTypeLabel(value: string | undefined) {
  return ({
    money: "расходование денежных средств",
    movable: "действие с движимым имуществом",
    "real-estate-sale": "продажа недвижимости",
    "real-estate-exchange": "обмен недвижимости",
    "pledge-rent": "залог, наём, аренда или безвозмездное пользование",
    "waiver-division": "отказ от права, раздел имущества или выдел доли",
    "power-of-attorney": "выдача доверенности от имени подопечного",
    "court-settlement": "отказ от иска или мировое соглашение"
  } as Record<string, string>)[value ?? ""] ?? "действие требует уточнения";
}

function value(values: GuardianshipValues, key: string) {
  if (key === "authorityName" && values.authorityName && values.authorityAddress) {
    return `${values.authorityName}\nАдрес: ${values.authorityAddress}`;
  }
  return values[key] || "не указано";
}

function validateGuardianshipTerritory(values: GuardianshipValues, issues: GuardianshipIssue[]) {
  if (!values.region || !values.municipality) return;
  if (!RUSSIAN_REGIONS.some((region) => region.id === values.region)) {
    issues.push({ field: "region", message: "Выберите регион из официального списка." });
    return;
  }
  if (values.municipality === TERRITORY_NOT_FOUND_ID) {
    issues.push({
      field: "municipality",
      message: `Муниципальное образование не подтверждено. Найдите официальный сайт региона в федеральном каталоге ${GUARDIANSHIP_DIRECTORY_METADATA.authoritySearchUrl} и проверьте компетентный орган. Готовый документ не формируется.`
    });
    return;
  }
  if (values.authorityName === TERRITORY_NOT_FOUND_ID) {
    issues.push({
      field: "authorityName",
      message: `Орган опеки не подтверждён. Проверьте его на официальном сайте выбранного региона: ${GUARDIANSHIP_DIRECTORY_METADATA.authoritySearchUrl}. Готовый документ не формируется.`
    });
    return;
  }
  const { municipality, authority } = findGuardianshipTerritory(values.region, values.municipality, values.authorityName);
  if (!municipality) issues.push({ field: "municipality", message: "Выбранное муниципальное образование не относится к указанному региону." });
  if (values.authorityName && !authority) issues.push({ field: "authorityName", message: "Выбранный орган опеки не подтверждён для указанного муниципального образования." });
}

function resolveGuardianshipTerritoryValues(values: GuardianshipValues): GuardianshipValues {
  const { region, municipality, authority } = findGuardianshipTerritory(values.region, values.municipality, values.authorityName);
  return {
    ...values,
    region: region?.label,
    municipality: municipality?.name,
    authorityName: authority?.name,
    authorityAddress: authority?.address,
    authorityWebsite: authority?.website,
    authoritySource: authority ? `${authority.sourceName}, проверено ${authority.lastVerifiedAt}` : undefined
  };
}

export function fieldByName(scenarioKey: GuardianshipScenarioKey, name: string): GuardianshipField | undefined {
  return GUARDIANSHIP_SCENARIOS[scenarioKey].helperFields.find((field) => field.name === name);
}
