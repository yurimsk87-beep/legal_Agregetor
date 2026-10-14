import { documentResultSchema, DOCUMENT_RESULT_CONTRACT_VERSION, type DocumentResultV1 } from "@/lib/document-result-contract";

/**
 * Read-only compatibility envelope for old rule-based family generators.
 * It never overrides or invents the legal outcome. An unavailable PDF,
 * emergency or unresolved case MUST NOT produce a document version.
 */
export type LegacyFamilyOutcome = {
  documentTitle: string;
  resultKind: string;
  outcomeKey?: string;
  resultLabel?: string;
  pdfAvailable?: boolean;
  requiresLegalReview?: boolean;
  issues?: readonly unknown[];
  notices?: readonly string[];
  preparedData?: readonly { label: string; value: string }[];
  filingSteps?: readonly string[];
};

export function createLegacyFamilyDocumentResult(input: {
  routeSlug: string;
  scenarioKey: string;
  documentSlug: string;
  reviewedAt: string;
  decision: LegacyFamilyOutcome;
  draft: string;
  source: DocumentResultV1["source"];
  versionId?: string;
}): DocumentResultV1 | null {
  const { decision, draft } = input;
  // Fail closed: only an explicitly permitted PDF result can be versioned.
  // Undefined must not be treated as permission in legacy validators.
  if (decision.pdfAvailable !== true ||
      decision.resultKind === "urgent" ||
      decision.outcomeKey === "unresolved") return null;

  const resultKind: DocumentResultV1["resultKind"] =
    decision.resultKind === "legalReviewOnly" ? "LEGAL_REVIEW_ONLY" :
    decision.resultKind === "checklist" ? "CHECKLIST" :
    decision.resultKind === "dataSheet" || decision.resultKind === "data-sheet" || decision.resultKind === "prepared-data" ? "PREPARED_DATA" :
    decision.resultKind === "official-form" ? "OFFICIAL_FORM" :
    !draft.trim() ? "PREPARED_DATA" :
    ["agreement", "agreementDraft"].includes(decision.resultKind) ? "AGREEMENT_DRAFT" :
    decision.resultKind === "enforcement" ? "ENFORCEMENT_DRAFT" : "DRAFT";

  const text = [
    decision.resultLabel || "Подготовленный результат",
    decision.documentTitle,
    "Не является автоматически готовым к подаче.",
    ...(decision.notices ?? []),
    ...((decision.issues ?? []).length ? ["Перед использованием уточните нерешённые вопросы."] : []),
    "Подготовленные сведения:",
    ...(decision.preparedData ?? []).map((item) => `${item.label}: ${item.value}`),
    "Дальнейшие действия:",
    ...(decision.filingSteps ?? []).map((step, index) => `${index + 1}. ${step}`),
    ...(draft ? ["Текст проекта:", draft] : [])
  ].join("\n");

  return documentResultSchema.parse({
    contractVersion: DOCUMENT_RESULT_CONTRACT_VERSION,
    versionId: input.versionId ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    categorySlug: "semya-i-deti",
    routeSlug: input.routeSlug,
    scenarioKey: input.scenarioKey,
    documentSlug: input.documentSlug,
    resultKind,
    source: input.source,
    documentTitle: decision.documentTitle,
    documentText: text,
    usedRuleIds: [],
    placeholders: [],
    legalRegistryReviewedAt: input.reviewedAt,
    generatorVersion: "legacy-family-adapter-v1",
    filingReady: false,
    requiresLegalReview: Boolean(decision.requiresLegalReview || (decision.issues ?? []).length || draft.trim())
  });
}
