import { CHILD_SUPPORT_SCENARIOS } from "@/data/child-support-route";
import type { ChildSupportField, ChildSupportScenarioKey } from "@/data/child-support-route";
import type { ChildSupportLegalPath } from "@/data/child-support-legal-review";

export type ChildSupportValues = Record<string, string | undefined>;
export type ChildSupportResultKind = "agreement" | "courtDraft" | "applicationDraft" | "checklist" | "legalReviewOnly";
export type ChildSupportIssue = { field: string; message: string };

export type ChildSupportDecision = {
  allowed: boolean;
  outcomeKey: string;
  legalPath: ChildSupportLegalPath;
  resultKind: ChildSupportResultKind;
  resultLabel: string;
  documentTitle: string;
  filingReady: boolean;
  requiresLegalReview: boolean;
  pdfAvailable: boolean;
  issues: ChildSupportIssue[];
  notices: string[];
  preparedData: Array<{ label: string; value: string }>;
  filingSteps: string[];
  draftText: string;
};

const courtFieldNames = new Set(["courtName", "courtSource", "courtConfirmed"]);
const bailiffFieldNames = new Set(["bailiffOffice", "bailiffSource"]);

export function getVisibleChildSupportFields(scenarioKey: ChildSupportScenarioKey, values: ChildSupportValues): ChildSupportField[] {
  const fields = CHILD_SUPPORT_SCENARIOS[scenarioKey].helperFields;
  const boundaryField = firstBoundaryField(values);
  if (boundaryField) {
    const boundaryIndex = fields.findIndex((field) => field.name === boundaryField);
    if (boundaryIndex >= 0) return fields.slice(0, boundaryIndex + 1);
  }
  if (scenarioKey === "agreement" && values.bothAgree && values.bothAgree !== "yes") {
    return fields.filter((field) => field.name === "bothAgree");
  }
  if (scenarioKey === "first") {
    const blocked = values.childMinor === "no" || values.paternityRecorded === "no" || values.paternityDispute === "yes" || values.international === "yes" || values.existingInstrument === "yes";
    return fields.filter((field) => !courtFieldNames.has(field.name) || !blocked);
  }
  if (scenarioKey === "change") {
    const voluntary = values.currentBasis === "agreement" && values.bothAgree === "yes";
    return fields.filter((field) => {
      if (field.name === "bothAgree") return values.currentBasis === "agreement";
      return !courtFieldNames.has(field.name) || !voluntary;
    });
  }
  if (scenarioKey === "debt") {
    return fields.filter((field) => {
      if (field.name === "calculationDisputed") return values.bailiffCalculation === "yes";
      if (bailiffFieldNames.has(field.name)) return values.executiveDocument === "yes";
      return true;
    });
  }
  if (scenarioKey === "enforcement") {
    return fields.filter((field) => {
      if (field.name === "enforcementStarted" || bailiffFieldNames.has(field.name)) return values.executiveDocument === "yes";
      if (field.name === "enforcementDetails") return values.executiveDocument === "yes" && values.enforcementStarted === "yes";
      return true;
    });
  }
  return fields;
}

export function validateChildSupport(scenarioKey: ChildSupportScenarioKey, values: ChildSupportValues): ChildSupportDecision {
  const visibleFields = getVisibleChildSupportFields(scenarioKey, values);
  const issues = visibleFields
    .filter((field) => field.required && !values[field.name]?.trim())
    .map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  const preparedData = visibleFields
    .filter((field) => values[field.name]?.trim())
    .map((field) => ({ label: field.label, value: optionLabel(field, values[field.name] ?? "") }));

  const boundary = boundaryDecision(scenarioKey, values, issues, preparedData);
  if (boundary) return boundary;
  if (scenarioKey === "agreement") return agreementDecision(values, issues, preparedData);
  if (scenarioKey === "first") return firstDecision(values, issues, preparedData);
  if (scenarioKey === "change") return changeDecision(values, issues, preparedData);
  if (scenarioKey === "debt") return debtDecision(values, issues, preparedData);
  return enforcementDecision(values, issues, preparedData);
}

