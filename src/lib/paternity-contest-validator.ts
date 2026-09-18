import { RUSSIAN_REGIONS } from "@/data/guardianship-territories";
import type { PaternityContestLegalPath } from "@/data/paternity-contest-legal-review";
import { PATERNITY_CONTEST_SCENARIOS, type PaternityContestField, type PaternityContestScenarioKey } from "@/data/paternity-contest-route";

export type PaternityContestValues = Record<string, string | undefined>;
export type PaternityContestIssue = { field: string; message: string };
export type PaternityContestDecision = { allowed: boolean; outcomeKey: string; legalPath: PaternityContestLegalPath; resultKind: "courtDraft" | "checklist" | "legalReviewOnly"; resultLabel: string; documentTitle: string; filingReady: false; requiresLegalReview: true; pdfAvailable: boolean; issues: PaternityContestIssue[]; notices: string[]; preparedData: Array<{ label: string; value: string }>; filingSteps: string[]; draftText: string };

export function getVisiblePaternityContestFields(scenarioKey: PaternityContestScenarioKey, values: PaternityContestValues) {
  return PATERNITY_CONTEST_SCENARIOS[scenarioKey].helperFields.filter((field) => {
    if (field.name === "knewAtRegistration") return values.recordTarget === "father" && values.recordBasis === "application";
    if (field.name === "willDefect") return values.recordTarget === "father" && values.recordBasis === "application" && values.knewAtRegistration === "yes";
    return true;
  });
}

export function validatePaternityContest(scenarioKey: PaternityContestScenarioKey, values: PaternityContestValues): PaternityContestDecision {
  const scenario = PATERNITY_CONTEST_SCENARIOS[scenarioKey];
  const fields = getVisiblePaternityContestFields(scenarioKey, values);
  const preparedData = fields.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: displayValue(field, values[field.name] ?? "") }));

  if (values.recordTarget === "unsure") return review("record-target-unclear", "Нужно проверить актовую запись", "Нельзя определить предмет иска, пока не установлено, запись об отце или матери оспаривается.", preparedData, "assessment");
  if (values.recordBasis === "unknown") return review("record-basis-unclear", "Нужно установить основание записи", "Получите полную запись акта о рождении и документы, на основании которых внесены сведения.", preparedData, "assessment");
  if (values.recordBasis === "court") return review("court-record-review", "Запись основана на судебном решении", "Сначала проверьте вступивший в силу судебный акт и надлежащий процессуальный способ защиты. Стандартный черновик нового иска не формируется.", preparedData, "assessment");
  if (["art", "surrogacy"].includes(values.recordBasis ?? "")) return review("special-reproduction-restriction", "Действует специальное ограничение", "Согласия на ВРТ или суррогатное материнство требуют индивидуальной проверки пункта 3 статьи 52 СК РФ. Автоматический черновик не формируется.", preparedData, "special-restriction");
  if (values.dnaExpectation !== "yes") return review("evidence-expectation-unclear", "Нельзя обещать результат экспертизы", "Подтвердите понимание: экспертиза является одним из доказательств, назначается и оценивается судом.", preparedData, "assessment");

  const voluntaryFatherRecord = scenarioKey === "recorded-parent" && values.recordTarget === "father" && values.recordBasis === "application";
  if (voluntaryFatherRecord && values.knewAtRegistration === "unsure") return review("knowledge-unclear", "Нужно установить обстоятельства регистрации", "Знание записанного отца при добровольной записи может ограничить основания требования.", preparedData, "assessment");
  if (voluntaryFatherRecord && values.knewAtRegistration === "yes" && ["none", "other", "unsure"].includes(values.willDefect ?? "")) return review("known-non-parent-restriction", "Основание требования не подтверждено", "Если записанный отец добровольно внёс запись, зная, что не является отцом, одного биологического несовпадения недостаточно. Иное нарушение волеизъявления требует юридической проверки и доказательств.", preparedData, "special-restriction");

  if (scenarioKey === "child-representative" && ["other", "unsure"].includes(values.applicantRole ?? "")) return review("applicant-standing-review", "Право заявителя не подтверждено", "Круг лиц в пункте 1 статьи 52 СК РФ является специальным. Не формируйте иск до проверки статуса.", preparedData, "standing-review");
  if (scenarioKey === "after-death" && ["heir-only", "other"].includes(values.applicantRole ?? "")) return review("deceased-standing-review", "Право заявителя не подтверждено", "Наследник или родственник не получает право оспаривать запись только из-за своего статуса.", preparedData, "standing-review");

  const missing = fields.filter((field) => field.required && !values[field.name]?.trim()).map((field) => ({ field: field.name, message: `Заполните поле «${field.label}».` }));
  if (missing.length) return base("missing-data", "assessment", "legalReviewOnly", "Не хватает обязательных сведений", scenario.mainDocument, missing, preparedData, ["Заполните обязательные поля."], [], "");

  const courtIssues = validateCourt(values);
  const subject = values.recordTarget === "mother" ? "материнства" : "отцовства";
  const titles: Record<PaternityContestScenarioKey, string> = {
    "recorded-parent": `Черновик иска записанного родителя об оспаривании ${subject}`,
    "biological-parent": `Черновик иска биологического родителя об оспаривании записи о ${values.recordTarget === "mother" ? "матери" : "отце"}`,
    "child-representative": `Черновик иска ребёнка или опекуна об оспаривании ${subject}`,
    "after-death": `Черновик иска об оспаривании ${subject} после смерти записанного родителя`
  };
  const title = titles[scenarioKey];
  return base(`${scenarioKey}-${values.recordTarget}-court-draft`, "court", "courtDraft", "ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", title, courtIssues, preparedData, ["Экспертиза не гарантирует результат и оценивается судом вместе с другими доказательствами.", "Исключение записи и его последствия для ребёнка определяет суд."], ["Проверьте право заявителя и надлежащих ответчиков.", "Проверьте районный суд и территориальную подсудность.", "Проверьте основание актовой записи и специальные ограничения.", "Соберите законно полученные доказательства; вопрос об экспертизе разрешает суд.", "Перед подачей проверьте просительную часть, приложения и последствия у юриста.", "После вступления решения в законную силу уточните порядок изменения актовой записи в ЗАГС."], courtIssues.length ? "" : buildCourtDraft(values, title));
}

