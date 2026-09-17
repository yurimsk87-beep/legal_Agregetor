import { SURROGACY_ORIGIN_SCENARIOS, type SurrogacyOriginKey } from "@/data/surrogacy-origin-route";

export type SurrogacyOriginValues = Record<string, string | undefined>;
export type SurrogacyOriginDecision = {
  outcomeKey: string; allowed: boolean; resultKind: "checklist" | "legalReviewOnly";
  resultLabel: string; documentTitle: string; filingReady: false;
  requiresLegalReview: true; pdfAvailable: boolean;
  issues: { field: string; message: string }[];
  preparedData: { label: string; value: string }[];
  evidence: string[]; nextSteps: string[]; notices: string[];
};

export function validateSurrogacyOrigin(key: SurrogacyOriginKey, values: SurrogacyOriginValues): SurrogacyOriginDecision {
  const scenario = SURROGACY_ORIGIN_SCENARIOS[key];
  const issues = scenario.questions.filter((field) => !values[field.name]?.trim())
    .map((field) => ({ field: field.name, message: `Ответьте на вопрос «${field.label}».` }));
  const preparedData = scenario.questions.filter((field) => values[field.name]?.trim())
    .map((field) => ({ label: field.label, value: field.options?.find((option) => option.value === values[field.name])?.label ?? values[field.name]!.trim() }));
  const notices: string[] = ["Лист подготовленных данных не является заявлением, медицинским согласием или судебным документом."];
  if (key === "registration" && values.surrogateConsent !== "yes") notices.push("Согласие суррогатной матери на запись родителей не подтверждено. Не считайте комплект готовым для ЗАГС.");
  if (key === "consents") notices.push("Согласие на медицинское вмешательство и согласие на запись родителей имеют разные цели; не заменяйте одно другим.");
  if (key === "origin" && values.statusChange !== "no") notices.push("Изменение брака или гражданства после договора требует отдельной проверки по пунктам 5–6 статьи 51 СК РФ.");
  if (key === "dispute" && values.childSafety !== "no") notices.push("При угрозе жизни или здоровью ребёнка сначала обращайтесь за срочной помощью. Этот лист не заменяет экстренное обращение.");
  if (key === "foreign") notices.push("Применимое право, гражданство ребёнка, признание иностранных документов и компетентный орган автоматически не определяются.");
  if (issues.length) notices.push("Ответьте на все вопросы до подготовки персонального листа.");
  const emergency = key === "dispute" && values.childSafety === "yes";
  const isForeignOrDispute = key === "foreign" || key === "dispute";
  return {
    outcomeKey: issues.length ? `${key}-missing-data` : emergency ? "urgent-child-safety" : `${key}-${isForeignOrDispute ? "review" : "checklist"}`,
    allowed: !issues.length && !emergency,
    resultKind: isForeignOrDispute ? "legalReviewOnly" : "checklist",
    resultLabel: emergency ? "Сначала защитите ребёнка" : isForeignOrDispute ? "Юридическая проверка обязательна" : "Лист подготовленных данных — требуется юридическая проверка",
    documentTitle: `Суррогатное материнство: ${scenario.title.toLowerCase()}`,
    filingReady: false, requiresLegalReview: true, pdfAvailable: !issues.length && !emergency,
    issues, preparedData, evidence: scenario.evidence,
    nextSteps: emergency ? ["Немедленно вызовите экстренные службы по номеру 112, если угроза существует сейчас.", "После обеспечения безопасности сохраните документы и обсудите правовые действия с юристом."] : scenario.nextSteps,
    notices
  };
}
