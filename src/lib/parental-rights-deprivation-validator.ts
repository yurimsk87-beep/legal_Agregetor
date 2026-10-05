import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";
import {
  PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS,
  type ParentalRightsDeprivationField,
  type ParentalRightsDeprivationScenarioKey
} from "@/data/parental-rights-deprivation-route";
import type { ParentalRightsDeprivationLegalPath } from "@/data/parental-rights-deprivation-legal-review";

export type ParentalRightsDeprivationValues = Record<string, string | undefined>;
export type ParentalRightsDeprivationIssue = { field: string; message: string };
export type ParentalRightsDeprivationDecision = {
  allowed: boolean;
  outcomeKey: string;
  legalPath: ParentalRightsDeprivationLegalPath;
  resultKind: "checklist" | "courtDraft" | "legalReviewOnly" | "emergency";
  resultLabel: string;
  documentTitle: string;
  filingReady: false;
  requiresLegalReview: boolean;
  pdfAvailable: boolean;
  issues: ParentalRightsDeprivationIssue[];
  notices: string[];
  preparedData: Array<{ label: string; value: string }>;
  filingSteps: string[];
  draftText: string;
};

const statutoryGrounds = new Set(["duties", "refusal", "abuse", "cruelty", "addiction", "intentional-crime"]);
const courtScenarios = new Set<ParentalRightsDeprivationScenarioKey>(["court", "existing", "support"]);

export function getVisibleParentalRightsDeprivationFields(scenarioKey: ParentalRightsDeprivationScenarioKey, values: ParentalRightsDeprivationValues) {
  return PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS[scenarioKey].helperFields.filter((field) => {
    if (["crimeBefore18", "crimeConfirmed"].includes(field.name)) return false;
    if (field.name === "decisionInForce") return !["authority", "unsure"].includes(values.existingDecisionKind ?? "");
    if (courtScenarios.has(scenarioKey) && ["applicantData", "respondentData", "childData", "courtRegion", "courtName", "courtSource", "courtConfirmed"].includes(field.name)) {
      if (values.immediateDanger !== "no") return false;
      if (values.childStatus === "adult" && !isAdultSpecialCandidate(values)) return false;
      if (["objective", "conflict", "unclear"].includes(values.ground ?? "")) return false;
      if (values.targetRecordedParent !== "yes") return false;
      if (values.applicantRole === "other") return false;
    }
    return true;
  }).flatMap((field) => {
    if (field.name !== "ground" || values.childStatus !== "adult" || values.applicantRole !== "adult-victim") return [field];
    return [
      field,
      { name: "crimeBefore18", label: "Преступление родителя было совершено против заявителя до его совершеннолетия?", type: "select", required: true, options: yesNoUnsure } satisfies ParentalRightsDeprivationField,
      { name: "crimeConfirmed", label: "Факт преступления подтверждён вступившим в силу судебным актом либо иным предусмотренным законом актом?", type: "select", required: true, options: yesNoUnsure } satisfies ParentalRightsDeprivationField
    ];
  });
}

const yesNoUnsure = [
  { label: "Да", value: "yes" },
  { label: "Нет", value: "no" },
  { label: "Не уверен", value: "unsure" }
];

