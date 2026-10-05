import type { SpousalSupportLegalPath } from "@/data/spousal-support-legal-review";
import { SPOUSAL_SUPPORT_SCENARIOS, type SpousalSupportField, type SpousalSupportScenarioKey } from "@/data/spousal-support-route";
export type SpousalSupportValues = Record<string, string | undefined>;
export type SpousalSupportIssue = { field: string; message: string };
export type SpousalSupportDecision = { allowed: boolean; outcomeKey: string; legalPath: SpousalSupportLegalPath; resultKind: "checklist" | "agreementDraft" | "courtDraft" | "legalReviewOnly"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: boolean; pdfAvailable: true; issues: SpousalSupportIssue[]; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };

export function validateSpousalSupport(scenarioKey: SpousalSupportScenarioKey, values: SpousalSupportValues): SpousalSupportDecision {
  const scenario = SPOUSAL_SUPPORT_SCENARIOS[scenarioKey];
  const visibleFields = getVisibleSpousalSupportFields(scenarioKey, values);
  const preparedData = visibleFields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));
  const missing = visibleFields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, true, missing, preparedData, ["Документ не формируется без критических данных."], ["Заполните обязательные поля."], "");
  if (values.international !== "no") return review(values.international === "yes" ? "international-review" : "international-unclear", "Нужна проверка международного элемента", "Маршрут не определяет применимое право и суд для международной ситуации.", preparedData);
  if (scenarioKey === "agreement") {
    if (values.bothAgree !== "yes") return review(values.bothAgree === "no" ? "agreement-not-reached" : "agreement-unclear", "Согласие сторон не подтверждено", "Добровольный проект возможен только при согласии обеих сторон.", preparedData, "agreement");
    return base(`${values.relationship}-agreement-draft`, "agreement", "agreementDraft", "ПРОЕКТ ДЛЯ НОТАРИУСА", "Проект условий соглашения о содержании", true, [], preparedData, ["Проект не имеет силы нотариально удостоверенного соглашения."], ["Сверьте основание и условия со второй стороной.", "Передайте проект и подтверждающие документы нотариусу.", "Подписывайте окончательный текст только в установленном нотариусом порядке."], buildDraft(values, "Проект условий соглашения о содержании"));
  }
  const expectedRelationship = scenarioKey === "former" ? "former" : "current";
  if (scenarioKey === "assessment" && values.relationship && values.relationship !== expectedRelationship) {
    // Assessment accepts either relationship; the rule set is selected by the answer below.
  }
  if (values.basis === "other" || values.basis === "unsure") return review("basis-not-confirmed", "Основание не подтверждено", "Опубликованный перечень оснований нельзя расширять автоматически.", preparedData);
  if (values.relationship === "current" && values.basis === "pension-long-marriage") return review("former-only-ground", "Основание относится только к бывшему супругу", "Пенсионное основание статьи 90 СК РФ применяется после расторжения брака.", preparedData);
  const eligibility = checkBasis(values.relationship ?? expectedRelationship, values);
  if (eligibility) return review(eligibility.key, eligibility.title, eligibility.notice, preparedData);
  if (values.payerMeans !== "yes") return review(values.payerMeans === "no" ? "necessary-means-not-shown" : "necessary-means-unclear", "Наличие необходимых средств не подтверждено", "Суд оценивает, обладает ли другой супруг необходимыми средствами.", preparedData);
  if (values.supportRefused !== "yes" || values.agreementExists !== "yes") return review("court-preconditions-unclear", "Предпосылки судебного требования не подтверждены", "Для судебного пути нужно проверить отказ от поддержки и отсутствие действующего соглашения.", preparedData);
  if (scenarioKey === "assessment") return base(`${values.relationship}-${values.basis}-assessment`, "assessment", "checklist", "ЧЕК-ЛИСТ ПРИМЕНИМОСТИ", "Проверка права на содержание", true, [], preparedData, ["Предварительные признаки основания выявлены; окончательную оценку обстоятельств и доказательств даёт суд или нотариус."], ["Соберите документы по выбранному основанию.", "Подготовьте сведения о положении обеих сторон.", "При согласии обсудите нотариальное соглашение; при споре проверьте судебный путь."], "");
  if (scenarioKey === "current" && values.relationship === "former") return review("wrong-relationship-route", "Выбран неверный судебный путь", "После развода применяется отдельный перечень статьи 90 СК РФ.", preparedData);
  if (scenarioKey === "former" && values.relationship === "current") return review("wrong-relationship-route", "Выбран неверный судебный путь", "При действующем браке применяется статья 89 СК РФ.", preparedData);
  if (values.courtConfirmed !== "yes" || !isOfficialCourtSource(values.courtSource)) return review("court-not-confirmed", "Суд не подтверждён", "Не включайте неподтверждённый суд в документ. Проверьте его на официальном ресурсе судебной системы.", preparedData, "court");
  const former = scenarioKey === "former";
  const title = former ? "Черновик иска о взыскании алиментов на бывшего супруга" : "Черновик иска о взыскании алиментов на супруга";
  return base(`${scenarioKey}-${values.basis}-court-draft`, "court", "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, true, [], preparedData, ["Размер, основание, подсудность и доказательства должны быть проверены до подачи."], ["Проверьте применимость основания и временные условия.", "Подтвердите материальное и семейное положение сторон.", "Проверьте суд, расчёт и приложения.", "Передайте черновик юристу до подачи."], buildDraft(values, title, values.courtName));
}

