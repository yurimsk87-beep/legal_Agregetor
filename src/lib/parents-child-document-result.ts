import { PARENTS_CHILD_REVIEWED_AT } from "@/data/parents-child-legal-review";
import { PARENTS_CHILD_ROUTE, PARENTS_CHILD_SCENARIOS, type ParentsChildScenarioKey } from "@/data/parents-child-route";
import { documentResultSchema, DOCUMENT_RESULT_CONTRACT_VERSION, type DocumentResultV1 } from "@/lib/document-result-contract";
import { buildParentsChildPdfText } from "@/lib/parents-child-pdf";
import type { ParentsChildDecision } from "@/lib/parents-child-validator";

/**
 * Compatible envelope for the existing family law decision engine. Absence of
 * a generated draft never magically becomes a filing-ready court statement.
 */
export function createParentsChildDocumentResult(input: {
  scenarioKey: ParentsChildScenarioKey;
  decision: ParentsChildDecision;
  draft: string;
  source?: DocumentResultV1["source"];
  versionId?: string;
  createdAt?: string;
}): DocumentResultV1 | null {
  const { scenarioKey, decision, draft } = input;
  if (!decision.pdfAvailable || decision.resultKind === "urgent") return null;

  const resultKind: DocumentResultV1["resultKind"] =
    decision.resultKind === "checklist" ? "CHECKLIST"
      : !draft.trim() ? "PREPARED_DATA"
        : decision.resultKind === "agreement" ? "AGREEMENT_DRAFT" : "DRAFT";

  return documentResultSchema.parse({
    contractVersion: DOCUMENT_RESULT_CONTRACT_VERSION,
    versionId: input.versionId ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    categorySlug: PARENTS_CHILD_ROUTE.categorySlug,
    routeSlug: PARENTS_CHILD_ROUTE.problemSlug,
    scenarioKey,
    documentSlug: PARENTS_CHILD_SCENARIOS[scenarioKey].documentSlug,
    resultKind,
    source: input.source ?? "DETERMINISTIC",
    documentTitle: decision.documentTitle,
    documentText: buildParentsChildPdfText({ ...decision, filingReady: false, draftText: draft }),
    usedRuleIds: [],
    placeholders: [],
    legalRegistryReviewedAt: PARENTS_CHILD_REVIEWED_AT,
    generatorVersion: "parents-child-v1",
    filingReady: false,
    requiresLegalReview: decision.requiresLegalReview || decision.issues.length > 0 || Boolean(draft)
  });
}
