import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";
import { PARENTAL_RIGHTS_RESTRICTION_SCENARIOS, type ParentalRightsRestrictionField, type ParentalRightsRestrictionScenarioKey } from "@/data/parental-rights-restriction-route";
import type { ParentalRightsRestrictionLegalPath } from "@/data/parental-rights-restriction-legal-review";

export type ParentalRightsRestrictionValues = Record<string, string | undefined>;
export type ParentalRightsRestrictionIssue = { field: string; message: string };
export type ParentalRightsRestrictionDecision = { allowed: boolean; outcomeKey: string; legalPath: ParentalRightsRestrictionLegalPath; resultKind: "checklist" | "courtDraft" | "legalReviewOnly" | "emergency"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: boolean; pdfAvailable: boolean; issues: ParentalRightsRestrictionIssue[]; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };

const courtIdentityFields = new Set(["applicantData", "respondentData", "childData", "courtRegion", "courtName", "courtSource", "courtConfirmed", "existingSupport", "supportDetails"]);

export function getVisibleParentalRightsRestrictionFields(scenarioKey: ParentalRightsRestrictionScenarioKey, values: ParentalRightsRestrictionValues) {
  return PARENTAL_RIGHTS_RESTRICTION_SCENARIOS[scenarioKey].helperFields.filter((field) => {
    if (scenarioKey === "court") {
      if (["objectiveReason"].includes(field.name)) return values.dangerSource === "objective";
      if (["behaviorAssessment"].includes(field.name)) return values.dangerSource === "behavior";
      if (field.name === "facts" || field.name === "evidence") {
        const firstOccurrence = PARENTAL_RIGHTS_RESTRICTION_SCENARIOS[scenarioKey].helperFields.findIndex((item) => item.name === field.name);
        if (PARENTAL_RIGHTS_RESTRICTION_SCENARIOS[scenarioKey].helperFields.indexOf(field) !== firstOccurrence) return false;
        return ["objective", "behavior"].includes(values.dangerSource ?? "");
      }
      if (courtIdentityFields.has(field.name)) {
        if (values.immediateDanger !== "no" || values.targetRecordedParent !== "yes" || values.childStatus !== "minor" || values.childLeftDangerous !== "yes") return false;
        if (!["parent", "close-relative", "prosecutor", "authority"].includes(values.applicantRole ?? "")) return false;
        if (values.dangerSource === "objective" && values.objectiveReason === "unsure") return false;
        if (values.dangerSource === "behavior" && values.behaviorAssessment !== "danger-insufficient") return false;
        if (values.dangerSource === "unclear" || !values.dangerSource) return false;
      }
    }
    return true;
  });
}

export function validateParentalRightsRestriction(scenarioKey: ParentalRightsRestrictionScenarioKey, values: ParentalRightsRestrictionValues): ParentalRightsRestrictionDecision {
  const scenario = PARENTAL_RIGHTS_RESTRICTION_SCENARIOS[scenarioKey];
  const fields = getVisibleParentalRightsRestrictionFields(scenarioKey, values);
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));

  if (values.immediateDanger === "yes" || values.immediateDanger === "unsure") return base("emergency-child-risk", "emergency", "emergency", "Срочные действия", "Инструкция при угрозе ребёнку", false, [], preparedData, ["Обычная подготовка документа остановлена: ожидание может быть опасно."], ["При реальной непосредственной угрозе вызовите экстренные службы по номеру 112.", "Незамедлительно сообщите в полицию и компетентный орган опеки по месту нахождения ребёнка.", "Сообщите точный адрес, характер угрозы и сведения о ребёнке.", "Не откладывайте обращение ради подготовки PDF или иска."], "");
  if (values.targetRecordedParent !== "yes") return review("wrong-target", "Маршрут неприменим к выбранному лицу", "Ограничение родительских прав относится к матери или отцу, записанным в записи о рождении.", preparedData);
  if (values.childStatus !== "minor") return review("child-status-review", "Обычный маршрут неприменим", "Статус ребёнка не позволяет использовать обычный маршрут ограничения родительских прав без отдельной проверки.", preparedData);
  if (["child-14", "other"].includes(values.applicantRole ?? "")) return review("applicant-standing-review", "Нужно определить надлежащего заявителя", "Круг заявителей установлен пунктом 3 статьи 73 СК РФ. Не подавайте судебный черновик без проверки права на обращение.", preparedData);
  if (values.childLeftDangerous === "no") return review("danger-not-confirmed", "Опасность оставления ребёнка не подтверждена", "Ограничение связано с опасностью оставления ребёнка с родителем. Выберите другой способ защиты интересов ребёнка.", preparedData);
  if (values.childLeftDangerous === "unsure") return checklist("danger-unclear", "Чек-лист проверки опасности", "Нужно установить конкретные факты и последствия для ребёнка.", preparedData, "assessment");

  const path = scenarioKey === "objective" ? "objective" : scenarioKey === "behavior" ? "behavior" : values.dangerSource;
  if (path === "objective") {
    if (values.objectiveReason === "unsure") return checklist("objective-unclear", "Чек-лист проверки объективных обстоятельств", "Причина опасности пока не определена.", preparedData, "objective");
  } else if (path === "behavior") {
    if (values.behaviorAssessment === "possible-deprivation") return review("possible-deprivation", "Нужно проверить маршрут лишения родительских прав", "Если имеются достаточные основания статьи 69 СК РФ, ограничение нельзя автоматически подменять лишением или наоборот.", preparedData);
    if (values.behaviorAssessment === "conflict") return review("family-conflict", "Обычный конфликт не подтверждает опасность", "Конфликт между взрослыми сам по себе не является основанием ограничения родительских прав.", preparedData);
    if (values.behaviorAssessment === "unsure") return checklist("behavior-unclear", "Чек-лист разграничения мер", "Нужно разграничить опасное поведение, основания лишения и семейный конфликт.", preparedData, "behavior");
  } else if (scenarioKey === "court") {
    return checklist("danger-source-unclear", "Чек-лист определения источника опасности", "До подготовки судебного черновика определите источник опасности.", preparedData, "assessment");
  }

  const missing = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, true, missing, preparedData, ["Заполните обязательные поля."], [], "");
  if (scenarioKey !== "court") return checklist(`${scenarioKey}-assessment`, scenario.mainDocument, "Помощник подготовил факты для юридической проверки; наличие основания определяет суд.", preparedData, scenarioKey);

  const courtIssues = validateCourt(values);
  const title = values.dangerSource === "objective" ? "Черновик иска об ограничении родительских прав по объективным обстоятельствам" : "Черновик иска об ограничении родительских прав в связи с опасным поведением";
  const notices = ["Ограничение родительских прав и наличие опасности устанавливает только суд.", "В деле участвуют прокурор и орган опеки и попечительства.", values.existingSupport === "yes" ? "Проверьте действующий алиментный документ и не дублируйте разрешённое требование." : "Суд решает вопрос о взыскании алиментов, но формулировка требования требует проверки."];
  if (values.dangerSource === "behavior") notices.push("Если после решения поведение не изменится, статья 73 СК РФ предусматривает последующее обращение органа опеки с иском о лишении прав; это не происходит автоматически.");
  return base(`court-${values.dangerSource}-draft`, "court", "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, true, courtIssues, preparedData, notices, ["Проверьте право заявителя и основание по статье 73 СК РФ.", "Проверьте районный суд и территориальную подсудность по официальному ресурсу.", "Подготовьте доказательства опасности отдельно по каждому ребёнку.", "Проверьте участников, требования, алиментную часть и приложения у юриста.", "Только после проверки определите способ подачи."], courtIssues.length ? "" : buildCourtDraft(values, title));
}

