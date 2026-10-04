import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";
import type { ChildTravelLegalPath } from "@/data/child-travel-legal-review";
import { CHILD_TRAVEL_SCENARIOS, type ChildTravelField, type ChildTravelScenarioKey } from "@/data/child-travel-route";

export type ChildTravelValues = Record<string, string | undefined>;
export type ChildTravelIssue = { field: string; message: string };
export type ChildTravelDecision = { allowed: boolean; outcomeKey: string; legalPath: ChildTravelLegalPath; resultKind: "checklist" | "dataSheet" | "courtDraft" | "legalReviewOnly"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: boolean; pdfAvailable: true; issues: ChildTravelIssue[]; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };

export function getVisibleChildTravelFields(scenarioKey: ChildTravelScenarioKey) { return CHILD_TRAVEL_SCENARIOS[scenarioKey].helperFields; }

export function validateChildTravel(scenarioKey: ChildTravelScenarioKey, values: ChildTravelValues): ChildTravelDecision {
  const scenario = CHILD_TRAVEL_SCENARIOS[scenarioKey];
  const fields = getVisibleChildTravelFields(scenarioKey);
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));
  const missing = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, missing, preparedData, ["Заполните обязательные поля."], [], "", true);
  if (values.region && !RUSSIAN_REGIONS.some((region) => region.id === values.region)) return base("invalid-region", "assessment", "legalReviewOnly", "Регион не подтверждён", scenario.mainDocument, [{ field: "region", message: "Выберите регион из справочника." }], preparedData, ["Произвольное название региона не используется."], [], "", true);
  if (scenarioKey === "foreign-requirements") return review("foreign-requirements-review", scenario.mainDocument, "Требования въезда, транзита, перевода и легализации подтверждаются компетентными органами каждого государства.", preparedData, "foreign");
  if (scenarioKey === "disagreement") {
    if (values.withdrawalPossible === "yes") return base("withdrawal-first", "assessment", "checklist", "Сначала проверьте отзыв несогласия", "Чек-лист отзыва заявления о несогласии", [], preparedData, ["Отозвать несогласие может подавший его законный представитель.", "До официального подтверждения отзыва не считайте ограничение снятым."], scenario.steps, "", true);
    const draftText = buildCourtDraft(values);
    return base(values.withdrawalPossible === "unsure" ? "disagreement-status-review" : "court-dispute-draft", "court", "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", scenario.mainDocument, [], preparedData, ["Подсудность, требования, пошлина и доказательства не определяются автоматически."], scenario.steps, draftText, true);
  }
  if (values.russianCitizen !== "yes") return review("citizenship-review", "Нужно определить применимое право", "Статьи 20–21 Закона № 114-ФЗ в этой ветке применены к несовершеннолетнему гражданину России.", preparedData, "foreign");
  if (values.travelDocument !== "yes") return review("travel-document-review", "Документ ребёнка не подтверждён", "До поездки подтвердите действительный документ, позволяющий ребёнку пересечь границу.", preparedData, "assessment");
  if (values.nonConsent !== "none") return review(values.nonConsent === "exists" ? "non-consent-detected" : "non-consent-unclear", "Нужно проверить несогласие на выезд", "Не продолжайте обычный маршрут, пока наличие и пределы несогласия не проверены.", preparedData, "court");
  if (scenarioKey === "without-parents" && values.notaryPlanned !== "yes") return review("notarial-consent-required", "Требуется нотариальное согласие", "Лист данных не заменяет нотариально оформленное согласие законного представителя.", preparedData, "notarial");
  const kind = scenarioKey === "without-parents" ? "dataSheet" : "checklist";
  const label = scenarioKey === "without-parents" ? "Лист данных — НЕ ЯВЛЯЕТСЯ НОТАРИАЛЬНЫМ СОГЛАСИЕМ" : "Персональный чек-лист российского выезда";
  return base(`${scenarioKey}-checklist`, scenarioKey === "without-parents" ? "notarial" : "russian-exit", kind, label, scenario.mainDocument, [], preparedData, ["Требования страны въезда, транзита и перевозчика проверяются отдельно."], scenario.steps, "", scenarioKey === "without-parents");
}

function displayValue(field: ChildTravelField, value: string) { if (field.name === "region") return RUSSIAN_REGIONS.find((region) => region.id === value)?.label ?? value; return field.options?.find((option) => option.value === value)?.label ?? value; }
function review(outcomeKey: string, title: string, notice: string, preparedData: ChildTravelDecision["preparedData"], path: ChildTravelLegalPath) { return base(outcomeKey, path, "legalReviewOnly", "Требуется юридическая проверка", title, [], preparedData, [notice], [notice, "Не используйте результат как разрешение на поездку или документ для подачи."], "", true); }
function base(outcomeKey: string, legalPath: ChildTravelLegalPath, resultKind: ChildTravelDecision["resultKind"], resultLabel: string, documentTitle: string, issues: ChildTravelIssue[], preparedData: ChildTravelDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string, requiresLegalReview: boolean): ChildTravelDecision { return { allowed: issues.length === 0 && resultKind !== "legalReviewOnly", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview, pdfAvailable: true, issues, notices, preparedData, filingSteps, draftText }; }
function buildCourtDraft(values: ChildTravelValues) { return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "", "Обстоятельства спора о возможности выезда ребёнка из Российской Федерации", `Заявитель: ${values.applicantData}`, `Ребёнок: ${values.childData}`, `Законный представитель, заявивший несогласие: ${values.objectorData}`, `Пределы несогласия: ${values.disagreementScope}`, `Планируемая поездка: ${values.desiredTrip}`, `Интересы ребёнка: ${values.childInterests}`, `Доказательства: ${values.evidence}`, "", "Подсудность, состав участников, требования, пошлина и приложения должны быть определены юристом до обращения в суд."].join("\n"); }
