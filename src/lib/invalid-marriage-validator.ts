import { INVALID_MARRIAGE_SCENARIOS, type InvalidMarriageField, type InvalidMarriageScenarioKey } from "@/data/invalid-marriage-route";
export type InvalidMarriageValues = Record<string, string | undefined>;
export type InvalidMarriageDecision = { allowed: boolean; outcomeKey: string; resultKind: "courtDraft" | "legalReviewOnly"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: true; pdfAvailable: true; issues: Array<{ field: string; message: string }>; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };
export function getVisibleInvalidMarriageFields(scenarioKey: InvalidMarriageScenarioKey, values: InvalidMarriageValues) {
  return INVALID_MARRIAGE_SCENARIOS[scenarioKey].helperFields.filter((field) => {
    if (scenarioKey === "underage" && field.name === "minorConsent") return values.nowAdult !== "yes";
    if (field.name === "circumstancesRemoved") return scenarioKey === "obstacle";
    return true;
  });
}
export function validateInvalidMarriage(scenarioKey: InvalidMarriageScenarioKey, values: InvalidMarriageValues): InvalidMarriageDecision {
  const scenario = INVALID_MARRIAGE_SCENARIOS[scenarioKey];
  const fields = getVisibleInvalidMarriageFields(scenarioKey, values);
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: display(field, values[field.name] ?? "") }));
  const missing = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, missing, preparedData, ["Документ не формируется без критических данных."], ["Заполните обязательные поля."], "");
  if (values.international !== "no") return review("international-review", "Требуется проверка международного элемента", "Иностранные документы, гражданство или регистрация брака за пределами РФ требуют отдельной коллизионной проверки.", preparedData);
  const groundCheck = checkGround(scenarioKey, values);
  if (groundCheck) return review(groundCheck.key, groundCheck.title, groundCheck.notice, preparedData);
  if (!isEligibleApplicant(scenarioKey, values)) return review("applicant-not-confirmed", "Право заявителя не подтверждено", "Статья 28 СК РФ устанавливает разный круг заявителей для каждого основания.", preparedData);
  if (values.marriageEnded === "unsure") return review("marriage-status-unclear", "Статус брака не подтверждён", "Нужно подтвердить, расторгнут ли брак до обращения в суд.", preparedData);
  if (values.marriageEnded === "yes" && !postDivorceException(scenarioKey, values)) return review("already-divorced", "Брак уже расторгнут", "После расторжения брак обычно нельзя признать недействительным; закон сохраняет только прямо указанные исключения.", preparedData);
  if (scenarioKey === "obstacle" && values.circumstancesRemoved !== "no") return review("validation-risk", "Нужно проверить обстоятельства, устраняющие недействительность", "Суд может признать брак действительным, если препятствовавшие обстоятельства отпали.", preparedData);
  if (scenarioKey === "fictitious" && values.familyCreated !== "no") return review("family-created-review", "Нужно проверить фактическое создание семьи", "Брак нельзя признать фиктивным, если до рассмотрения дела супруги фактически создали семью.", preparedData);
  if (values.courtConfirmed !== "yes" || !officialCourt(values.courtSource)) return review("court-not-confirmed", "Суд не подтверждён", "Проверьте районный суд на официальном ресурсе судебной системы.", preparedData);
  const title = scenario.mainDocument;
  const notices = ["Основание, право заявителя, срок, подсудность и последствия проверяются юристом до подачи."];
  if (values.propertyConsequences !== "no" || values.prenuptialAgreement !== "no") notices.push("Имущественные последствия и судьба брачного договора требуют отдельных формулировок требований.");
  if (values.children === "yes") notices.push("Признание брака недействительным не умаляет права детей, указанных в статье 30 СК РФ.");
  return base(`${scenarioKey}-court-draft`, "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, [], preparedData, notices, ["Передайте черновик и доказательства юристу.", "Проверьте основание, право заявителя, срок и последствия.", "Проверьте суд, госпошлину и состав приложений.", "Подавайте иск только после завершения проверки."], draft(values, title));
}
function checkGround(scenarioKey: InvalidMarriageScenarioKey, values: InvalidMarriageValues) {
  if (scenarioKey === "consent" && values.consentDefect === "other") return { key: "consent-ground-unclear", title: "Основание отсутствия согласия не определено", notice: "Перечень оснований нельзя расширять предположением." };
  if (scenarioKey === "underage") {
    const age = Number(values.ageAtMarriage);
    if (!Number.isInteger(age) || age < 0 || age >= 18) return { key: "age-not-confirmed", title: "Нарушение брачного возраста не подтверждено", notice: "Укажите подтверждённый возраст на дату регистрации брака." };
    if (values.permission !== "no") return { key: "permission-review", title: "Отсутствие разрешения не подтверждено", notice: "Основание требует проверки разрешения и применимого регионального порядка." };
    if (values.nowAdult === "unsure" || (values.nowAdult === "no" && values.minorConsent === "unsure")) return { key: "minor-status-review", title: "Статус несовершеннолетнего требует проверки", notice: "Возраст на дату обращения, интересы и позиция несовершеннолетнего влияют на путь." };
    if (values.nowAdult === "no" && values.minorConsent === "no") return { key: "minor-opposes", title: "Несовершеннолетний не согласен", notice: "Суд может отказать, если признание не отвечает интересам несовершеннолетнего или отсутствует его согласие." };
  }
  if (scenarioKey === "obstacle" && values.obstacleKind === "other") return { key: "obstacle-unclear", title: "Препятствие не относится к подтверждённому перечню", notice: "Использовать можно только препятствия, прямо указанные в статье 14 СК РФ." };
  if (scenarioKey === "fictitious" && values.noFamilyIntent === "unsure") return { key: "intent-unclear", title: "Отсутствие намерения создать семью не подтверждено", notice: "Фиктивность оценивается судом по обстоятельствам на момент регистрации и последующему поведению." };
  if (scenarioKey === "concealed-health" && !["hiv", "venereal"].includes(values.condition ?? "")) return { key: "condition-not-covered", title: "Заболевание не относится к выбранному основанию", notice: "Пункт 3 статьи 15 СК РФ прямо называет только ВИЧ-инфекцию и венерическую болезнь." };
  if (scenarioKey === "concealed-health" && values.concealedAtMarriage !== "yes") return { key: "concealment-not-confirmed", title: "Сокрытие при заключении брака не подтверждено", notice: "Для выбранного основания нужно подтвердить именно сокрытие заболевания при заключении брака." };
  return null;
}
function isEligibleApplicant(scenarioKey: InvalidMarriageScenarioKey, values: InvalidMarriageValues) {
  const role = values.applicantRole;
  if (scenarioKey === "consent") return role === "injured-spouse" || role === "prosecutor";
  if (scenarioKey === "underage") return values.nowAdult === "yes" ? role === "minor-spouse" : ["minor-spouse", "parent", "guardianship", "prosecutor"].includes(role ?? "");
  if (scenarioKey === "obstacle") {
    if (role === "guardian") return values.obstacleKind === "incapacity";
    if (role === "previous-spouse") return values.obstacleKind === "prior-marriage";
    return ["unaware-spouse", "affected-person", "guardianship", "prosecutor"].includes(role ?? "");
  }
  if (scenarioKey === "fictitious") return role === "unaware-spouse" || role === "prosecutor";
  return role === "injured-spouse";
}
function postDivorceException(scenarioKey: InvalidMarriageScenarioKey, values: InvalidMarriageValues) { return scenarioKey === "obstacle" && (values.obstacleKind === "prior-marriage" || values.obstacleKind === "close-kinship"); }
function display(field: InvalidMarriageField, value: string) { return field.options?.find((option) => option.value === value)?.label ?? value; }
function officialCourt(value?: string) { try { const host = new URL(value ?? "").hostname.toLowerCase(); return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru"); } catch { return false; } }
function review(outcomeKey: string, title: string, notice: string, data: InvalidMarriageDecision["preparedData"]) { return base(outcomeKey, "legalReviewOnly", "Требуется юридическая проверка", title, [], data, [notice], [notice, "Не используйте результат как готовый судебный документ."], ""); }
function base(outcomeKey: string, resultKind: InvalidMarriageDecision["resultKind"], resultLabel: string, documentTitle: string, issues: InvalidMarriageDecision["issues"], preparedData: InvalidMarriageDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): InvalidMarriageDecision { return { allowed: !issues.length && resultKind === "courtDraft", outcomeKey, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview: true, pdfAvailable: true, issues, notices, preparedData, filingSteps, draftText }; }
function draft(values: InvalidMarriageValues, title: string) { return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? ""}`, "", title.toUpperCase(), "", `Истец: ${values.applicant ?? ""}`, `Ответчик: ${values.defendant ?? ""}`, `Сведения о регистрации брака: ${values.marriageRecord ?? ""}`, `Обстоятельства: ${values.registrationFacts ?? ""}`, `Доказательства: ${values.evidence ?? ""}`, "", "Предполагаемое требование: признать зарегистрированный брак недействительным.", "Точное основание, дополнительные требования, последствия и приложения определяются после юридической проверки."].join("\n"); }