function validateCourt(values: ParentalRightsRestrictionValues) { const issues: ParentalRightsRestrictionIssue[] = []; if (!RUSSIAN_REGIONS.some((region) => region.id === values.courtRegion)) issues.push({ field: "courtRegion", message: "Выберите регион из справочника." }); if (values.courtConfirmed !== "yes") issues.push({ field: "courtConfirmed", message: "Подтвердите суд и подсудность на официальном ресурсе." }); if (!isOfficialCourtUrl(values.courtSource)) issues.push({ field: "courtSource", message: "Укажите официальную страницу суда." }); return issues; }
function isOfficialCourtUrl(value: string | undefined) { try { const host = new URL(value ?? "").hostname.toLowerCase(); return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru"); } catch { return false; } }
function displayValue(field: ParentalRightsRestrictionField, value: string) { if (field.name === "courtRegion") return RUSSIAN_REGIONS.find((region) => region.id === value)?.label ?? value; return field.options?.find((option) => option.value === value)?.label ?? value; }
function checklist(outcomeKey: string, title: string, notice: string, preparedData: ParentalRightsRestrictionDecision["preparedData"], path: ParentalRightsRestrictionLegalPath) { return base(outcomeKey, path, "checklist", "Персональный чек-лист", title, true, [], preparedData, [notice], ["Зафиксируйте конкретную опасность и её последствия для ребёнка.", "Соберите законно полученные документы и сведения.", "Проверьте надлежащего заявителя и возможный иной способ защиты.", "Получите юридическую проверку до судебного обращения."], ""); }
function review(outcomeKey: string, title: string, notice: string, preparedData: ParentalRightsRestrictionDecision["preparedData"]) { return base(outcomeKey, "assessment", "legalReviewOnly", "Требуется другой путь или юридическая проверка", title, true, [], preparedData, [notice], [notice, "Не используйте судебный черновик до определения надлежащего способа защиты.", "Сохраните документы о ребёнке и подтверждения обстоятельств."], ""); }
function base(outcomeKey: string, legalPath: ParentalRightsRestrictionLegalPath, resultKind: ParentalRightsRestrictionDecision["resultKind"], resultLabel: string, documentTitle: string, requiresLegalReview: boolean, issues: ParentalRightsRestrictionIssue[], preparedData: ParentalRightsRestrictionDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): ParentalRightsRestrictionDecision { return { allowed: issues.length === 0 && resultKind !== "legalReviewOnly" && resultKind !== "emergency", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview, pdfAvailable: resultKind !== "emergency", issues, notices, preparedData, filingSteps, draftText }; }
function buildCourtDraft(values: ParentalRightsRestrictionValues, title: string) { return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? "[суд требует проверки]"}`, title, `Заявитель: ${values.applicantData ?? ""}`, `Ответчик: ${values.respondentData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Источник опасности: ${values.dangerSource ?? ""}`, `Обстоятельства: ${values.facts ?? ""}`, values.evidence ? `Доказательства: ${values.evidence}` : "", values.supportDetails ? `Сведения об алиментах: ${values.supportDetails}` : "", "", "Просительная часть, подсудность, состав участников, доказательства и приложения требуют юридической проверки."].filter(Boolean).join("\n"); }
