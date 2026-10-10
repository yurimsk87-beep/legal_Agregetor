import {
  getFamilyAdditiveRoute,
  getFamilyAdditiveScenario,
  type FamilyAdditiveField,
  type FamilyAdditiveResultKind,
  type FamilyAdditiveRouteSlug
} from "@/data/family-additive-routes";

export type FamilyAdditiveValues = Record<string, string | undefined>;
export type FamilyAdditiveIssue = { field: string; message: string };

export type FamilyAdditiveDecision = {
  allowed: boolean;
  routeSlug: FamilyAdditiveRouteSlug;
  scenarioKey: string;
  outcomeKey: string;
  legalPath: "assessment" | "agreement" | "court" | "enforcement" | "official-form";
  resultKind: FamilyAdditiveResultKind;
  resultLabel: string;
  documentTitle: string;
  filingReady: false;
  requiresLegalReview: boolean;
  issues: FamilyAdditiveIssue[];
  notices: string[];
  preparedData: Array<{ label: string; value: string }>;
  filingSteps: string[];
  redirectPath?: string;
  officialForm?: { number: string; title: string; url: string };
};

export function validateFamilyAdditiveScenario(routeSlug: FamilyAdditiveRouteSlug, scenarioKey: string, values: FamilyAdditiveValues): FamilyAdditiveDecision {
  const route = getFamilyAdditiveRoute(routeSlug);
  const scenario = getFamilyAdditiveScenario(routeSlug, scenarioKey);
  if (!route || !scenario) throw new Error(`Unknown family additive route scenario: ${routeSlug}/${scenarioKey}`);

  const preparedData = scenario.helperFields
    .filter((field) => values[field.name]?.trim())
    .map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));
  const missing = scenario.helperFields
    .filter((field) => field.required && !values[field.name]?.trim())
    .map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return blocked(routeSlug, scenarioKey, "missing-data", scenario.documentTitle, missing, preparedData, "Заполните обязательные поля. Ни один факт не будет подставлен автоматически.");

  if (routeSlug === "alimenty-na-sovershennoletnego-rebenka") return validateAdultChild(scenarioKey, values, preparedData);
  if (routeSlug === "prekrashchenie-i-osvobozhdenie-ot-alimentov") return validateTermination(scenarioKey, values, preparedData);
  if (routeSlug === "alimenty-na-soderzhanie-roditeley") return validateParentSupport(scenarioKey, values, preparedData);
  if (routeSlug === "otmena-usynovleniya") return validateAdoptionCancellation(scenarioKey, values, preparedData);
  return validateBirthRecord(scenarioKey, values, preparedData);
}

function validateAdultChild(scenarioKey: string, values: FamilyAdditiveValues, preparedData: FamilyAdditiveDecision["preparedData"]): FamilyAdditiveDecision {
  const route = "alimenty-na-sovershennoletnego-rebenka" as const;
  const scenario = requiredScenario(route, scenarioKey);
  if (values.childAgeStatus === "no") return review(route, scenarioKey, "minor-child", "Ребёнку ещё нет 18 лет", preparedData, "Используйте существующий маршрут алиментов на несовершеннолетнего ребёнка.", "/problems/semeynoe-pravo/alimenty-na-rebenka/");
  if (values.childAgeStatus !== "yes") return review(route, scenarioKey, "age-unclear", "Возраст не подтверждён", preparedData, "Сначала подтвердите, исполнилось ли ребёнку 18 лет.");
  if (values.studyOnly === "yes" && (values.incapacityConfirmed !== "yes" || values.needConfirmed !== "yes")) return review(route, scenarioKey, "study-only", "Очного обучения недостаточно", preparedData, "Статья 85 СК РФ требует подтвердить нетрудоспособность и нуждаемость, а не только обучение.");
  if (values.incapacityConfirmed !== "yes") return review(route, scenarioKey, values.incapacityConfirmed === "no" ? "incapacity-absent" : "incapacity-unclear", "Нетрудоспособность не подтверждена", preparedData, "Без подтверждённой нетрудоспособности судебное содержание по статье 85 СК РФ не формируется.");
  if (values.needConfirmed !== "yes") return review(route, scenarioKey, values.needConfirmed === "no" ? "need-absent" : "need-unclear", "Нуждаемость не подтверждена", preparedData, "Нуждаемость должна подтверждаться отдельно от нетрудоспособности.");

  if (scenarioKey === "eligibility") return allowed(route, scenarioKey, "eligible", "assessment", "Условия требуют документальной проверки", scenario.documentTitle, preparedData, ["Предварительно выявлены оба условия статьи 85 СК РФ."], scenario.steps);
  if (["parent-unconfirmed", "other"].includes(values.applicantRole ?? "")) return review(route, scenarioKey, "applicant-not-confirmed", "Полномочия заявителя не подтверждены", preparedData, "Совершеннолетний ребёнок или его законный представитель должны подтвердить право на обращение.");
  if (scenarioKey === "agreement") {
    if (values.mutualConsent !== "yes") return review(route, scenarioKey, "agreement-not-reached", "Согласие сторон не подтверждено", preparedData, "Для добровольного проекта нужны согласованные условия обеих сторон.");
    return allowed(route, scenarioKey, "agreement-draft", "agreement", "Проект для нотариуса", scenario.documentTitle, preparedData, ["Проект не заменяет нотариальное удостоверение."], scenario.steps);
  }
  if (scenarioKey === "change" && values.existingBasis !== "court") return review(route, scenarioKey, "agreement-change-route", "Судебный путь не подтверждён", preparedData, values.existingBasis === "agreement" ? "Для нотариального соглашения сначала проверьте взаимное изменение в договорной форме." : "Установите документ, которым определено содержание.");
  if (!hasVerifiedCourt(values)) return review(route, scenarioKey, "court-not-confirmed", "Суд не подтверждён", preparedData, "Найдите суд по полному адресу в ГАС «Правосудие», перенесите полное официальное наименование и подтвердите проверку подсудности.");
  return allowed(route, scenarioKey, "court-draft", "court", "Судебный документ требует проверки", scenario.documentTitle, preparedData, ["Подсудность, доказательства и расчёт проверяет юрист."], scenario.steps);
}