function boundaryDecision(scenarioKey: ChildSupportScenarioKey, values: ChildSupportValues, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision | null {
  if (values.international === "yes" || values.international === "unsure") {
    return reviewOnly("international-review", "Международный алиментный вопрос", "Международный элемент требует отдельной проверки юрисдикции, применимого права и порядка признания или исполнения.", issues, preparedData);
  }
  if ((scenarioKey === "agreement" || scenarioKey === "first" || scenarioKey === "change") && values.childMinor && values.childMinor !== "yes") {
    return reviewOnly("age-review", "Проверьте применимый вид содержания", "Этот маршрут предназначен для алиментов на несовершеннолетнего ребёнка. Содержание совершеннолетнего ребёнка регулируется иными условиями.", issues, preparedData);
  }
  if ((scenarioKey === "agreement" || scenarioKey === "first" || scenarioKey === "change") && ((values.paternityRecorded && values.paternityRecorded !== "yes") || (values.paternityDispute && values.paternityDispute !== "no"))) {
    return reviewOnly("parentage-review", "Сначала проверьте происхождение ребёнка", "Спор или отсутствие подтверждённой записи о родителе нельзя разрешать обычным алиментным документом.", issues, preparedData);
  }
  return null;
}

function firstBoundaryField(values: ChildSupportValues) {
  if (values.childMinor && values.childMinor !== "yes") return "childMinor";
  if (values.paternityRecorded && values.paternityRecorded !== "yes") return "paternityRecorded";
  if (values.paternityDispute && values.paternityDispute !== "no") return "paternityDispute";
  if (values.international && values.international !== "no") return "international";
  return null;
}

function agreementDecision(values: ChildSupportValues, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  if (values.bothAgree !== "yes") {
    return reviewOnly("agreement-no-consent", "Соглашение невозможно без согласия обеих сторон", "При отсутствии согласия выберите сценарий первоначального судебного взыскания.", issues, preparedData);
  }
  const title = "Проект условий соглашения об уплате алиментов на ребёнка";
  return {
    allowed: issues.length === 0,
    outcomeKey: "agreement-notary-project",
    legalPath: "agreement",
    resultKind: "agreement",
    resultLabel: "ПРОЕКТ ДЛЯ НОТАРИУСА — НЕ ЯВЛЯЕТСЯ УДОСТОВЕРЕННЫМ СОГЛАШЕНИЕМ",
    documentTitle: title,
    filingReady: false,
    requiresLegalReview: values.paymentMethod === "unsure" || issues.length > 0,
    pdfAvailable: true,
    issues,
    notices: ["Окончательное соглашение должно быть нотариально удостоверено.", "Достаточность размера содержания ребёнка проверяется до удостоверения."],
    preparedData,
    filingSteps: ["Проверьте условия и сведения обеих сторон.", "Подготовьте документы о ребёнке и доходах.", "Передайте проект выбранному нотариусу.", "Уточните тариф и необходимые документы непосредственно у нотариуса.", "Подписывайте только согласованный нотариусом окончательный текст."],
    draftText: issues.length ? "" : buildAgreementDraft(values, title)
  };
}

function firstDecision(values: ChildSupportValues, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  if (values.existingInstrument !== "no") {
    return reviewOnly("existing-instrument", "Сначала определите действующий документ", "Если алименты уже установлены, используйте сценарий изменения, задолженности или исполнения.", issues, preparedData);
  }
  const orderPath = values.paymentMethod === "share" && values.otherInterested === "no";
  const legalPath: ChildSupportLegalPath = orderPath ? "order" : "claim";
  const title = orderPath ? "Черновик заявления о вынесении судебного приказа о взыскании алиментов" : "Черновик искового заявления о взыскании алиментов на ребёнка";
  const courtIssues = validateCourt(values);
  const allIssues = [...issues, ...courtIssues];
  return {
    allowed: allIssues.length === 0,
    outcomeKey: orderPath ? "first-court-order-draft" : "first-claim-draft",
    legalPath,
    resultKind: "courtDraft",
    resultLabel: "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ",
    documentTitle: title,
    filingReady: false,
    requiresLegalReview: true,
    pdfAvailable: true,
    issues: allIssues,
    notices: orderPath ? ["Приказный путь выбран только для долевого требования без указанных осложняющих обстоятельств."] : ["Исковой путь требует проверки обстоятельств, расчёта и состава приложений."],
    preparedData,
    filingSteps: ["Проверьте вид производства и подсудность с юристом.", "Перепроверьте суд по официальной странице.", "Проверьте содержание требования и приложения.", "Не подавайте черновик до устранения маркировки после юридической проверки."],
    draftText: allIssues.length ? "" : buildCourtDraft(values, title, legalPath)
  };
}

function changeDecision(values: ChildSupportValues, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  if (values.currentBasis === "agreement" && values.bothAgree === "yes") {
    const title = "Проект изменения соглашения об уплате алиментов";
    return {
      allowed: issues.length === 0,
      outcomeKey: "change-agreement-project",
      legalPath: "agreement",
      resultKind: "agreement",
      resultLabel: "ПРОЕКТ ДЛЯ НОТАРИУСА — НЕ ЯВЛЯЕТСЯ УДОСТОВЕРЕННЫМ ИЗМЕНЕНИЕМ",
      documentTitle: title,
      filingReady: false,
      requiresLegalReview: true,
      pdfAvailable: true,
      issues,
      notices: ["Изменение нотариального соглашения требует той же формы и проверки нотариусом."],
      preparedData,
      filingSteps: ["Подготовьте действующее соглашение и подтверждения изменений.", "Согласуйте проект со второй стороной.", "Передайте проект нотариусу.", "Подпишите окончательный текст после нотариальной проверки."],
      draftText: issues.length ? "" : buildChangeDraft(values, title, true)
    };
  }
  const title = "Черновик искового заявления об изменении размера или способа уплаты алиментов";
  const courtIssues = validateCourt(values);
  const allIssues = [...issues, ...courtIssues];
  return {
    allowed: allIssues.length === 0,
    outcomeKey: "change-court-draft",
    legalPath: "claim",
    resultKind: "courtDraft",
    resultLabel: "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ",
    documentTitle: title,
    filingReady: false,
    requiresLegalReview: true,
    pdfAvailable: true,
    issues: allIssues,
    notices: ["Суд оценивает изменение обстоятельств и интересы сторон; результат не прогнозируется."],
    preparedData,
    filingSteps: ["Проверьте действующий исполнительный документ.", "Подтвердите изменившиеся обстоятельства.", "Проверьте подсудность и содержание требования с юристом.", "Не подавайте маркированный черновик без проверки."],
    draftText: allIssues.length ? "" : buildChangeDraft(values, title, false)
  };
}

function debtDecision(values: ChildSupportValues, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  if (values.executiveDocument !== "yes") {
    return checklist("debt-check-instrument", "Чек-лист проверки исполнительного документа", "Сначала получите или найдите документ, на основании которого взыскиваются алименты.", issues, preparedData);
  }
  const bailiffIssues = validateBailiff(values);
  const allIssues = [...issues, ...bailiffIssues];
  if (values.bailiffCalculation === "yes" && values.calculationDisputed === "yes") {
    return reviewOnly("debt-dispute-review", "Проверка оспаривания расчёта задолженности", "Способ и срок оспаривания зависят от конкретного постановления и момента его получения.", allIssues, preparedData);
  }
  if (values.bailiffCalculation === "yes") {
    return checklist("debt-calculation-review", "Чек-лист проверки расчёта задолженности", "Сопоставьте расчёт пристава с исполнительным документом и подтверждёнными платежами.", allIssues, preparedData);
  }
  const title = "Черновик заявления судебному приставу о расчёте задолженности по алиментам";
  return applicationDraft("debt-calculation-request", title, allIssues, preparedData, values, ["Передайте обращение только в подтверждённое подразделение ФССП.", "Сохраните подтверждение подачи и полученное постановление."]);
}

function enforcementDecision(values: ChildSupportValues, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  if (values.executiveDocument !== "yes") {
    return checklist("enforcement-get-instrument", "Чек-лист получения исполнительного документа", "Без исполнительного документа обычное обращение к приставу не готовится.", issues, preparedData);
  }
  const allIssues = [...issues, ...validateBailiff(values)];
  const started = values.enforcementStarted === "yes";
  const title = started ? "Черновик обращения судебному приставу о неисполнении алиментных обязательств" : "Черновик заявления о возбуждении исполнительного производства";
  return applicationDraft(started ? "enforcement-bailiff-request" : "enforcement-opening-request", title, allIssues, preparedData, values, started
    ? ["Проверьте номер производства и изложите только подтверждаемые факты.", "Сохраните регистрацию обращения и ответ."]
    : ["Проверьте территориальное подразделение ФССП.", "Приложите исполнительный документ в применимом порядке.", "Сохраните постановление о возбуждении либо письменный отказ."]);
}

function applicationDraft(outcomeKey: string, title: string, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"], values: ChildSupportValues, filingSteps: string[]): ChildSupportDecision {
  return { allowed: issues.length === 0, outcomeKey, legalPath: "enforcement", resultKind: "applicationDraft", resultLabel: "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", documentTitle: title, filingReady: false, requiresLegalReview: true, pdfAvailable: true, issues, notices: ["Подразделение ФССП и стадия производства должны быть подтверждены."], preparedData, filingSteps, draftText: issues.length ? "" : buildBailiffDraft(values, title) };
}

function checklist(outcomeKey: string, title: string, notice: string, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  return { allowed: issues.length === 0, outcomeKey, legalPath: "enforcement", resultKind: "checklist", resultLabel: "Персональный чек-лист", documentTitle: title, filingReady: false, requiresLegalReview: issues.length > 0, pdfAvailable: true, issues, notices: [notice], preparedData, filingSteps: [notice, "Соберите исходный документ и подтверждения платежей.", "После уточнения вернитесь к подходящему сценарию."], draftText: "" };
}

function reviewOnly(outcomeKey: string, title: string, notice: string, issues: ChildSupportIssue[], preparedData: ChildSupportDecision["preparedData"]): ChildSupportDecision {
  return { allowed: false, outcomeKey, legalPath: "claim", resultKind: "legalReviewOnly", resultLabel: "Требуется юридическая проверка", documentTitle: title, filingReady: false, requiresLegalReview: true, pdfAvailable: true, issues, notices: [notice], preparedData, filingSteps: [notice, "Подготовьте документы о ребёнке и действующих обязательствах.", "Не используйте обычный алиментный черновик до определения правильного правового пути."], draftText: "" };
}

function validateCourt(values: ChildSupportValues) {
  const issues: ChildSupportIssue[] = [];
  if (values.courtConfirmed !== "yes") issues.push({ field: "courtConfirmed", message: "Подтвердите суд на официальном ресурсе." });
  if (!isOfficialUrl(values.courtSource, ["sudrf.ru", "vsrf.ru"])) issues.push({ field: "courtSource", message: "Укажите официальную страницу суда." });
  return issues;
}

function validateBailiff(values: ChildSupportValues) {
  return isOfficialUrl(values.bailiffSource, ["fssp.gov.ru"]) ? [] : [{ field: "bailiffSource", message: "Укажите официальную страницу подразделения ФССП." }];
}

function isOfficialUrl(value: string | undefined, hosts: string[]) {
  try {
    const host = new URL(value ?? "").hostname.toLowerCase();
    return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

function optionLabel(field: ChildSupportField, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function buildAgreementDraft(values: ChildSupportValues, title: string) {
  return ["ПРОЕКТ ДЛЯ НОТАРИУСА — НЕ ЯВЛЯЕТСЯ УДОСТОВЕРЕННЫМ СОГЛАШЕНИЕМ", "", title, `Получатель: ${values.applicantData ?? ""}`, `Плательщик: ${values.payerData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Условия выплат: ${values.paymentTerms ?? ""}`, `Индексация: ${values.indexationTerms ?? ""}`, values.agreementExtras ? `Дополнительные условия: ${values.agreementExtras}` : "", "", "Окончательный текст, достаточность содержания и приложения проверяет нотариус."].filter(Boolean).join("\n");
}

function buildCourtDraft(values: ChildSupportValues, title: string, legalPath: ChildSupportLegalPath) {
  return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? "[суд требует проверки]"}`, title, `Заявитель: ${values.applicantData ?? ""}`, `Плательщик: ${values.payerData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Требование и обстоятельства: ${values.requestedSupport ?? ""}`, values.evidence ? `Подтверждения: ${values.evidence}` : "", "", legalPath === "order" ? "Применимость приказного производства должна быть повторно проверена перед подачей." : "Расчёт, просительная часть, подсудность и приложения требуют юридической проверки."].filter(Boolean).join("\n");
}

function buildChangeDraft(values: ChildSupportValues, title: string, voluntary: boolean) {
  const marker = voluntary ? "ПРОЕКТ ДЛЯ НОТАРИУСА — НЕ ЯВЛЯЕТСЯ УДОСТОВЕРЕННЫМ ИЗМЕНЕНИЕМ" : "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ\nТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА";
  return [marker, "", voluntary ? "" : `В ${values.courtName ?? "[суд требует проверки]"}`, title, `Заявитель: ${values.applicantData ?? ""}`, `Вторая сторона: ${values.payerData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Действующие условия: ${values.currentTerms ?? ""}`, `Изменившиеся обстоятельства: ${values.changedCircumstances ?? ""}`, `Требуемое изменение: ${values.requestedChange ?? ""}`, values.evidence ? `Подтверждения: ${values.evidence}` : "", "", voluntary ? "Окончательный текст удостоверяется нотариусом." : "Основания, расчёт и просительная часть требуют юридической проверки."].filter(Boolean).join("\n");
}

function buildBailiffDraft(values: ChildSupportValues, title: string) {
  return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", `Адресат: ${values.bailiffOffice ?? "[подразделение ФССП требует проверки]"}`, "", title, `Заявитель: ${values.applicantData ?? ""}`, `Плательщик: ${values.payerData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Исполнительный документ: ${values.instrumentDetails ?? ""}`, values.enforcementDetails ? `Исполнительное производство: ${values.enforcementDetails}` : "", values.debtPeriod ? `Период задолженности: ${values.debtPeriod}` : "", values.paymentHistory ? `Известные платежи: ${values.paymentHistory}` : "", values.nonPaymentFacts ? `Факты неисполнения: ${values.nonPaymentFacts}` : "", values.evidence ? `Подтверждения: ${values.evidence}` : "", "", "Просьба и приложения должны соответствовать текущей стадии исполнительного производства."].filter(Boolean).join("\n");
}
