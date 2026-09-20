import { z } from "zod";

export const GENERATIVE_RESULT_TYPES = [
  "applicationDraft",
  "agreement",
  "agreementDraft",
  "complaintDraft",
  "courtDraft",
  "draft",
  "motionDraft",
  "otherDraft"
] as const;

export const legalDraftRuleSchema = z.object({
  id: z.string().trim().min(1).max(120),
  norm: z.string().trim().min(1).max(500),
  url: z.string().url().max(1000),
  statement: z.string().trim().max(1500).optional(),
  scope: z.string().trim().max(1500).optional(),
  limitations: z.string().trim().max(1500).optional()
});

export const legalDraftRequestSchema = z.object({
  route: z.string().trim().min(1).max(160),
  scenario: z.string().trim().min(1).max(160),
  documentType: z.string().trim().min(1).max(240),
  documentTitle: z.string().trim().min(1).max(300),
  verifiedFacts: z.record(z.string().trim().max(4000)).refine((value) => Object.keys(value).length <= 80, "Слишком много полей"),
  allowedLegalRules: z.array(legalDraftRuleSchema).max(30),
  missingFacts: z.array(z.string().trim().min(1).max(300)).max(40),
  filingReady: z.boolean(),
  requiresLegalReview: z.boolean(),
  safetyFlags: z.array(z.string().trim().min(1).max(240)).max(30),
  allowedResultType: z.enum(GENERATIVE_RESULT_TYPES)
});

export const legalDraftModelResponseSchema = z.object({
  documentTitle: z.string().trim().min(1).max(300),
  draftText: z.string().trim().min(120).max(30000),
  usedRuleIds: z.array(z.string().trim().min(1).max(120)).max(30),
  placeholders: z.array(z.string().trim().min(1).max(300)).max(40)
});

export type LegalDraftRequest = z.infer<typeof legalDraftRequestSchema>;
export type LegalDraftModelResponse = z.infer<typeof legalDraftModelResponseSchema>;

export type LegalDraftResponse = LegalDraftModelResponse & {
  filingReady: boolean;
  requiresLegalReview: boolean;
  model: string;
};

export function isGenerativeResultType(value: string): value is LegalDraftRequest["allowedResultType"] {
  return (GENERATIVE_RESULT_TYPES as readonly string[]).includes(value);
}