function validateTermination(scenarioKey: string, values: FamilyAdditiveValues, preparedData: FamilyAdditiveDecision["preparedData"]): FamilyAdditiveDecision {
  const route = "prekrashchenie-i-osvobozhdenie-ot-alimentov" as const;
  const scenario = requiredScenario(route, scenarioKey);
  if (values.paternityDispute === "yes") return review(route, scenarioKey, "paternity-conflict", "Это отдельный спор об отцовстве", preparedData, "Прекращение алиментов не заменяет судебное оспаривание отцовства.", "/problems/semeynoe-pravo/osparivanie-otcovstva/");
  if (values.paternityDispute !== "no") return review(route, scenarioKey, "paternity-unclear", "Связь с отцовством не исключена", preparedData, "Сначала установите, требуется ли отдельный спор об отцовстве.");
  if (values.obligationSource === "unsure") return review(route, scenarioKey, "source-unclear", "Источник обязанности не установлен", preparedData, "Нужен судебный акт, приказ или нотариальное соглашение.");

  if (scenarioKey === "termination") {
    if (values.terminationBasis === "other" || values.basisConfirmed !== "yes") return review(route, scenarioKey, "termination-unconfirmed", "Основание прекращения не подтверждено", preparedData, "До подтверждения события и применимой процедуры прекращать платежи нельзя.");
    return allowed(route, scenarioKey, `${values.terminationBasis}-termination-check`, "assessment", "Основание требует процессуального оформления", scenario.documentTitle, preparedData, values.hasDebt === "yes" ? ["Текущая обязанность и задолженность проверяются отдельно; долг автоматически не прекращается."] : ["Проверьте, нужен судебный акт или действие пристава."], scenario.steps);
  }
  if (scenarioKey === "agreement") {
    if (values.obligationSource !== "agreement") return review(route, scenarioKey, "not-agreement", "Нотариальное соглашение не подтверждено", preparedData, "Эта ветвь применяется только к действующему нотариальному соглашению.");
    if (values.mutualConsent !== "yes") return review(route, scenarioKey, "no-mutual-consent", "Взаимное согласие отсутствует", preparedData, "Одностороннее изменение или расторжение соглашения не допускается.");
    return allowed(route, scenarioKey, "agreement-change-draft", "agreement", "Проект для нотариуса", scenario.documentTitle, preparedData, values.hasDebt === "yes" ? ["Проект не списывает задолженность по содержанию несовершеннолетнего ребёнка."] : [], scenario.steps);
  }
  if (scenarioKey === "futureRelief") {
    if (values.obligationSource !== "court") return review(route, scenarioKey, "court-basis-required", "Судебно установленная обязанность не подтверждена", preparedData, "Статья 119 СК РФ применяется к судебно установленным алиментам при отсутствии соглашения.");
    if (!hasVerifiedCourt(values)) return review(route, scenarioKey, "court-not-confirmed", "Суд не подтверждён", preparedData, "Найдите суд по полному адресу в ГАС «Правосудие» и подтвердите проверку подсудности.");
    return allowed(route, scenarioKey, "future-relief-court-draft", "court", "Судебный документ требует проверки", scenario.documentTitle, preparedData, values.hasDebt === "yes" ? ["Задолженность не включена: используйте отдельную ветвь долга."] : [], scenario.steps);
  }
  if (scenarioKey === "debtRelief") {
    if (values.hasDebt !== "yes") return review(route, scenarioKey, "debt-not-confirmed", "Задолженность не подтверждена", preparedData, "Для этой ветви нужен официальный расчёт задолженности.");
    if (values.nonpaymentReason === "unconfirmed" || values.cannotRepay !== "yes") return review(route, scenarioKey, "debt-relief-conditions-missing", "Условия статьи 114 СК РФ не подтверждены", preparedData, "Нужны доказательства уважительной причины неуплаты и невозможности погасить долг с учётом положения.");
    if (!hasVerifiedCourt(values)) return review(route, scenarioKey, "court-not-confirmed", "Суд не подтверждён", preparedData, "Найдите суд по полному адресу в ГАС «Правосудие» и подтвердите проверку подсудности.");
    return allowed(route, scenarioKey, "debt-relief-court-draft", "court", "Иск требует проверки", scenario.documentTitle, preparedData, ["Цена требования, пошлина и расчёт задолженности проверяются до подачи."], scenario.steps);
  }
  if (values.terminationBasis === "other" || values.basisConfirmed !== "yes") return review(route, scenarioKey, "enforcement-basis-unconfirmed", "Основание для обращения приставу не подтверждено", preparedData, "Пристав не может подменить необходимое судебное решение.");
  return allowed(route, scenarioKey, "enforcement-draft", "enforcement", "Обращение требует проверки полномочий пристава", scenario.documentTitle, preparedData, values.hasDebt === "yes" ? ["Просите отдельно определить судьбу текущих платежей и задолженности."] : [], scenario.steps);
}

