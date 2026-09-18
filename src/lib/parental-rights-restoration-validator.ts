import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";
import type { ParentalRightsRestorationLegalPath } from "@/data/parental-rights-restoration-legal-review";
import { PARENTAL_RIGHTS_RESTORATION_SCENARIOS, type ParentalRightsRestorationField, type ParentalRightsRestorationScenarioKey } from "@/data/parental-rights-restoration-route";

export type ParentalRightsRestorationValues = Record<string, string | undefined>;
export type ParentalRightsRestorationIssue = { field: string; message: string };
export type ParentalRightsRestorationDecision = { allowed: boolean; outcomeKey: string; legalPath: ParentalRightsRestorationLegalPath; resultKind: "courtDraft" | "legalReviewOnly"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: true; pdfAvailable: true; issues: ParentalRightsRestorationIssue[]; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };

const courtFieldNames = new Set(["courtRegion", "courtName", "courtSource", "courtConfirmed"]);
export function getVisibleParentalRightsRestorationFields(scenarioKey: ParentalRightsRestorationScenarioKey, values: ParentalRightsRestorationValues) {
  return PARENTAL_RIGHTS_RESTORATION_SCENARIOS[scenarioKey].helperFields.filter((field) => {
    if (field.name === "childConsent") return values.childAge === "10-17";
    if (field.name === "adoptionCancelled") return values.childAdopted === "yes";
    if (scenarioKey === "barrier-review" && courtFieldNames.has(field.name)) return false;
    return true;
  });
}

export function validateParentalRightsRestoration(scenarioKey: ParentalRightsRestorationScenarioKey, values: ParentalRightsRestorationValues): ParentalRightsRestorationDecision {
  const scenario = PARENTAL_RIGHTS_RESTORATION_SCENARIOS[scenarioKey];
  const fields = getVisibleParentalRightsRestorationFields(scenarioKey, values);
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));
  const missing = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, missing, preparedData, ["Без критических данных судебный черновик не формируется."], ["Заполните обязательные поля и повторите проверку."], "");
  if (values.deprivationDecision !== "yes") return review(values.deprivationDecision === "no" ? "no-deprivation-decision" : "deprivation-decision-unclear", "Решение о лишении не подтверждено", "Восстановление по статье 72 СК РФ применяется к родителю, лишённому прав вступившим в силу решением суда.", preparedData);
  if (values.childAge === "adult") return review("adult-child", "Ребёнок достиг совершеннолетия", "Маршрут восстановления родительских прав в отношении несовершеннолетнего неприменим без отдельного правового основания.", preparedData);
  if (values.childAge === "unsure") return review("child-age-unclear", "Возраст ребёнка не подтверждён", "Возраст влияет на применимость маршрута и обязательность согласия ребёнка.", preparedData);
  if (values.childAdopted === "unsure") return review("adoption-status-unclear", "Статус усыновления не подтверждён", "До подготовки иска необходимо проверить, был ли ребёнок усыновлён.", preparedData, "barrier");
  if (values.childAdopted === "yes" && values.adoptionCancelled !== "yes") return review(values.adoptionCancelled === "no" ? "adoption-barrier" : "adoption-cancellation-unclear", "Восстановление сейчас не подтверждено", "Если ребёнок усыновлён и усыновление не отменено, восстановление родительских прав не допускается.", preparedData, "barrier");
  if (values.childAge === "10-17" && values.childConsent !== "yes") return review(values.childConsent === "no" ? "child-refuses" : "child-consent-unclear", "Согласие ребёнка не подтверждено", "Для ребёнка от 10 лет восстановление возможно только с его согласием.", preparedData, "barrier");
  if (values.circumstancesChanged !== "yes") return review(values.circumstancesChanged === "no" ? "changes-not-confirmed" : "changes-unclear", "Изменения обстоятельств не подтверждены", "Суд проверяет изменения поведения, образа жизни и/или отношения к воспитанию ребёнка.", preparedData);
  if (values.currentRisks !== "no") return review(values.currentRisks === "yes" ? "current-risks" : "risks-unclear", "Требуется оценить текущие риски", "Интересы и безопасность ребёнка имеют самостоятельное значение для решения суда.", preparedData);
  if (scenarioKey === "barrier-review") return review("no-statutory-barrier-detected", "Явное препятствие не выявлено", "Для подготовки судебного черновика выберите основной сценарий восстановления и заполните сведения о сторонах и суде.", preparedData);
  if (values.courtConfirmed !== "yes" || !isOfficialCourtSource(values.courtSource)) return review("court-not-confirmed", "Суд не подтверждён", "Используйте официальную страницу судебной системы и проверьте территориальную подсудность до подготовки черновика.", preparedData, scenarioKey === "restoration-return" ? "return" : "court");
  const title = scenarioKey === "restoration-return" ? "Черновик иска о восстановлении в родительских правах и возврате ребёнка" : "Черновик иска о восстановлении в родительских правах";
  const legalPath = scenarioKey === "restoration-return" ? "return" : "court";
  return base(`${scenarioKey}-court-draft`, legalPath, "courtDraft", "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", title, [], preparedData, ["Требуются проверка подсудности, состава участников, доказательств, просительной части и приложений."], ["Сверьте полный текст решения о лишении прав.", "Получите и проверьте относимые доказательства изменений.", "Подтвердите ответчика, орган опеки, прокурора и суд.", "Проверьте черновик у юриста.", "Только после проверки формируйте окончательный иск и приложения."], buildCourtDraft(values, title, scenarioKey === "restoration-return"));
}

function displayValue(field: ParentalRightsRestorationField, value: string) { if (field.name === "courtRegion") return RUSSIAN_REGIONS.find((region) => region.id === value)?.label ?? value; return field.options?.find((option) => option.value === value)?.label ?? value; }
function isOfficialCourtSource(value?: string) { try { const host = new URL(value ?? "").hostname.toLowerCase(); return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru"); } catch { return false; } }
function review(outcomeKey: string, title: string, notice: string, preparedData: ParentalRightsRestorationDecision["preparedData"], path: ParentalRightsRestorationLegalPath = "assessment") { return base(outcomeKey, path, "legalReviewOnly", "Требуется юридическая проверка", title, [], preparedData, [notice], [notice, "Не используйте результат как исковое заявление."], ""); }
function base(outcomeKey: string, legalPath: ParentalRightsRestorationLegalPath, resultKind: ParentalRightsRestorationDecision["resultKind"], resultLabel: string, documentTitle: string, issues: ParentalRightsRestorationIssue[], preparedData: ParentalRightsRestorationDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): ParentalRightsRestorationDecision { return { allowed: issues.length === 0 && resultKind === "courtDraft", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview: true, pdfAvailable: true, issues, notices, preparedData, filingSteps, draftText }; }
function buildCourtDraft(values: ParentalRightsRestorationValues, title: string, includeReturn: boolean) { return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? "[суд требует проверки]"}`, "", `Истец: ${values.applicantData ?? ""}`, `Ответчик: ${values.caregiverData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, "", title.toUpperCase(), "", `Решение о лишении прав: ${values.decisionDetails ?? ""}`, `Изменившиеся обстоятельства и доказательства: ${values.changeEvidence ?? ""}`, includeReturn ? `Основания требования о возврате ребёнка: ${values.returnBasis ?? ""}` : "", includeReturn ? `Условия проживания, ухода и воспитания: ${values.livingConditions ?? ""}` : "", "", "Просительная часть, состав участников, мнение ребёнка, заключение органа опеки, доказательства и приложения требуют юридической проверки."].filter(Boolean).join("\n"); }
