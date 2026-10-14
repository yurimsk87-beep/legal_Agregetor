import { z } from "zod";
import type { LaborDocumentResponse } from "@/lib/labor-document-contract";
import type { FamilyAdditiveDecision } from "@/lib/family-additive-validator";

/**
 * Shared result envelope across generators. Not a database record or proof of filing readiness.
 * Contains the CURRENT version's text; never persist it or put it into an SEO URL.
 */
export const DOCUMENT_RESULT_CONTRACT_VERSION = "DOCUMENT_RESULT_V1" as const;

export const documentResultSchema = z.object({
  contractVersion: z.literal(DOCUMENT_RESULT_CONTRACT_VERSION),
  versionId: z.string().uuid(),
  createdAt: z.string().datetime(),
  categorySlug: z.string().min(1).max(80),
  routeSlug: z.string().min(1).max(160),
  scenarioKey: z.string().min(1).max(160),
  documentSlug: z.string().min(1).max(180),
  resultKind: z.enum([
    "DRAFT", "AGREEMENT_DRAFT", "ENFORCEMENT_DRAFT", "OFFICIAL_FORM",
    "PREPARED_DATA", "CHECKLIST", "URGENT_INSTRUCTION", "LEGAL_REVIEW_ONLY"
  ]),
  source: z.enum(["AI_DRAFT", "DETERMINISTIC", "USER_EDITED"]),
  documentTitle: z.string().trim().min(1).max(300),
  documentText: z.string().min(1).max(40000),
  usedRuleIds: z.array(z.string().min(1).max(120)).max(50),
  placeholders: z.array(z.string().min(1).max(300)).max(40),
  legalRegistryReviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatorVersion: z.string().min(1).max(40),
  filingReady: z.literal(false),
  requiresLegalReview: z.boolean()
}).strict();

export type DocumentResultV1 = z.infer<typeof documentResultSchema>;

const familyKindMap: Record<FamilyAdditiveDecision["resultKind"], DocumentResultV1["resultKind"]> = {
  checklist: "CHECKLIST",
  agreementDraft: "AGREEMENT_DRAFT",
  courtDraft: "DRAFT",
  enforcementDraft: "ENFORCEMENT_DRAFT",
  officialForm: "OFFICIAL_FORM",
  preparedData: "PREPARED_DATA",
  legalReviewOnly: "LEGAL_REVIEW_ONLY"
};

export function createLaborDocumentResult(input: {
  routeSlug: string;
  scenarioKey: string;
  documentSlug: string;
  result: LaborDocumentResponse;
  createdAt?: string;
}): DocumentResultV1 {
  const result = input.result;
  return documentResultSchema.parse({
    contractVersion: DOCUMENT_RESULT_CONTRACT_VERSION,
    versionId: result.versionId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    categorySlug: "trudovoe-pravo",
    routeSlug: input.routeSlug,
    scenarioKey: input.scenarioKey,
    documentSlug: input.documentSlug,
    resultKind: "DRAFT",
    source: "AI_DRAFT",
    documentTitle: result.documentTitle,
    documentText: result.draftText,
    usedRuleIds: result.usedRuleIds,
    placeholders: result.placeholders,
    legalRegistryReviewedAt: result.legalRegistryReviewedAt,
    generatorVersion: result.generatorVersion,
    filingReady: false,
    requiresLegalReview: true
  });
}

export function createFamilyAdditiveDocumentResult(input: {
  decision: FamilyAdditiveDecision;
  documentSlug: string;
  documentText: string;
  legalReviewedAt: string;
  versionId?: string;
  createdAt?: string;
}): DocumentResultV1 {
  const { decision } = input;
  if (!input.documentText.trim()) throw new Error("Cannot create empty document result");
  return documentResultSchema.parse({
    contractVersion: DOCUMENT_RESULT_CONTRACT_VERSION,
    versionId: input.versionId ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    categorySlug: "semya-i-deti",
    routeSlug: decision.routeSlug,
    scenarioKey: decision.scenarioKey,
    documentSlug: input.documentSlug,
    resultKind: familyKindMap[decision.resultKind],
    source: "DETERMINISTIC",
    documentTitle: decision.documentTitle,
    documentText: input.documentText,
    usedRuleIds: [],
    placeholders: [],
    legalRegistryReviewedAt: input.legalReviewedAt,
    generatorVersion: "family-additive-1",
    filingReady: false,
    requiresLegalReview: decision.requiresLegalReview
  });
}

export function createFamilyAIDraftDocumentResult(input: {
  routeSlug: string;
  scenarioKey: string;
  documentSlug: string;
  documentTitle: string;
  documentText: string;
  usedRuleIds: string[];
  placeholders: string[];
  legalReviewedAt: string;
  versionId?: string;
  createdAt?: string;
}): DocumentResultV1 {
  return documentResultSchema.parse({
    contractVersion: DOCUMENT_RESULT_CONTRACT_VERSION,
    versionId: input.versionId ?? crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    categorySlug: "semya-i-deti",
    routeSlug: input.routeSlug,
    scenarioKey: input.scenarioKey,
    documentSlug: input.documentSlug,
    resultKind: "DRAFT",
    source: "AI_DRAFT",
    documentTitle: input.documentTitle,
    documentText: input.documentText,
    usedRuleIds: input.usedRuleIds,
    placeholders: input.placeholders,
    legalRegistryReviewedAt: input.legalReviewedAt,
    generatorVersion: "family-ai-1",
    filingReady: false,
    requiresLegalReview: true
  });
}

/** Metadata only — never copy draft text, input facts, API keys, or contact details. */
export function documentResultReviewMetadata(result: DocumentResultV1) {
  return {
    contractVersion: result.contractVersion,
    route: result.routeSlug,
    scenarioId: result.scenarioKey,
    scenarioKey: result.scenarioKey,
    documentSlug: result.documentSlug,
    documentVersionId: result.versionId,
    generatorVersion: result.generatorVersion,
    legalRegistryReviewedAt: result.legalRegistryReviewedAt,
    resultKind: result.resultKind,
    filingReady: result.filingReady,
    requiresLegalReview: result.requiresLegalReview
  };
}
