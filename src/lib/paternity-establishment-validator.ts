import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";
import { PATERNITY_ESTABLISHMENT_SCENARIOS, type PaternityEstablishmentField, type PaternityEstablishmentScenarioKey } from "@/data/paternity-establishment-route";
import type { PaternityEstablishmentLegalPath } from "@/data/paternity-establishment-legal-review";

export type PaternityEstablishmentValues = Record<string, string | undefined>;
export type PaternityEstablishmentIssue = { field: string; message: string };
export type PaternityEstablishmentDecision = { allowed: boolean; outcomeKey: string; legalPath: PaternityEstablishmentLegalPath; resultKind: "dataSheet" | "courtDraft" | "checklist" | "legalReviewOnly"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: boolean; pdfAvailable: boolean; issues: PaternityEstablishmentIssue[]; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };

const voluntaryDetailFields = new Set(["motherData", "fatherData", "childData", "childNameAfter"]);
const courtDetailFields = new Set(["motherData", "fatherData", "childData", "applicantData", "respondentData", "evidence", "courtRegion", "courtName", "courtSource", "courtConfirmed"]);

export function getVisiblePaternityEstablishmentFields(scenarioKey: PaternityEstablishmentScenarioKey, values: PaternityEstablishmentValues) {
  return PATERNITY_ESTABLISHMENT_SCENARIOS[scenarioKey].helperFields.filter((field) => {
    if (field.name === "adultConsent") return values.childAge === "adult";
    if (scenarioKey === "voluntary") {
      if (field.name === "attendance") return values.voluntaryBasis === "joint";
      if (["motherCircumstance", "guardianshipConsent"].includes(field.name)) return values.voluntaryBasis === "father-only";
      if (voluntaryDetailFields.has(field.name)) {
        if (values.existingFatherRecord !== "no" || !values.childAge || !values.voluntaryBasis) return false;
        if (values.childAge === "adult" && values.adultConsent !== "yes") return false;
        if (values.voluntaryBasis === "joint" && !values.attendance) return false;
        if (values.voluntaryBasis === "father-only" && (!values.motherCircumstance || values.motherCircumstance === "other" || values.guardianshipConsent !== "yes")) return false;
      }
    }
    if (["court", "combined"].includes(scenarioKey) && courtDetailFields.has(field.name)) {
      if (values.existingFatherRecord !== "no" || !values.childAge) return false;
      if (values.childAge === "adult" && values.adultConsent !== "yes") return false;
      if (scenarioKey === "court" && !values.applicantRole) return false;
      if (scenarioKey === "combined" && !values.combinedIssue) return false;
    }
    return true;
  });
}