function validateCourt(values: PaternityContestValues) {
  const issues: PaternityContestIssue[] = [];
  if (!RUSSIAN_REGIONS.some((region) => region.id === values.courtRegion)) issues.push({ field: "courtRegion", message: "Выберите регион из справочника." });
  if (values.courtConfirmed !== "yes") issues.push({ field: "courtConfirmed", message: "Подтвердите суд и подсудность на официальном ресурсе." });
  if (!isOfficialCourtUrl(values.courtSource)) issues.push({ field: "courtSource", message: "Укажите официальную страницу суда." });
  return issues;
}
function isOfficialCourtUrl(value: string | undefined) { try { const host = new URL(value ?? "").hostname.toLowerCase(); return host === "sudrf.ru" || host.endsWith(".sudrf.ru") || host === "mos-gorsud.ru" || host.endsWith(".mos-gorsud.ru"); } catch { return false; } }
function displayValue(field: PaternityContestField, value: string) { if (field.name === "courtRegion") return RUSSIAN_REGIONS.find((region) => region.id === value)?.label ?? value; return field.options?.find((option) => option.value === value)?.label ?? value; }
function review(outcomeKey: string, title: string, notice: string, preparedData: PaternityContestDecision["preparedData"], path: PaternityContestLegalPath) { return base(outcomeKey, path, "legalReviewOnly", "Требуется юридическая проверка", title, [], preparedData, [notice], [notice, "Получите актуальную запись акта о рождении и не используйте судебный черновик до проверки."], ""); }
function base(outcomeKey: string, legalPath: PaternityContestLegalPath, resultKind: PaternityContestDecision["resultKind"], resultLabel: string, documentTitle: string, issues: PaternityContestIssue[], preparedData: PaternityContestDecision["preparedData"], notices: string[], filingSteps: string[], draftText: string): PaternityContestDecision { return { allowed: issues.length === 0 && resultKind !== "legalReviewOnly", outcomeKey, legalPath, resultKind, resultLabel, documentTitle, filingReady: false, requiresLegalReview: true, pdfAvailable: true, issues, notices, preparedData, filingSteps, draftText: issues.length ? "" : draftText }; }
function buildCourtDraft(values: PaternityContestValues, title: string) {
  return ["ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ", "ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА", "", `В ${values.courtName ?? "[суд требует проверки]"}`, title, `Истец: ${values.applicantData ?? ""}`, `Лицо, записанное родителем: ${values.recordedParentData ?? ""}`, `Ребёнок: ${values.childData ?? ""}`, `Другие участники: ${values.otherParticipants ?? ""}`, values.deathData ? `Сведения о смерти: ${values.deathData}` : "", `Основание актовой записи: ${values.recordBasis ?? ""}`, values.knewAtRegistration ? `Знание при регистрации: ${values.knewAtRegistration}` : "", values.willDefect ? `Обстоятельства волеизъявления: ${values.willDefect}` : "", `Обстоятельства требования: ${values.circumstances ?? ""}`, `Доказательства: ${values.evidence ?? ""}`, "", "Надлежащие ответчики, просительная часть, последствия исключения записи, доказательства и приложения требуют юридической проверки."].filter(Boolean).join("\n");
}
