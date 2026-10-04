import { PARENTS_CHILD_SCENARIOS } from "@/data/parents-child-route";
import type { ParentsChildChangeSubject, ParentsChildField, ParentsChildScenarioKey } from "@/data/parents-child-route";

export type ParentsChildValues = Record<string, string | undefined>;
export type ParentsChildIssue = { field: string; message: string };
export type ParentsChildResultKind = "agreement" | "draft" | "checklist" | "urgent";

export type ParentsChildDecision = {
  allowed: boolean;
  outcomeKey: string;
  resultKind: ParentsChildResultKind;
  resultLabel: string;
  documentTitle: string;
  filingReady: boolean;
  requiresLegalReview: boolean;
  pdfAvailable: boolean;
  issues: ParentsChildIssue[];
  notices: string[];
  preparedData: Array<{ label: string; value: string }>;
  filingSteps: string[];
  draftText: string;
};

const courtFields = new Set(["courtRegion", "defendantAddress", "courtName", "courtSource", "courtConfirmed"]);
const partiesFields = new Set(["applicantData", "otherParentData", "childData", "childOpinion"]);
const enforcementStageFields = new Set(["decisionEffective", "writExists", "enforcementStarted"]);
const enforcementDetailFields = new Set(["decisionDetails", "enforcementDetails", "nonCompliance", "evidence", "bailiffConfirmed"]);

export function getVisibleParentsChildFields(scenarioKey: ParentsChildScenarioKey, values: ParentsChildValues): ParentsChildField[] {
  const fields = PARENTS_CHILD_SCENARIOS[scenarioKey].helperFields;
  if (values.immediateThreat === "yes") return fields.filter((field) => field.name === "immediateThreat");

  if (scenarioKey === "residence" || scenarioKey === "communication") {
    return fields.filter((field) => {
      if (field.name === "existingOrderNeed") return values.existingOrder === "yes";
      if (values.existingOrder === "yes" || values.existingOrder === "unsure") {
        return ["immediateThreat", "complexRisk", "international", "existingOrder", "existingOrderNeed"].includes(field.name);
      }
      return !courtFields.has(field.name) || values.agreement !== "yes";
    });
  }

  if (scenarioKey === "change") {
    const voluntary = isVoluntaryChange(values);
    return fields.filter((field) => {
      if (field.name === "currentResidenceArrangement" || field.name === "requestedResidenceChange") return values.changeSubject === "residence";
      if (field.name === "currentCommunicationArrangement" || field.name === "requestedCommunicationChange") return values.changeSubject === "communication";
      return !courtFields.has(field.name) || !voluntary;
    });
  }

  if (scenarioKey === "enforcement") {
    return fields.filter((field) => {
      if (field.name === "immediateThreat" || field.name === "complexRisk" || field.name === "international" || field.name === "decisionExists") return true;
      if (enforcementStageFields.has(field.name)) {
        if (field.name === "decisionEffective") return values.decisionExists === "yes";
        if (field.name === "writExists") return values.decisionExists === "yes" && values.decisionEffective === "yes";
        return values.decisionExists === "yes" && values.decisionEffective === "yes" && values.writExists === "yes";
      }
      if (partiesFields.has(field.name)) {
        if (values.decisionExists !== "yes" || values.decisionEffective !== "yes") return false;
        return values.writExists === "yes" || field.name === "applicantData" || field.name === "childData";
      }
      if (enforcementDetailFields.has(field.name)) {
        if (values.decisionExists !== "yes" || values.decisionEffective !== "yes") return false;
        return values.writExists === "yes" || field.name === "decisionDetails";
      }
      return true;
    });
  }

  return fields;
}