function validateParentSupport(scenarioKey: string, values: FamilyAdditiveValues, preparedData: FamilyAdditiveDecision["preparedData"]): FamilyAdditiveDecision {
  const route = "alimenty-na-soderzhanie-roditeley" as const;
  const scenario = requiredScenario(route, scenarioKey);
  if (values.directionConfirmed === "no") return review(route, scenarioKey, "reverse-direction", "Вы описали содержание ребёнка родителем", preparedData, "Выберите маршрут по возрасту и статусу ребёнка.", "/problems/semeynoe-pravo/alimenty-na-sovershennoletnego-rebenka/");
  if (values.directionConfirmed !== "yes") return review(route, scenarioKey, "direction-unclear", "Направление обязанности не подтверждено", preparedData, "Уточните, что содержание требуется именно родителю от ребёнка.");
  for (const [field, title, notice] of [
    ["childAdult", "Совершеннолетие ребёнка не подтверждено", "Статья 87 СК РФ относится к совершеннолетним детям."],
    ["childAble", "Трудоспособность ребёнка не подтверждена", "Обязанность по статье 87 связана с трудоспособным совершеннолетним ребёнком."],
    ["parentIncapacity", "Нетрудоспособность родителя не подтверждена", "Нетрудоспособность родителя является самостоятельным условием."],
    ["parentNeed", "Нуждаемость родителя не подтверждена", "Нуждаемость должна подтверждаться отдельно."]
  ] as const) if (values[field] !== "yes") return review(route, scenarioKey, `${field}-missing`, title, preparedData, notice);
  if (values.parentDeprived === "yes") return review(route, scenarioKey, "parent-deprived", "Лишённый родитель не вправе требовать содержание", preparedData, "Пункт 5 статьи 87 СК РФ исключает требование к ребёнку.");
  if (values.parentDeprived !== "no") return review(route, scenarioKey, "deprivation-unclear", "Статус родительских прав не подтверждён", preparedData, "Проверьте судебные решения о родительских правах.");
  if (values.parentAvoidedDuties !== "no") return review(route, scenarioKey, "parental-duties-review", "Нужно проверить исполнение родительских обязанностей", preparedData, "Суд может освободить ребёнка, если родитель уклонялся от обязанностей.");

  if (scenarioKey === "eligibility") return allowed(route, scenarioKey, "eligible", "assessment", "Условия предварительно выявлены", scenario.documentTitle, preparedData, ["Суд или нотариус проверит документы и положение сторон."], scenario.steps);
  if (scenarioKey === "agreement") {
    if (values.mutualConsent !== "yes") return review(route, scenarioKey, "agreement-not-reached", "Согласие сторон не подтверждено", preparedData, "Для проекта соглашения нужны согласованные условия.");
    return allowed(route, scenarioKey, "agreement-draft", "agreement", "Проект для нотариуса", scenario.documentTitle, preparedData, ["Проект не заменяет нотариальное удостоверение."], scenario.steps);
  }
  if (!hasVerifiedCourt(values)) return review(route, scenarioKey, "court-not-confirmed", "Суд не подтверждён", preparedData, "Найдите суд по полному адресу в ГАС «Правосудие» и подтвердите проверку подсудности.");
  return allowed(route, scenarioKey, scenarioKey === "extraExpenses" ? "extra-expenses-court-draft" : "support-court-draft", "court", "Иск требует проверки", scenario.documentTitle, preparedData, scenarioKey === "extraExpenses" ? ["Исключительный характер и размер расходов должны быть доказаны отдельно."] : ["Суд вправе учесть всех совершеннолетних детей."], scenario.steps);
}