export function validateParentalRightsDeprivation(scenarioKey: ParentalRightsDeprivationScenarioKey, values: ParentalRightsDeprivationValues): ParentalRightsDeprivationDecision {
  const scenario = PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS[scenarioKey];
  const fields = getVisibleParentalRightsDeprivationFields(scenarioKey, values);
  const issues = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));

  if (values.immediateDanger === "yes" || values.immediateDanger === "unsure") {
    return baseDecision("emergency-child-risk", "emergency", "emergency", "Срочные действия", "Инструкция при угрозе ребёнку", false, [], preparedData, ["Обычная подготовка документа остановлена: ожидание может быть опасно."], ["При реальной непосредственной угрозе вызовите экстренные службы по номеру 112.", "Незамедлительно сообщите в полицию и компетентный орган опеки по месту нахождения ребёнка.", "Сообщите точный адрес, характер угрозы и сведения о ребёнке.", "Не откладывайте обращение ради подготовки PDF или судебного иска."], "");
  }
  if (values.targetRecordedParent !== "yes") return review("wrong-target", "Лишение прав неприменимо к выбранному лицу", "Лишение родительских прав относится к матери или отцу, записанным в записи о рождении. Для усыновителя, опекуна или иного лица применяется другой порядок.", preparedData);
  if (values.applicantRole === "other") return review("applicant-standing-review", "Нужно определить надлежащего заявителя", "Круг заявителей ограничен законом. Обратитесь в орган опеки или прокуратуру и не подавайте черновик от ненадлежащего лица.", preparedData);
  if (values.ground === "conflict") return review("family-conflict-not-ground", "Семейный конфликт не подтверждает основание", "Один конфликт между взрослыми не входит в закрытый перечень статьи 69 СК РФ.", preparedData);
  if (values.ground === "objective") return review("restriction-route", "Проверьте ограничение родительских прав", "Если опасность вызвана обстоятельствами, не зависящими от родителя, закон предусматривает отдельную оценку ограничения прав.", preparedData);
  if (values.ground === "unclear") return checklist("grounds-unclear", "Чек-лист проверки основания", "Основание не подтверждено. Сопоставьте факты с закрытым перечнем и получите юридическую проверку.", preparedData);

  if (values.childStatus === "fully-capable") return review("capacity-status-review", "Требуется проверка статуса ребёнка", "Полная дееспособность до 18 лет влияет на применимость обычного маршрута.", preparedData);
  if (issues.length) return baseDecision("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, true, issues, preparedData, ["Заполните обязательные поля."], [], "");

  if (values.childStatus === "adult") {
    if (!isAdultSpecialCandidate(values) || values.crimeBefore18 !== "yes" || values.crimeConfirmed !== "yes") {
      return review("adult-general-path-unavailable", "Обычный маршрут неприменим", "Для совершеннолетнего заявителя маршрут допускает только специальный случай Постановления КС РФ № 49-П. Иные обстоятельства требуют отдельной проверки.", preparedData);
    }
    if (scenarioKey === "grounds") return checklist("adult-special-assessment", "Чек-лист специального основания по Постановлению КС РФ № 49-П", "Проверьте судебный акт о преступлении и его соответствие статье 69 СК РФ.", preparedData, "adult-special");
    return courtDraft(scenarioKey, values, preparedData, "adult-special");
  }
  if (values.childStatus !== "minor") return review("capacity-status-review", "Требуется проверка статуса ребёнка", "Статус ребёнка влияет на применимость обычного маршрута.", preparedData);
  if (!statutoryGrounds.has(values.ground ?? "")) return checklist("grounds-not-confirmed", "Чек-лист проверки основания", "Выбранное основание не подтверждено как одно из оснований статьи 69 СК РФ.", preparedData);
  if (scenarioKey === "grounds") return checklist(`grounds-${values.ground}`, "Персональный чек-лист проверки основания", "Выбрано предполагаемое основание из статьи 69 СК РФ, но его наличие и достаточность определяет только суд.", preparedData);
  return courtDraft(scenarioKey, values, preparedData, scenarioKey === "support" ? "support" : scenarioKey);
}