export function validatePaternityEstablishment(scenarioKey: PaternityEstablishmentScenarioKey, values: PaternityEstablishmentValues): PaternityEstablishmentDecision {
  const scenario = PATERNITY_ESTABLISHMENT_SCENARIOS[scenarioKey];
  const fields = getVisiblePaternityEstablishmentFields(scenarioKey, values);
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));

  if (values.existingFatherRecord === "yes" && scenarioKey !== "existing-record") return review("existing-father-record", "Сначала проверьте существующую запись об отце", "Нельзя заменить записанного отца новым заявлением об установлении отцовства. Нужна судебная проверка требований и участников.", preparedData, "record-review");
  if (values.existingFatherRecord === "unsure") return review("record-unclear", "Нужно проверить запись о рождении", "Получите актуальное свидетельство или выписку: наличие другого записанного отца меняет весь правовой путь.", preparedData, "assessment");
  if (values.childAge === "unsure") return review("age-unclear", "Нужно уточнить возраст", "Для совершеннолетнего лица требуется его согласие на установление отцовства.", preparedData, "assessment");
  if (values.childAge === "adult" && values.adultConsent !== "yes") return review(values.adultConsent === "no" ? "adult-no-consent" : "adult-consent-unclear", "Нет подтверждённого согласия совершеннолетнего", "Без согласия совершеннолетнего лица маршрут не формирует результат для установления отцовства.", preparedData, "assessment");

  if (scenarioKey === "voluntary") {
    if (values.voluntaryBasis === "father-only" && values.motherCircumstance === "other") return review("father-only-wrong-basis", "Единоличное заявление отца не подтверждено", "Указанное обстоятельство не входит в закрытый перечень специального порядка. Требуется иной путь.", preparedData, "assessment");
    if (values.voluntaryBasis === "father-only" && values.guardianshipConsent !== "yes") return review(values.guardianshipConsent === "no" ? "guardianship-no-consent" : "guardianship-consent-unclear", "Нет подтверждённого согласия органа опеки", "При отсутствии согласия органа опеки вопрос разрешается судом.", preparedData, "assessment");
  }
  if (scenarioKey === "court" && values.applicantRole === "other") return review("applicant-standing-review", "Право заявителя не подтверждено", "Статья 49 СК РФ устанавливает круг лиц, которые вправе обратиться за установлением отцовства.", preparedData, "assessment");
  if (scenarioKey === "deceased") {
    if (values.deceasedAcknowledged === "unsure" || values.rightDispute === "unsure") return review("deceased-path-unclear", "Нельзя определить вид производства", "Нужно установить, признавал ли умерший отцовство и имеется ли спор о праве.", preparedData, "assessment");
    if (values.rightDispute === "yes") return review("deceased-right-dispute", "Есть спор о праве", "Особое производство неприменимо. Требуется определить исковые требования и участников у юриста.", preparedData, "assessment");
  }
  if (scenarioKey === "existing-record") {
    if (values.existingFatherRecord !== "yes") return checklist("record-not-confirmed", "Чек-лист проверки записи о рождении", "Существующая запись о другом отце не подтверждена; выберите добровольный или судебный маршрут после проверки документа.", preparedData, "assessment");
  }
  if (scenarioKey === "combined" && values.combinedIssue === "other") return review("combined-other-review", "Дополнительное требование требует отдельной квалификации", "Помощник не объединяет автоматически семейные, наследственные или регистрационные требования.", preparedData, "assessment");

  const missing = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, true, missing, preparedData, ["Заполните обязательные поля."], [], "");

  if (scenarioKey === "voluntary") {
    const form = values.voluntaryBasis === "father-only" ? "№ 19" : values.attendance === "father-absent" ? "№ 15 и № 16" : values.attendance === "mother-absent" ? "№ 15 и № 17" : "№ 15";
    return base(`voluntary-form-${form.replace(/[^0-9]+/g, "-").replace(/^-|-$/g, "")}`, "zags", "dataSheet", "Лист подготовленных данных", `Данные для формы ${form} об установлении отцовства`, true, [], preparedData, [`Официальная форма: ${form}.`, "Лист данных не является заявлением и не готов к подаче."], ["Сверьте сведения с документами.", `Перенесите данные в действующую форму ${form} либо используйте подтверждённый электронный сервис.`, "Проверьте необходимость личного присутствия и удостоверения подписи.", "Оплатите пошлину с учётом возможной льготы.", "Сохраните подтверждение обращения."], "");
  }
  if (scenarioKey === "existing-record") return review("existing-record-court-review", "Требуется судебная проверка существующей записи", "Не формируйте новое заявление ЗАГС до определения требований об исключении или изменении записи.", preparedData, "record-review");
  if (scenarioKey === "deceased") {
    const title = values.deceasedAcknowledged === "yes" ? "Черновик заявления об установлении факта признания отцовства" : "Черновик заявления об установлении факта отцовства";
    return base(`deceased-${values.deceasedAcknowledged === "yes" ? "recognition" : "paternity"}-draft`, "deceased", "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, true, validateCourt(values), preparedData, ["Особое производство допустимо только при отсутствии спора о праве.", "Дата рождения ребёнка и цель обращения требуют проверки применимого регулирования."], ["Проверьте вид устанавливаемого факта и применимое право по дате рождения ребёнка.", "Определите всех заинтересованных лиц.", "Проверьте суд и подсудность.", "Проверьте доказательства и юридическую цель у юриста.", "Только после проверки определите способ подачи."], buildCourtDraft(values, title));
  }

  const combined = scenarioKey === "combined";
  const title = combined ? "Черновик иска об установлении отцовства и взыскании алиментов" : "Черновик иска об установлении отцовства";
  const issues = validateCourt(values);
  return base(combined ? "court-paternity-support-draft" : "court-paternity-draft", combined ? "combined" : "court", "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, true, issues, preparedData, combined ? ["Требования об установлении отцовства и алиментах проверяются раздельно.", "Алименты при удовлетворении требования присуждаются со дня обращения в суд; прошедший период автоматически не добавляется."] : ["Происхождение ребёнка и достаточность доказательств устанавливает только суд."], ["Проверьте право заявителя и участников.", "Проверьте районный суд и территориальную подсудность.", "Соберите законно полученные доказательства.", combined ? "Проверьте вид, размер и расчёт алиментов отдельно." : "Проверьте просительную часть и приложения.", "После вступления решения в законную силу используйте его для регистрации установления отцовства в ЗАГС; сведения переносятся в форму № 18.", "Перед подачей проверьте черновик у юриста."], issues.length ? "" : buildCourtDraft(values, title));
}

function validateCourt(values: PaternityEstablishmentValues) { const issues: PaternityEstablishmentIssue[] = []; if (!RUSSIAN_REGIONS.some((region) => region.id === values.courtRegion)) issues.push({ field: "courtRegion", message: "Выберите регион из справочника." }); if (values.courtConfirmed !== "yes") issues.push({ field: "courtConfirmed", message: "Подтвердите суд и подсудность на официальном ресурсе." }); if (!isOfficialCourtUrl(values.courtSource)) issues.push({ field: "courtSource", message: "Укажите официальную страницу суда." }); return issues; }
function isOfficialCourtUrl(value: string | undefined) { try { const host = new URL(value ?? "").hostname.toLowerCase(); return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru"); } catch { return false; } }
function displayValue(field: PaternityEstablishmentField, value: string) { if (field.name === "courtRegion") return RUSSIAN_REGIONS.find((region) => region.id === value)?.label ?? value; return field.options?.find((option) => option.value === value)?.label ?? value; }
function checklist(outcomeKey: string, title: string, notice: string, preparedData: PaternityEstablishmentDecision["preparedData"], path: PaternityEstablishmentLegalPath) { return base(outcomeKey, path, "checklist", "Персональный чек-лист", title, true, [], preparedData, [notice], [notice, "Получите актуальный документ о рождении.", "После проверки выберите надлежащий маршрут."], ""); }
function review(outcomeKey: string, title: string, notice: string, preparedData: PaternityEstablishmentDecision["preparedData"], path: PaternityEstablishmentLegalPath) { return base(outcomeKey, path, "legalReviewOnly", "Требуется другой путь или юридическая проверка", title, true, [], preparedData, [notice], [notice, "Не используйте заявление или судебный черновик до определения надлежащего способа защиты."], ""); }
function base(outcomeKey: string, legalPath: PaternityEstablishmentLegalPath, resultKind: PaternityEstablishmentDecision["resultKind"], resultLabel: string, documentTitle: string, requiresLegalReview: boolean, issues: PaternityEstablishmentIssue[], preparedData: PaternityEstablishmentDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): PaternityEstablishmentDecision { return { allowed: issues.length === 0 && resultKind !== "legalReviewOnly", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview, pdfAvailable: true, issues, notices, preparedData, filingSteps, draftText: issues.length ? "" : draftText }; }
function buildCourtDraft(values: PaternityEstablishmentValues, title: string) { return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? "[суд требует проверки]"}`, title, `Заявитель: ${values.applicantData ?? ""}`, values.respondentData ? `Ответчик: ${values.respondentData}` : "", values.motherData ? `Мать: ${values.motherData}` : "", values.fatherData ? `Предполагаемый отец: ${values.fatherData}` : "", `Ребёнок: ${values.childData ?? ""}`, values.deceasedData ? `Умерший: ${values.deceasedData}` : "", values.legalPurpose ? `Юридическая цель: ${values.legalPurpose}` : "", `Обстоятельства и доказательства: ${values.evidence ?? ""}`, values.additionalDetails ? `Дополнительное требование: ${values.additionalDetails}` : "", "", "Просительная часть, вид производства, подсудность, участники, доказательства и приложения требуют юридической проверки."].filter(Boolean).join("\n"); }
