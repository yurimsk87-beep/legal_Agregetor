import { GUARDIANSHIP_ROUTE, GUARDIANSHIP_SCENARIOS, type GuardianshipScenarioKey } from "@/data/guardianship-route";
import { getGuardianshipLegalReviewDate } from "@/data/guardianship-legal-review";
import { documentResultSchema, DOCUMENT_RESULT_CONTRACT_VERSION, type DocumentResultV1 } from "@/lib/document-result-contract";
import { buildGuardianshipPdfText } from "@/lib/guardianship-pdf";
import type { GuardianshipDecision } from "@/lib/guardianship-validator";

/**
 * Adapter for the existing deterministic guardianship validator. It does not
 * decide which legal outcome is allowed: that remains the validator's job.
 * Urgent and unresolved situations MUST NOT acquire a downloadable result.
 */
export function createGuardianshipDocumentResult(input: {
  decision: GuardianshipDecision;
  scenarioKey: GuardianshipScenarioKey;
  draft: string;
  versionId?: string;
  createdAt?: string;
  source?: DocumentResultV1["source"];
}): DocumentResultV1 | null {
  const { decision, scenarioKey, draft } = input;
  if (!decision.pdfAvailable || decision.resultKind === "urgent" || decision.outcomeKey === "unresolved") {
    return null;
  }
  if (decision.resultKind === "draft" && !draft.trim()) {
    throw new Error("Нельзя сохранить пустой черновик заявления.");
  }
  const kind: Record<Exclude<GuardianshipDecision["resultKind"], "urgent">, DocumentResultV1["resultKind"]> = {
    "draft": "DRAFT",
    "checklist": "CHECKLIST",
    "data-sheet": "PREPARED_DATA"
  };
  return documentResultSchema.parse({
    contractVersion: DOCUMENT_RESULT_CONTRACT_VERSION,
    versionId: input.versionId ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    categorySlug: GUARDIANSHIP_ROUTE.categorySlug,
    routeSlug: GUARDIANSHIP_ROUTE.problemSlug,
    scenarioKey,
    documentSlug: GUARDIANSHIP_SCENARIOS[scenarioKey].documentSlug,
    resultKind: kind[decision.resultKind],
    source: input.source ?? "DETERMINISTIC",
    documentTitle: decision.documentTitle,
    documentText: buildGuardianshipPdfText(decision, draft),
    usedRuleIds: [],
    placeholders: [],
    legalRegistryReviewedAt: getGuardianshipLegalReviewDate(scenarioKey),
    generatorVersion: "guardianship-v1",
    // The existing validator controls the permitted OUTCOME. A draft is never
    // upgraded to filing-ready merely by serializing it into our common contract.
    filingReady: false,
    requiresLegalReview: decision.requiresLegalReview || decision.issues.length > 0
  });
}