export function validateParentsChildApplication(scenarioKey: ParentsChildScenarioKey, values: ParentsChildValues): ParentsChildDecision {
  if (values.immediateThreat === "yes") return urgentDecision();

  const visibleFields = getVisibleParentsChildFields(scenarioKey, values);
  const issues: ParentsChildIssue[] = visibleFields
    .filter((field) => field.required && !values[field.name]?.trim())
    .map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  const complexRisk = values.complexRisk !== "no" || values.international !== "no" || values.immediateThreat !== "no";
  const preparedData = visibleFields
    .filter((field) => values[field.name]?.trim())
    .map((field) => ({ label: field.label, value: optionLabel(field, values[field.name] ?? "") }));

  if (scenarioKey === "change" && !isChangeSubject(values.changeSubject)) {
    return missingChangeSubjectDecision(issues, preparedData);
  }

  const courtPath = isCourtPath(scenarioKey, values);
  if (courtPath) {
    if (values.courtConfirmed !== "yes") issues.push({ field: "courtConfirmed", message: "Конкретный суд не подтверждён на официальном ресурсе." });
    if (values.courtSource && !isOfficialCourtUrl(values.courtSource)) issues.push({ field: "courtSource", message: "Ссылка не распознана как официальная страница судебной системы. Адресат требует проверки." });
  }

  if ((scenarioKey === "residence" || scenarioKey === "communication") && values.existingOrder !== "no") {
    return existingOrderDecision(values, issues, preparedData);
  }

  if (scenarioKey === "enforcement") return enforcementDecision(values, issues, preparedData, complexRisk);

  const voluntary = !courtPath;
  const resultKind: ParentsChildResultKind = voluntary ? "agreement" : "draft";
  const requiresLegalReview = complexRisk || courtPath || issues.length > 0;
  const filingReady = voluntary && !requiresLegalReview;
  const changeSubject = isChangeSubject(values.changeSubject) ? values.changeSubject : undefined;
  const documentTitle = titleFor(scenarioKey, voluntary, changeSubject);
  const notices = safetyNotices(values);
  if (courtPath) notices.push("ПравоПоиск не определяет конкретный суд по адресу. Введённые реквизиты считаются данными пользователя и требуют проверки.");
  if (values.childOpinion?.trim()) notices.push("Записано только сообщение заявителя о мнении ребёнка. Оно не является опросом ребёнка или заключением органа опеки.");
  const childAge = Number(values.childAge);
  if (Number.isFinite(childAge) && childAge >= 10) notices.push("Для ребёнка от 10 лет действует правило об обязательном учёте его мнения, кроме случая, когда это противоречит его интересам. Помощник мнение не выясняет.");

  return {
    allowed: issues.length === 0,
    outcomeKey: `${scenarioKey === "change" ? `change-${changeSubject}` : scenarioKey}-${voluntary ? "agreement" : "court-draft"}`,
    resultKind,
    resultLabel: voluntary ? "Проект письменного соглашения" : "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ",
    documentTitle,
    filingReady,
    requiresLegalReview,
    pdfAvailable: true,
    issues,
    notices,
    preparedData,
    filingSteps: filingStepsFor(scenarioKey, voluntary, changeSubject),
    draftText: issues.length ? "" : buildDraft(scenarioKey, values, voluntary, documentTitle)
  };
}

function existingOrderDecision(values: ParentsChildValues, issues: ParentsChildIssue[], preparedData: ParentsChildDecision["preparedData"]): ParentsChildDecision {
  const target = values.existingOrderNeed;
  const title = values.existingOrder === "yes"
    ? target === "change" ? "Перейдите к изменению установленного порядка" : target === "enforcement" ? "Перейдите к исполнению судебного решения" : "Проверьте действующий судебный акт"
    : "Сначала проверьте, существует ли судебный акт";
  const nextPath = target === "enforcement" ? "исполнения решения" : target === "change" ? "изменения существующего порядка" : "проверки судебного акта";
  return {
    allowed: issues.length === 0,
    outcomeKey: `existing-order-${target || "check"}`,
    resultKind: "checklist",
    resultLabel: "Следующий подтверждённый шаг",
    documentTitle: title,
    filingReady: false,
    requiresLegalReview: values.existingOrder !== "yes" || target === "unsure" || issues.length > 0,
    pdfAvailable: true,
    issues,
    notices: safetyNotices(values),
    preparedData,
    filingSteps: [
      "Получите полный текст судебного акта и проверьте его реквизиты.",
      `Откройте сценарий ${nextPath} на основной странице маршрута.`,
      "Не готовьте первоначальное соглашение или иск, пока не определён статус действующего порядка."
    ],
    draftText: ""
  };
}

