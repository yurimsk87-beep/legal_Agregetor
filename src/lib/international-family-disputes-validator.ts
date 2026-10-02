import { INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS, type InternationalFamilyDisputesKey } from "@/data/international-family-disputes-route";

export type InternationalFamilyDisputesValues = Record<string, string | undefined>;
export type InternationalFamilyDisputesDecision = {
  outcomeKey: string; allowed: boolean; resultKind: "legalReviewOnly"; resultLabel: string;
  documentTitle: string; filingReady: false; requiresLegalReview: true; pdfAvailable: boolean;
  issues: { field: string; message: string }[]; preparedData: { label: string; value: string }[];
  evidence: string[]; nextSteps: string[]; notices: string[];
};

export function validateInternationalFamilyDisputes(key: InternationalFamilyDisputesKey, values: InternationalFamilyDisputesValues): InternationalFamilyDisputesDecision {
  const scenario = INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[key];
  const issues = scenario.questions.filter((field) => !values[field.name]?.trim())
    .map((field) => ({ field: field.name, message: `Ответьте на вопрос «${field.label}».` }));
  const preparedData = scenario.questions.filter((field) => values[field.name]?.trim())
    .map((field) => ({ label: field.label, value: field.options?.find((option) => option.value === values[field.name])?.label ?? values[field.name]!.trim() }));
  const emergency = key === "child" && values.childSafety === "yes";
  const notices = [
    "Лист не является иском, ходатайством, заявлением в центральный орган или официальной формой.",
    "Сервис не определяет применимое право, компетентный суд и действие международного договора.",
    "Участие государств в договоре и принятие присоединения проверяются для конкретной пары государств и даты."
  ];
  if (values.treatyKnown !== "yes") notices.push("Действие международного договора не подтверждено. До проверки нельзя выбирать процедуру на его основании.");
  if (values.foreignDecision === "yes") notices.push("Иностранное решение не считается автоматически признанным или исполнимым в России.");
  if (key === "recognition" && (values.effective !== "yes" || values.notice !== "yes")) notices.push("Вступление решения в силу или надлежащее извещение стороны не подтверждено.");
  if (issues.length) notices.push("Заполните все обязательные факты до подготовки персонального листа.");
  return {
    outcomeKey: issues.length ? `${key}-missing-data` : emergency ? "urgent-child-safety-abroad" : `${key}-international-review`,
    allowed: !issues.length && !emergency,
    resultKind: "legalReviewOnly",
    resultLabel: emergency ? "Сначала защитите ребёнка" : "Международная юридическая проверка обязательна",
    documentTitle: `Международный семейный спор: ${scenario.title.toLowerCase()}`,
    filingReady: false, requiresLegalReview: true, pdfAvailable: !issues.length && !emergency,
    issues, preparedData, evidence: scenario.evidence,
    nextSteps: emergency
      ? ["Если ребёнок в России и угроза существует сейчас, позвоните 112.", "Если ребёнок за рубежом, немедленно обратитесь в местную экстренную службу и компетентный орган по месту нахождения ребёнка.", "После обеспечения безопасности сохраните документы и получите международную юридическую помощь."]
      : scenario.nextSteps,
    notices
  };
}