function courtDraft(scenarioKey: ParentalRightsDeprivationScenarioKey, values: ParentalRightsDeprivationValues, preparedData: ParentalRightsDeprivationDecision["preparedData"], path: ParentalRightsDeprivationLegalPath) {
  const issues = validateCourt(values);
  const title = scenarioKey === "support" ? "Черновик иска о лишении родительских прав с разделом о содержании ребёнка" : scenarioKey === "existing" ? "Черновик иска с учётом ранее принятого акта" : "Черновик иска о лишении родительских прав";
  const notices = ["Лишение родительских прав является крайней мерой; выбранное пользователем основание должен установить суд.", "В деле участвуют прокурор и орган опеки и попечительства."];
  if (scenarioKey === "existing") notices.push("Правовое значение прежнего акта и возможность использовать установленные им обстоятельства требуют проверки.");
  if (scenarioKey === "support") notices.push(values.existingSupport === "yes" ? "Необходимо проверить действующий алиментный документ и не дублировать разрешённое требование." : "Суд решает вопрос о взыскании алиментов, но способ и формулировка требования требуют проверки.");
  return baseDecision(`${scenarioKey}-${path}-draft`, path, "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, true, issues, preparedData, notices, ["Проверьте право заявителя и основание по статье 69 СК РФ.", "Проверьте районный суд и территориальную подсудность по официальному ресурсу.", "Подготовьте доказательства отдельно по каждому ребёнку.", "Проверьте состав участников, требования и приложения у юриста.", "Только после проверки определите способ подачи."], issues.length ? "" : buildCourtDraft(values, title));
}

function validateCourt(values: ParentalRightsDeprivationValues) {
  const issues: ParentalRightsDeprivationIssue[] = [];
  if (!RUSSIAN_REGIONS.some((region) => region.id === values.courtRegion)) issues.push({ field: "courtRegion", message: "Выберите регион из справочника." });
  if (values.courtConfirmed !== "yes") issues.push({ field: "courtConfirmed", message: "Подтвердите суд и подсудность на официальном ресурсе." });
  if (!isOfficialCourtUrl(values.courtSource)) issues.push({ field: "courtSource", message: "Укажите официальную страницу суда." });
  return issues;
}

function isOfficialCourtUrl(value: string | undefined) {
  try {
    const host = new URL(value ?? "").hostname.toLowerCase();
    return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru");
  } catch {
    return false;
  }
}

function isAdultSpecialCandidate(values: ParentalRightsDeprivationValues) {
  return values.applicantRole === "adult-victim" && values.ground === "intentional-crime";
}

function displayValue(field: ParentalRightsDeprivationField, value: string) {
  if (field.name === "courtRegion") return RUSSIAN_REGIONS.find((region) => region.id === value)?.label ?? value;
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

function checklist(outcomeKey: string, title: string, notice: string, preparedData: ParentalRightsDeprivationDecision["preparedData"], path: ParentalRightsDeprivationLegalPath = "assessment") {
  return baseDecision(outcomeKey, path, "checklist", "Персональный чек-лист", title, true, [], preparedData, [notice], ["Сопоставьте каждый факт с конкретным основанием статьи 69 СК РФ.", "Соберите документы, подтверждающие длительность, причины и последствия поведения.", "Проверьте, может ли интерес ребёнка быть защищён иной мерой.", "Получите юридическую проверку до судебного обращения."], "");
}

function review(outcomeKey: string, title: string, notice: string, preparedData: ParentalRightsDeprivationDecision["preparedData"]) {
  return baseDecision(outcomeKey, "assessment", "legalReviewOnly", "Требуется другой путь или юридическая проверка", title, true, [], preparedData, [notice], [notice, "Не используйте общий судебный черновик до определения надлежащего способа защиты.", "Сохраните документы о ребёнке и подтверждения обстоятельств."], "");
}

function baseDecision(outcomeKey: string, legalPath: ParentalRightsDeprivationLegalPath, resultKind: ParentalRightsDeprivationDecision["resultKind"], resultLabel: string, documentTitle: string, requiresLegalReview: boolean, issues: ParentalRightsDeprivationIssue[], preparedData: ParentalRightsDeprivationDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): ParentalRightsDeprivationDecision {
  return { allowed: issues.length === 0 && resultKind !== "legalReviewOnly" && resultKind !== "emergency", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview, pdfAvailable: resultKind !== "emergency", issues, notices, preparedData, filingSteps, draftText };
}

function buildCourtDraft(values: ParentalRightsDeprivationValues, title: string) {
  return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? "[суд требует проверки]"}`, title, `Заявитель: ${values.applicantData ?? ""}`, `Ответчик: ${values.respondentData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Предполагаемое основание: ${values.ground ?? ""}`, `Обстоятельства: ${values.facts ?? ""}`, values.evidence ? `Доказательства: ${values.evidence}` : "", values.existingDecisionDetails ? `Ранее принятый акт или материалы: ${values.existingDecisionDetails}` : "", values.supportDetails ? `Сведения об алиментах: ${values.supportDetails}` : "", values.supportRecipient ? `Получатель содержания ребёнка: ${values.supportRecipient}` : "", "", "Просительная часть, подсудность, состав участников, доказательства и приложения требуют юридической проверки."].filter(Boolean).join("\n");
}
