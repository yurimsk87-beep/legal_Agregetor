"use client";

import { LegalDraftGenerator } from "@/components/documents/LegalDraftGenerator";
import { LegalReviewLawyers } from "@/components/lawyers/LegalReviewLawyers";
import { isGenerativeResultType } from "@/lib/legal-draft-contract";

type Decision = {
  resultKind: string;
  documentTitle: string;
  filingReady: boolean;
  requiresLegalReview: boolean;
  preparedData: Array<{ label: string; value: string }>;
  issues: Array<{ field?: string; message: string }>;
  notices: string[];
};

type Rule = { id: string; norm: string; url: string; scope?: string; statement?: string; limitations?: string };

export function FamilyDocumentEnhancements({
  route,
  scenario,
  decision,
  rules,
  onDraftGenerated
}: {
  route: string;
  scenario: string;
  decision: Decision;
  rules: Rule[];
  onDraftGenerated: (draft: string) => void;
}) {
  const allowedResultType = isGenerativeResultType(decision.resultKind) ? decision.resultKind : null;
  const canGenerate = decision.issues.length === 0 && allowedResultType !== null;
  const verifiedFacts = Object.fromEntries(decision.preparedData.map((item, index) => [`${index + 1}. ${item.label}`, item.value]));

  return <>
    {canGenerate && allowedResultType ? <LegalDraftGenerator input={{
      route,
      scenario,
      documentType: decision.resultKind,
      documentTitle: decision.documentTitle,
      verifiedFacts,
      allowedLegalRules: rules,
      missingFacts: decision.issues.map((issue) => issue.message),
      filingReady: decision.filingReady,
      requiresLegalReview: decision.requiresLegalReview,
      safetyFlags: decision.notices,
      allowedResultType
    }} onGenerated={onDraftGenerated} /> : null}
    {decision.requiresLegalReview ? <LegalReviewLawyers context={{ route, scenario, documentTitle: decision.documentTitle }} /> : null}
  </>;
}