function checkBasis(relationship: string, values: SpousalSupportValues) {
  if (values.basis === "disabled-needy" && (values.disabilityConfirmed !== "yes" || values.needConfirmed !== "yes")) return { key: "disability-or-need-not-confirmed", title: "Нетрудоспособность или нуждаемость не подтверждена", notice: "Для этого основания обе характеристики должны подтверждаться документами." };
  if (values.basis === "pregnancy" && relationship === "current" && values.pregnancyConfirmed !== "yes") return { key: "pregnancy-not-confirmed", title: "Беременность не подтверждена", notice: "Для выбранного основания требуется подтверждение беременности." };
  if (values.basis === "pregnancy" && relationship === "former" && values.pregnancyDuringMarriage !== "yes") return { key: "pregnancy-timing-not-confirmed", title: "Время наступления беременности не подтверждено", notice: "Статья 90 СК РФ требует, чтобы беременность бывшей жены наступила в период брака." };
  if ((values.basis === "care-under-three" || values.basis === "care-disabled-child") && (values.commonChild !== "yes" || values.actualCare !== "yes")) return { key: "care-conditions-not-confirmed", title: "Условия ухода не подтверждены", notice: "Нужно подтвердить, что ребёнок общий и заявитель фактически осуществляет уход." };
  if (values.basis === "care-under-three" && values.childUnderThree !== "yes") return { key: "three-year-period-not-confirmed", title: "Трёхлетний период не подтверждён", notice: "Основание действует в течение трёх лет со дня рождения общего ребёнка." };
  if (values.basis === "care-disabled-child" && (values.needConfirmed !== "yes" || !["minor-disabled", "childhood-group-one"].includes(values.disabledChildStatus ?? ""))) return { key: "disabled-child-ground-not-confirmed", title: "Основание по уходу за ребёнком-инвалидом не подтверждено", notice: "Нужно подтвердить нуждаемость и одну из категорий ребёнка, прямо названных законом." };
  if (relationship === "former" && values.basis === "disabled-needy" && !["before-divorce", "within-year"].includes(values.disabilityTiming ?? "")) return { key: "disability-timing-not-confirmed", title: "Срок наступления нетрудоспособности не подтверждён", notice: "Для этого основания нетрудоспособность должна наступить до развода или в течение года после него." };
  if (relationship === "former" && values.basis === "pension-long-marriage" && (values.needConfirmed !== "yes" || values.pensionWithinFiveYears !== "yes")) return { key: "pension-ground-not-confirmed", title: "Условия пенсионного основания не подтверждены", notice: "Нужно подтвердить нуждаемость и достижение пенсионного возраста не позднее пяти лет после развода." };
  if (relationship === "former" && values.basis === "pension-long-marriage") return { key: "long-marriage-individual-review", title: "Нужна индивидуальная оценка длительности брака", notice: "Закон не устанавливает числовой порог длительного брака; условие и достижение возраста в пределах пяти лет после развода оценивает суд." };
  return null;
}
export function getVisibleSpousalSupportFields(scenarioKey: SpousalSupportScenarioKey, values: SpousalSupportValues) {
  const relationship = values.relationship ?? (scenarioKey === "former" ? "former" : "current");
  const basis = values.basis;
  const conditional = new Set<string>();
  if (basis === "disabled-needy") { conditional.add("needConfirmed"); conditional.add("disabilityConfirmed"); if (relationship === "former") conditional.add("disabilityTiming"); }
  if (basis === "pregnancy") conditional.add(relationship === "former" ? "pregnancyDuringMarriage" : "pregnancyConfirmed");
  if (basis === "care-under-three") { conditional.add("commonChild"); conditional.add("actualCare"); conditional.add("childUnderThree"); }
  if (basis === "care-disabled-child") { conditional.add("needConfirmed"); conditional.add("commonChild"); conditional.add("actualCare"); conditional.add("disabledChildStatus"); }
  if (basis === "pension-long-marriage") { conditional.add("needConfirmed"); conditional.add("pensionWithinFiveYears"); conditional.add("marriageDurationDetails"); }
  const conditionalNames = new Set(["needConfirmed", "disabilityConfirmed", "pregnancyConfirmed", "pregnancyDuringMarriage", "commonChild", "actualCare", "childUnderThree", "disabledChildStatus", "disabilityTiming", "pensionWithinFiveYears", "marriageDurationDetails"]);
  return SPOUSAL_SUPPORT_SCENARIOS[scenarioKey].helperFields.filter((field) => !conditionalNames.has(field.name) || conditional.has(field.name));
}
function displayValue(field: SpousalSupportField, value: string) { return field.options?.find((option) => option.value === value)?.label ?? value; }
function isOfficialCourtSource(value?: string) { try { const host = new URL(value ?? "").hostname.toLowerCase(); return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru"); } catch { return false; } }
function review(outcomeKey: string, title: string, notice: string, preparedData: SpousalSupportDecision["preparedData"], legalPath: SpousalSupportLegalPath = "assessment") { return base(outcomeKey, legalPath, "legalReviewOnly", "Требуется юридическая проверка", title, true, [], preparedData, [notice], [notice, "Не используйте результат как готовый документ."], ""); }
function base(outcomeKey: string, legalPath: SpousalSupportLegalPath, resultKind: SpousalSupportDecision["resultKind"], resultLabel: string, documentTitle: string, requiresLegalReview: boolean, issues: SpousalSupportIssue[], preparedData: SpousalSupportDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): SpousalSupportDecision { return { allowed: issues.length === 0 && resultKind !== "legalReviewOnly", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview, pdfAvailable: true, issues, notices, preparedData, filingSteps, draftText }; }
function buildDraft(values: SpousalSupportValues, title: string, addressee?: string) { return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", addressee ? `\nВ ${addressee}` : "", "", title.toUpperCase(), "", `Заявитель: ${values.applicantData ?? ""}`, `Другой супруг: ${values.otherSpouseData ?? ""}`, `Брак и развод: ${values.marriageData ?? ""}`, `Основание: ${values.basisConditions ?? ""}`, `Предлагаемая ежемесячная сумма: ${values.requestedAmount ?? ""}`, `Материальное и семейное положение: ${values.financialCircumstances ?? ""}`, values.paymentTerms ? `Согласованные условия: ${values.paymentTerms}` : "", "", "Основание, доказательства, размер, подсудность и просительная часть подлежат проверке."].filter(Boolean).join("\n"); }