function enforcementDecision(values: ParentsChildValues, issues: ParentsChildIssue[], preparedData: ParentsChildDecision["preparedData"], complexRisk: boolean): ParentsChildDecision {
  let outcomeKey = "enforcement-check-decision";
  let documentTitle = "Чек-лист проверки судебного решения";
  let steps = ["Если судебного решения нет, выберите маршрут определения места жительства или порядка общения.", "Не обращайтесь к приставу без исполнительного документа."];
  let draftText = "";

  if (values.decisionExists === "yes" && values.decisionEffective !== "yes") {
    outcomeKey = "enforcement-check-effective";
    documentTitle = "Чек-лист проверки вступления решения в силу";
    steps = ["Уточните в суде статус судебного акта.", "Получите заверенную копию с отметкой о вступлении в силу, когда это применимо.", "Не начинайте исполнительный маршрут до подтверждения статуса."];
  } else if (values.decisionExists === "yes" && values.decisionEffective === "yes" && values.writExists !== "yes") {
    outcomeKey = "enforcement-request-writ";
    documentTitle = "Лист данных для получения исполнительного листа";
    steps = ["Уточните в суде порядок выдачи исполнительного листа по вашему делу.", "Подготовьте реквизиты дела и документ, удостоверяющий личность.", "После получения проверьте содержание исполнительного листа."];
  } else if (values.decisionExists === "yes" && values.decisionEffective === "yes" && values.writExists === "yes") {
    outcomeKey = values.enforcementStarted === "yes" ? "enforcement-bailiff-draft" : "enforcement-opening-draft";
    documentTitle = values.enforcementStarted === "yes" ? "Черновик обращения судебному приставу о неисполнении" : "Черновик заявления о возбуждении исполнительного производства";
    steps = values.enforcementStarted === "yes"
      ? ["Проверьте номер производства и подразделение ФССП.", "Передайте приставу точные эпизоды неисполнения и подтверждения.", "Сохраните регистрацию обращения и ответы."]
      : ["Проверьте подразделение ФССП по правилам места совершения исполнительных действий.", "Приложите оригинал исполнительного листа в применимом порядке.", "Сохраните подтверждение подачи и постановление пристава."];
    draftText = issues.length ? "" : buildEnforcementDraft(values, documentTitle);
  }

  const notices = safetyNotices(values);
  notices.push("Подразделение ФССП не определяется автоматически и должно быть проверено на официальном сайте.");
  return {
    allowed: issues.length === 0,
    outcomeKey,
    resultKind: draftText ? "draft" : "checklist",
    resultLabel: draftText ? "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ" : "Персональный чек-лист",
    documentTitle,
    filingReady: false,
    requiresLegalReview: complexRisk || Boolean(draftText) || issues.length > 0,
    pdfAvailable: true,
    issues,
    notices,
    preparedData,
    filingSteps: steps,
    draftText
  };
}

function urgentDecision(): ParentsChildDecision {
  return {
    allowed: false,
    outcomeKey: "urgent-child-safety",
    resultKind: "urgent",
    resultLabel: "Срочная ситуация",
    documentTitle: "Немедленная защита ребёнка",
    filingReady: false,
    requiresLegalReview: true,
    pdfAvailable: false,
    issues: [],
    notices: ["Не откладывайте обращение ради подготовки документа. Если существует реальная угроза жизни или здоровью, звоните 112."],
    preparedData: [],
    filingSteps: ["Позвоните 112 при непосредственной угрозе.", "Сообщите точное место, характер угрозы и кто находится рядом с ребёнком.", "Выполняйте инструкции экстренных служб."],
    draftText: ""
  };
}

function missingChangeSubjectDecision(issues: ParentsChildIssue[], preparedData: ParentsChildDecision["preparedData"]): ParentsChildDecision {
  return {
    allowed: false,
    outcomeKey: "change-subject-required",
    resultKind: "checklist",
    resultLabel: "Требуется уточнение",
    documentTitle: "Сначала выберите предмет изменения",
    filingReady: false,
    requiresLegalReview: false,
    pdfAvailable: false,
    issues,
    notices: [],
    preparedData,
    filingSteps: ["Выберите, нужно изменить место жительства ребёнка или порядок общения с ребёнком."],
    draftText: ""
  };
}

function isCourtPath(scenarioKey: ParentsChildScenarioKey, values: ParentsChildValues) {
  if (scenarioKey === "residence" || scenarioKey === "communication") return values.agreement !== "yes";
  if (scenarioKey === "change") return !isVoluntaryChange(values);
  return false;
}

function isVoluntaryChange(values: ParentsChildValues) {
  return (values.existingBasis === "agreement" || values.existingBasis === "oral") && values.bothAgree === "yes";
}

function isChangeSubject(value: string | undefined): value is ParentsChildChangeSubject {
  return value === "residence" || value === "communication";
}

function safetyNotices(values: ParentsChildValues) {
  const notices: string[] = [];
  if (values.complexRisk !== "no") notices.push("Риски насилия, зависимости, удержания или опасного поведения требуют индивидуальной проверки до использования документа.");
  if (values.international !== "no") notices.push("Международный элемент нельзя безопасно разрешить этим маршрутом: применимое право и компетенцию нужно проверить отдельно.");
  return notices;
}

function isOfficialCourtUrl(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "vsrf.ru" || host.endsWith(".vsrf.ru");
  } catch {
    return false;
  }
}