function validateAdoptionCancellation(scenarioKey: string, values: FamilyAdditiveValues, preparedData: FamilyAdditiveDecision["preparedData"]): FamilyAdditiveDecision {
  const route = "otmena-usynovleniya" as const;
  const scenario = requiredScenario(route, scenarioKey);
  if (values.applicantRole === "other") return review(route, scenarioKey, "improper-applicant", "Право заявителя не подтверждено", preparedData, "Статья 142 СК РФ устанавливает закрытый круг лиц, имеющих право требовать отмены.");
  if (values.international !== "no") return review(route, scenarioKey, "international-review", "Нужна проверка международной подсудности", preparedData, "Международное усыновление не обрабатывается автоматически.");
  if (["divorce-only", "unsure"].includes(values.cancellationGround ?? "")) return review(route, scenarioKey, "ground-unconfirmed", "Юридическое основание не подтверждено", preparedData, values.cancellationGround === "divorce-only" ? "Развод или расставание сами по себе не отменяют усыновление." : "Нужно связать обстоятельства с законом и интересами ребёнка.");

  if (scenarioKey === "adultConsent") {
    if (values.adoptedAge !== "yes") return review(route, scenarioKey, "not-adult", "Усыновлённый не достиг совершеннолетия", preparedData, "Используйте ветвь отмены усыновления несовершеннолетнего.");
    if (values.adultAdopteeConsent !== "yes" || values.adopterConsent !== "yes") return review(route, scenarioKey, "adult-consents-missing", "Взаимные согласия не подтверждены", preparedData, "Статья 144 СК РФ требует согласия совершеннолетнего усыновлённого и усыновителя, а также применимых родителей.");
    return allowed(route, scenarioKey, "adult-consent-data", "assessment", "Подготовленные сведения требуют судебной проверки", scenario.documentTitle, preparedData, ["Состав необходимых согласий и процедура проверяются юристом."], scenario.steps, scenario.resultKind);
  }
  if (values.adoptedAge === "yes") return review(route, scenarioKey, "adult-route-required", "Усыновлённый достиг совершеннолетия", preparedData, "Перейдите к отдельной ветви статьи 144 СК РФ.");
  if (values.adoptedAge !== "no") return review(route, scenarioKey, "age-unclear", "Возраст усыновлённого не подтверждён", preparedData, "Возраст определяет применимую процедуру.");
  if (scenarioKey === "eligibility") return allowed(route, scenarioKey, "eligible", "assessment", "Право и основание требуют проверки", scenario.documentTitle, preparedData, ["Орган опеки, прокурор и суд оценивают интересы ребёнка."], scenario.steps);
  if (!hasVerifiedCourt(values)) return review(route, scenarioKey, "court-not-confirmed", "Суд не подтверждён", preparedData, "Найдите суд по полному адресу в ГАС «Правосудие» и подтвердите проверку подсудности.");
  return allowed(route, scenarioKey, scenarioKey === "minorClaimSupport" ? "claim-support-draft" : "claim-draft", "court", "Иск требует обязательной проверки", scenario.documentTitle, preparedData, ["Участие органа опеки и прокурора обязательно; результат суда не прогнозируется."], scenario.steps);
}

