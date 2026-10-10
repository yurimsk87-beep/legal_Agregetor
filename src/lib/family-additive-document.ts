import { getFamilyAdditiveLegalRules } from "@/data/family-additive-legal-review";
import { getFamilyAdditiveScenario } from "@/data/family-additive-routes";
import type { FamilyAdditiveDecision } from "@/lib/family-additive-validator";

const DRAFT_MARKER = "ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА";

export function buildFamilyAdditiveDocument(decision: FamilyAdditiveDecision) {
  const scenario = getFamilyAdditiveScenario(decision.routeSlug, decision.scenarioKey);
  if (!scenario) throw new Error("Сценарий документа не найден.");
  const rules = getFamilyAdditiveLegalRules(decision.routeSlug);
  const data = Object.fromEntries(decision.preparedData.map((item) => [item.label, item.value]));
  const values = decision.preparedData.map((item) => item.value);
  const court = findValue(data, "наименование суда");
  const applicant = findValue(data, "заявител", "совершеннолетний ребёнок", "родитель-заявитель");
  const counterparty = findValue(data, "ответчик", "получатель алиментов", "родитель, от которого", "совершеннолетний ребёнок", "усыновител");
  const circumstances = decision.preparedData
    .filter((item) => !/суд|ссылка|заявител|ответчик|получатель|усыновител/i.test(item.label))
    .map((item) => `${item.label}: ${item.value}.`)
    .join("\n");
  const legalBasis = rules.map((rule) => `${rule.act}, ${rule.article}: ${rule.statement}`).join("\n");
  const attachments = scenario.documents.map((item, index) => `${index + 1}. ${item}`).join("\n");

  if (decision.resultKind === "officialForm" || decision.resultKind === "preparedData") {
    return [
      "ЛИСТ ПОДГОТОВЛЕННЫХ ДАННЫХ",
      decision.documentTitle.toUpperCase(),
      decision.officialForm ? `Официальная форма № ${decision.officialForm.number}: ${decision.officialForm.title}.` : "",
      "",
      ...decision.preparedData.map((item, index) => `${index + 1}. ${item.label}: ${item.value}`),
      "",
      "ПОРЯДОК ДЕЙСТВИЙ",
      ...decision.filingSteps.map((item, index) => `${index + 1}. ${item}`),
      "",
      "Этот лист не заменяет утверждённый бланк. Перенесите сведения в действующую официальную форму и сверьте их перед подачей."
    ].filter(Boolean).join("\n");
  }

  if (decision.resultKind === "checklist" || decision.resultKind === "legalReviewOnly") {
    return [
      "РЕЗУЛЬТАТ ПРАВОВОЙ ПРОВЕРКИ",
      decision.documentTitle.toUpperCase(),
      "",
      ...decision.notices,
      "",
      "ПОДТВЕРЖДЁННЫЕ СВЕДЕНИЯ",
      ...decision.preparedData.map((item) => `${item.label}: ${item.value}`),
      "",
      "ДАЛЬНЕЙШИЕ ДЕЙСТВИЯ",
      ...decision.filingSteps.map((item, index) => `${index + 1}. ${item}`),
      "",
      "ПРАВОВЫЕ ОСНОВАНИЯ",
      legalBasis
    ].join("\n");
  }

  if (decision.resultKind === "agreementDraft") {
    return [
      DRAFT_MARKER,
      "",
      decision.documentTitle.toUpperCase(),
      "",
      `Сторона 1: ${applicant || values[0] || "сведения требуют заполнения"}`,
      `Сторона 2: ${counterparty || values[1] || "сведения требуют заполнения"}`,
      "",
      "Стороны подтверждают намерение урегулировать семейное обязательство добровольно и определить условия на основании подтверждённых обстоятельств.",
      "",
      "СОГЛАСОВАННЫЕ ОБСТОЯТЕЛЬСТВА И УСЛОВИЯ",
      circumstances,
      "",
      "ПРАВОВЫЕ ОСНОВАНИЯ",
      legalBasis,
      "",
      "Проект подлежит проверке и, когда это предусмотрено законом, нотариальному удостоверению.",
      "",
      "Подпись стороны 1: ____________________    Дата: ______________",
      "Подпись стороны 2: ____________________    Дата: ______________"
    ].join("\n");
  }

  const requestTitle = decision.resultKind === "enforcementDraft" ? "ПРОШУ РАССМОТРЕТЬ ОБРАЩЕНИЕ" : "ПРОШУ СУД";
  return [
    DRAFT_MARKER,
    "",
    court ? `В ${court}` : scenario.filing,
    applicant ? `Заявитель: ${applicant}` : "Заявитель: сведения приведены в подтверждённых обстоятельствах",
    counterparty ? `Другая сторона: ${counterparty}` : "",
    "",
    decision.documentTitle.toUpperCase(),
    "",
    "ОБСТОЯТЕЛЬСТВА",
    circumstances || "Подтверждённые обстоятельства приведены в подготовленных сведениях.",
    "",
    "ПРАВОВЫЕ ОСНОВАНИЯ",
    legalBasis,
    "",
    requestTitle,
    `${scenario.title}. Конкретную формулировку требования, состав участников, подсудность и расчёты проверить до подачи.`,
    "",
    "ПРИЛОЖЕНИЯ",
    attachments,
    "",
    "Дата: ______________    Подпись: ____________________"
  ].filter(Boolean).join("\n");
}

export function getFamilyAdditivePdfFilename(decision: FamilyAdditiveDecision) {
  return `${decision.routeSlug}-${decision.scenarioKey}.pdf`;
}

function findValue(data: Record<string, string>, ...parts: string[]) {
  const entry = Object.entries(data).find(([label]) => parts.some((part) => label.toLowerCase().includes(part)));
  return entry?.[1] ?? "";
}
