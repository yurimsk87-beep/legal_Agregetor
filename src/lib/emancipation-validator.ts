import { findGuardianshipTerritory, TERRITORY_NOT_FOUND_ID } from "@/data/guardianship-territories";
import { EMANCIPATION_SCENARIOS, type EmancipationKey } from "@/data/emancipation-route";
export type EmancipationValues = Record<string, string | undefined>;
export type EmancipationDecision = { outcomeKey: string; allowed: boolean; resultKind: "checklist" | "dataSheet" | "courtDraft"; resultLabel: string; documentTitle: string; filingReady: boolean; requiresLegalReview: boolean; pdfAvailable: boolean; issues: { field: string; message: string }[]; preparedData: { label: string; value: string }[]; evidence: string[]; nextSteps: string[]; notices: string[]; draftText: string };

export function validateEmancipation(key: EmancipationKey, rawValues: EmancipationValues): EmancipationDecision {
  const scenario = EMANCIPATION_SCENARIOS[key];
  const territory = findGuardianshipTerritory(rawValues.region, rawValues.municipality, rawValues.authorityName);
  const values = key === "guardianship" ? { ...rawValues, region: territory.region?.label, municipality: territory.municipality?.name, authorityName: territory.authority?.name } : rawValues;
  const issues = scenario.questions.filter((field) => !rawValues[field.name]?.trim()).map((field) => ({ field: field.name, message: `Ответьте на вопрос «${field.label}».` }));
  const tooYoung = rawValues.age === "under16"; const adult = rawValues.age === "adult"; const noBasis = rawValues.workBasis === "none" || rawValues.workBasis === "unsure";
  if ((key === "eligibility" || key === "guardianship" || key === "court") && tooYoung) issues.push({ field: "age", message: "Статья 27 ГК РФ применяется только с 16 лет." });
  if ((key === "eligibility" || key === "guardianship" || key === "court") && adult) issues.push({ field: "age", message: "Для совершеннолетнего эмансипация не требуется." });
  if ((key === "eligibility" || key === "guardianship" || key === "court") && noBasis) issues.push({ field: "workBasis", message: "Не подтверждено основание занятости из статьи 27 ГК РФ." });
  if (key === "guardianship" && rawValues.consent !== "all") issues.push({ field: "consent", message: "Без необходимого согласия административный путь не подтверждён; проверьте судебный порядок." });
  if (key === "guardianship" && (rawValues.municipality === TERRITORY_NOT_FOUND_ID || rawValues.authorityName === TERRITORY_NOT_FOUND_ID || !territory.authority)) issues.push({ field: "authorityName", message: "Подтверждённый орган опеки не выбран." });
  if (key === "court" && rawValues.consent !== "missing") issues.push({ field: "consent", message: "Судебный путь в маршруте используется при отсутствии необходимого согласия." });
  if (key === "consequences" && rawValues.decisionBasis === "none") issues.push({ field: "decisionBasis", message: "До решения органа опеки или вступившего в силу решения суда полной дееспособности по этому маршруту нет." });
  const preparedData = scenario.questions.filter((field) => values[field.name]?.trim()).map((field) => ({ label: field.label, value: field.options?.find((option) => option.value === rawValues[field.name])?.label ?? values[field.name]!.trim() }));
  const blocked = issues.length > 0; const requiresLegalReview = key === "guardianship" || key === "court";
  const title = key === "eligibility" ? "Чек-лист условий эмансипации" : key === "guardianship" ? "Лист сведений для обращения по вопросу эмансипации" : key === "court" ? "ЧЕРНОВИК — заявление об объявлении несовершеннолетнего полностью дееспособным" : "Чек-лист после решения об эмансипации";
  return { outcomeKey: blocked ? `${key}-blocked` : `${key}-${rawValues.workBasis ?? rawValues.decisionBasis ?? "ready"}`, allowed: !blocked, resultKind: key === "court" ? "courtDraft" : key === "guardianship" ? "dataSheet" : "checklist", resultLabel: blocked ? "Условия не подтверждены" : requiresLegalReview ? "Материал требует юридической проверки" : "Чек-лист подготовлен", documentTitle: title, filingReady: false, requiresLegalReview, pdfAvailable: !blocked, issues, preparedData, evidence: scenario.evidence, nextSteps: scenario.nextSteps, notices: ["Возраст 16 лет сам по себе не означает эмансипацию.", key === "guardianship" ? "Единой федеральной формы заявления в маршруте не воспроизводится; проверьте региональный порядок." : key === "court" ? "Это маркированный судебный черновик, а не готовое заявление." : "Результат носит информационный характер."], draftText: blocked ? "" : buildDraft(key, values, title) };
}

function buildDraft(key: EmancipationKey, values: EmancipationValues, title: string) {
  if (key === "eligibility") return `${title}\n\nВозраст: ${values.age}.\nОснование занятости: ${values.workBasis}.\nПодтверждающие сведения: ${values.basisDetails}.\nСогласие: ${values.consent}.\n\nОкончательный статус возникает только после предусмотренного законом решения.`;
  if (key === "guardianship") return `${title}\n\nАдресат: ${values.authorityName}\nНесовершеннолетний: ${values.applicantData}\nОснование занятости: ${values.workBasis}\nПодтверждающие сведения: ${values.basisDetails}\nСогласие законных представителей: подтверждено пользователем.\n\nПеренесите сведения в действующую региональную форму после её проверки.`;
  if (key === "court") return `${title}\n\nЗаявитель: ${values.applicantData}\nОснование занятости: ${values.workBasis}\nПодтверждающие сведения: ${values.basisDetails}\nСведения о согласии: ${values.consentDetails}\nЦель и обстоятельства: ${values.reasons}\n\nПодсудность, содержание просьбы, госпошлина и приложения требуют юридической проверки.`;
  return `${title}\n\nОснование: ${values.decisionBasis}\nРеквизиты решения: ${values.decisionDetails}\nЦель подтверждения дееспособности: ${values.purpose}\n\nСпециальные возрастные ограничения для конкретного действия проверяются отдельно.`;
}