function optionLabel(field: ParentsChildField, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function titleFor(scenarioKey: ParentsChildScenarioKey, voluntary: boolean, changeSubject?: ParentsChildChangeSubject) {
  if (scenarioKey === "residence") return voluntary ? "Проект соглашения о месте жительства ребёнка" : "Черновик искового заявления об определении места жительства ребёнка";
  if (scenarioKey === "communication") return voluntary ? "Проект соглашения о порядке общения с ребёнком" : "Черновик искового заявления об определении порядка общения с ребёнком";
  if (changeSubject === "residence") return voluntary ? "Проект соглашения об изменении места жительства ребёнка" : "Черновик требования об изменении места жительства ребёнка";
  return voluntary ? "Проект соглашения об изменении порядка общения с ребёнком" : "Черновик требования об изменении порядка общения с ребёнком";
}

function filingStepsFor(scenarioKey: ParentsChildScenarioKey, voluntary: boolean, changeSubject?: ParentsChildChangeSubject) {
  if (voluntary) {
    const subjectStep = scenarioKey === "change" && changeSubject === "residence"
      ? "Проверьте, что соглашение однозначно определяет новое место жительства ребёнка."
      : scenarioKey === "change"
        ? "Проверьте, что соглашение однозначно определяет новый порядок общения с ребёнком."
        : "Проверьте данные и условия соглашения.";
    return [subjectStep, "Обсудите каждое условие со вторым родителем без давления на ребёнка.", "Подпишите одинаковые экземпляры соглашения и храните их у обоих родителей.", "При споре или риске для ребёнка не полагайтесь на соглашение без индивидуальной проверки."];
  }
  const subjectStep = scenarioKey === "change" && changeSubject === "residence"
    ? "Проверьте с юристом требование об изменении места жительства ребёнка и содержание черновика."
    : scenarioKey === "change"
      ? "Проверьте с юристом требование об изменении порядка общения с ребёнком и содержание черновика."
      : "Проверьте вид требования и содержание черновика с юристом.";
  return [subjectStep, "Найдите районный или городской суд через официальный ресурс и перепроверьте территориальную подсудность.", "Уточните действующую пошлину и реквизиты непосредственно перед подачей.", "Подготовьте приложения по статьям 131 и 132 ГПК РФ.", "Не добавляйте от имени ребёнка или органа опеки сведения, которых они не сообщали."];
}

function buildDraft(scenarioKey: ParentsChildScenarioKey, values: ParentsChildValues, voluntary: boolean, title: string) {
  const marker = voluntary ? "ПРОЕКТ СОГЛАШЕНИЯ — НЕ ЯВЛЯЕТСЯ ОФИЦИАЛЬНОЙ ФОРМОЙ" : "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА";
  const changeResidence = scenarioKey === "change" && values.changeSubject === "residence";
  const subject = scenarioKey === "residence" ? values.requestedResidence : scenarioKey === "communication" ? values.requestedOrder : changeResidence ? values.requestedResidenceChange : values.requestedCommunicationChange;
  const facts = scenarioKey === "residence" ? values.currentCircumstances : scenarioKey === "communication" ? values.currentOrder : changeResidence ? values.currentResidenceArrangement : values.currentCommunicationArrangement;
  const legalBasis = scenarioKey === "residence" || changeResidence ? "пункт 3 статьи 65 СК РФ" : "пункт 2 статьи 66 СК РФ";
  return [
    marker,
    "",
    voluntary ? "" : `В ${values.courtName ?? "[районный суд требует проверки]"}`,
    title,
    `Правовое основание: ${legalBasis}.`,
    "",
    `Заявитель / первый родитель: ${values.applicantData ?? ""}`,
    `Второй родитель: ${values.otherParentData ?? ""}`,
    `Ребёнок: ${values.childData ?? ""}`,
    "",
    `Действующий порядок и фактические обстоятельства: ${facts ?? ""}`,
    scenarioKey === "change" ? `Изменившиеся обстоятельства: ${values.changedCircumstances ?? ""}` : "",
    `Предлагаемое условие или требование: ${subject ?? ""}`,
    values.evidence ? `Подтверждающие документы: ${values.evidence}` : "",
    values.childOpinion ? `Сообщение заявителя о мнении ребёнка: ${values.childOpinion}` : "Мнение ребёнка в документе не сформулировано.",
    "",
    voluntary ? "Подписи родителей: __________________ / __________________" : "Перечень приложений и просительная часть требуют юридической проверки."
  ].filter(Boolean).join("\n");
}

function buildEnforcementDraft(values: ParentsChildValues, title: string) {
  return [
    "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ",
    "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА",
    "Адресат ФССП должен быть подтверждён до подачи.",
    "",
    title,
    "",
    `Заявитель: ${values.applicantData ?? ""}`,
    `Должник / второй родитель: ${values.otherParentData ?? ""}`,
    `Ребёнок: ${values.childData ?? ""}`,
    `Судебный акт: ${values.decisionDetails ?? ""}`,
    values.enforcementDetails ? `Исполнительное производство: ${values.enforcementDetails}` : "Исполнительное производство: сведения требуют уточнения.",
    `Факты неисполнения: ${values.nonCompliance ?? ""}`,
    values.evidence ? `Подтверждения: ${values.evidence}` : "",
    "",
    "Просьба и приложения должны быть проверены с учётом стадии исполнительного производства."
  ].filter(Boolean).join("\n");
}