function validateBirthRecord(scenarioKey: string, values: FamilyAdditiveValues, preparedData: FamilyAdditiveDecision["preparedData"]): FamilyAdditiveDecision {
  const route = "dokumenty-o-rozhdenii-i-aktovaya-zapis" as const;
  const scenario = requiredScenario(route, scenarioKey);
  if (scenarioKey === "correction" && values.hasDispute !== "no") return review(route, scenarioKey, "record-dispute", "Административное исправление не подтверждено", preparedData, values.hasDispute === "yes" ? "При споре между заинтересованными лицами требуется отдельная судебная проверка." : "Уточните, есть ли спор о правильных сведениях.");
  if (["repeatCertificate", "reference"].includes(scenarioKey) && values.subjectStatus === "adult-living") return review(route, scenarioKey, "adult-third-party", "Право на документ совершеннолетнего лица не подтверждено", preparedData, "Родитель или другое лицо не получает повторный документ живого совершеннолетнего автоматически; нужны предусмотренные законом полномочия.");

  let form = scenario.officialForm;
  if (scenarioKey === "registration") {
    const formNumber: Record<string, string> = { "married-parents": "1", "unmarried-mother": "2", "late-adult-registration": "3", stillbirth: "4", "found-child": "5", "outside-medical": "6" };
    const number = formNumber[values.birthFormBasis ?? ""];
    if (!number) return review(route, scenarioKey, "birth-form-unclear", "Официальная форма не определена", preparedData, "Обстоятельства должны однозначно соответствовать одной из форм № 1–6.");
    form = { ...(scenario.officialForm ?? { title: "Заявление о рождении", url: "https://publication.pravo.gov.ru/Document/View/0001201810030017" }), number };
  }
  return allowed(route, scenarioKey, `official-form-${form?.number ?? "prepared"}`, "official-form", "Данные подготовлены для официальной формы", scenario.documentTitle, preparedData, ["Перенесите сведения только в действующую официальную форму и сверьте их перед подачей."], scenario.steps, scenario.resultKind, form);
}

function requiredScenario(routeSlug: FamilyAdditiveRouteSlug, scenarioKey: string) {
  const scenario = getFamilyAdditiveScenario(routeSlug, scenarioKey);
  if (!scenario) throw new Error(`Unknown scenario: ${routeSlug}/${scenarioKey}`);
  return scenario;
}

function displayValue(field: FamilyAdditiveField, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function hasVerifiedCourt(values: FamilyAdditiveValues) {
  return Boolean(values.courtName?.trim()) && values.courtConfirmed === "yes";
}

function allowed(
  routeSlug: FamilyAdditiveRouteSlug,
  scenarioKey: string,
  outcomeKey: string,
  legalPath: FamilyAdditiveDecision["legalPath"],
  resultLabel: string,
  documentTitle: string,
  preparedData: FamilyAdditiveDecision["preparedData"],
  notices: string[],
  filingSteps: string[],
  resultKind?: FamilyAdditiveResultKind,
  officialForm?: FamilyAdditiveDecision["officialForm"]
): FamilyAdditiveDecision {
  const scenario = requiredScenario(routeSlug, scenarioKey);
  return { allowed: true, routeSlug, scenarioKey, outcomeKey, legalPath, resultKind: resultKind ?? scenario.resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview: scenario.resultKind !== "officialForm", issues: [], notices, preparedData, filingSteps, officialForm };
}

function review(routeSlug: FamilyAdditiveRouteSlug, scenarioKey: string, outcomeKey: string, documentTitle: string, preparedData: FamilyAdditiveDecision["preparedData"], notice: string, redirectPath?: string): FamilyAdditiveDecision {
  return { allowed: false, routeSlug, scenarioKey, outcomeKey, legalPath: "assessment", resultKind: "legalReviewOnly", resultLabel: "Требуется дополнительная проверка", documentTitle, filingReady: false, requiresLegalReview: true, issues: [], notices: [notice], preparedData, filingSteps: [notice, "Не используйте результат как готовый документ."], redirectPath };
}

function blocked(routeSlug: FamilyAdditiveRouteSlug, scenarioKey: string, outcomeKey: string, documentTitle: string, issues: FamilyAdditiveIssue[], preparedData: FamilyAdditiveDecision["preparedData"], notice: string): FamilyAdditiveDecision {
  return { allowed: false, routeSlug, scenarioKey, outcomeKey, legalPath: "assessment", resultKind: "legalReviewOnly", resultLabel: "Не хватает обязательных сведений", documentTitle, filingReady: false, requiresLegalReview: true, issues, notices: [notice], preparedData, filingSteps: ["Заполните обязательные поля." ] };
}
