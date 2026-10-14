import { ZAGS_PROBLEM_ROUTE, ZAGS_SCENARIOS } from "@/data/zags-route";
import { DIVORCE_PROPERTY_ROUTE, DIVORCE_PROPERTY_SCENARIOS } from "@/data/divorce-property-route";
import { GUARDIANSHIP_ROUTE, GUARDIANSHIP_SCENARIOS } from "@/data/guardianship-route";
import { PARENTS_CHILD_ROUTE, PARENTS_CHILD_SCENARIOS } from "@/data/parents-child-route";
import { CHILD_SUPPORT_ROUTE, CHILD_SUPPORT_SCENARIOS } from "@/data/child-support-route";
import { PARENTAL_RIGHTS_DEPRIVATION_ROUTE, PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS } from "@/data/parental-rights-deprivation-route";
import { PARENTAL_RIGHTS_RESTRICTION_ROUTE, PARENTAL_RIGHTS_RESTRICTION_SCENARIOS } from "@/data/parental-rights-restriction-route";
import { PATERNITY_ESTABLISHMENT_ROUTE, PATERNITY_ESTABLISHMENT_SCENARIOS } from "@/data/paternity-establishment-route";
import { PATERNITY_CONTEST_ROUTE, PATERNITY_CONTEST_SCENARIOS } from "@/data/paternity-contest-route";
import { ADOPTION_ROUTE, ADOPTION_SCENARIOS } from "@/data/adoption-route";
import { CHILD_TRAVEL_ROUTE, CHILD_TRAVEL_SCENARIOS } from "@/data/child-travel-route";
import { CHILD_NAME_ROUTE, CHILD_NAME_SCENARIOS } from "@/data/child-name-route";
import { PARENTAL_RIGHTS_RESTORATION_ROUTE, PARENTAL_RIGHTS_RESTORATION_SCENARIOS } from "@/data/parental-rights-restoration-route";
import { PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_ROUTE, PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_SCENARIOS } from "@/data/parental-rights-restriction-cancellation-route";
import { PARENTAL_DISAGREEMENTS_ROUTE, PARENTAL_DISAGREEMENTS_SCENARIOS } from "@/data/parental-disagreements-route";
import { ADDITIONAL_CHILD_EXPENSES_ROUTE, ADDITIONAL_CHILD_EXPENSES_SCENARIOS } from "@/data/additional-child-expenses-route";
import { SPOUSAL_SUPPORT_ROUTE, SPOUSAL_SUPPORT_SCENARIOS } from "@/data/spousal-support-route";
import { PRENUPTIAL_AGREEMENT_ROUTE, PRENUPTIAL_AGREEMENT_SCENARIOS } from "@/data/prenuptial-agreement-route";
import { INVALID_MARRIAGE_ROUTE, INVALID_MARRIAGE_SCENARIOS } from "@/data/invalid-marriage-route";
import { COMPLEX_MARITAL_PROPERTY_ROUTE, COMPLEX_MARITAL_PROPERTY_SCENARIOS } from "@/data/complex-marital-property-route";
import { SURROGACY_ORIGIN_ROUTE, SURROGACY_ORIGIN_SCENARIOS } from "@/data/surrogacy-origin-route";
import { INTERNATIONAL_FAMILY_DISPUTES_ROUTE, INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS } from "@/data/international-family-disputes-route";
import { RELATIVE_CHILD_CONTACT_ROUTE, RELATIVE_CHILD_CONTACT_SCENARIOS } from "@/data/relative-child-contact-route";
import { EMANCIPATION_ROUTE, EMANCIPATION_SCENARIOS } from "@/data/emancipation-route";
import type { LegalRouteScenarioV1 } from "@/data/legal-route-standard";

/**
 * Verified adapters for the 24 previously unmapped family routes.
 * A mapping does NOT mean the generator, legal validator or PDF flow is migrated.
 * Unknown outcome types are intentionally conservative (LEGAL_REVIEW_ONLY).
 */
type ScenarioField = { name: string; label: string; type?: string; required?: boolean };
type LegacyScenario = {
  key: string;
  title: string;
  documentSlug?: string;
  helperFields?: readonly ScenarioField[];
  questions?: readonly ScenarioField[];
};
function mapScenarios<T extends LegacyScenario>(
  definitions: Record<string, T>,
  fallbackDocumentSlug?: string
): LegalRouteScenarioV1[] {
  return Object.values(definitions).map((scenario) => {
    const documentSlug = scenario.documentSlug ?? fallbackDocumentSlug ?? null;
    return {
      key: scenario.key,
      title: scenario.title,
      outcome: "LEGAL_REVIEW_ONLY",
      documentSlug,
      inputs: (scenario.helperFields ?? scenario.questions ?? []).map((field) => ({
        key: field.name,
        label: field.label,
        type: field.type ?? "text",
        required: field.required ?? false
      })),
      // URL shape is finalized by the caller using the public problem slug.
      scenarioUrl: "",
      documentUrl: documentSlug ? `/documents/${documentSlug}/` : null
    };
  });
}

export const MAPPED_FAMILY_LEGACY_SCENARIOS: ReadonlyMap<string, readonly LegalRouteScenarioV1[]> = new Map([
  [ZAGS_PROBLEM_ROUTE.problemSlug, mapScenarios(ZAGS_SCENARIOS, ZAGS_PROBLEM_ROUTE.documentSlug)],
  [DIVORCE_PROPERTY_ROUTE.problemSlug, mapScenarios(DIVORCE_PROPERTY_SCENARIOS, undefined)],
  [GUARDIANSHIP_ROUTE.problemSlug, mapScenarios(GUARDIANSHIP_SCENARIOS, undefined)],
  [PARENTS_CHILD_ROUTE.problemSlug, mapScenarios(PARENTS_CHILD_SCENARIOS, undefined)],
  [CHILD_SUPPORT_ROUTE.problemSlug, mapScenarios(CHILD_SUPPORT_SCENARIOS, undefined)],
  [PARENTAL_RIGHTS_DEPRIVATION_ROUTE.problemSlug, mapScenarios(PARENTAL_RIGHTS_DEPRIVATION_SCENARIOS, undefined)],
  [PARENTAL_RIGHTS_RESTRICTION_ROUTE.problemSlug, mapScenarios(PARENTAL_RIGHTS_RESTRICTION_SCENARIOS, undefined)],
  [PATERNITY_ESTABLISHMENT_ROUTE.problemSlug, mapScenarios(PATERNITY_ESTABLISHMENT_SCENARIOS, undefined)],
  [PATERNITY_CONTEST_ROUTE.problemSlug, mapScenarios(PATERNITY_CONTEST_SCENARIOS, undefined)],
  [ADOPTION_ROUTE.problemSlug, mapScenarios(ADOPTION_SCENARIOS, undefined)],
  [CHILD_TRAVEL_ROUTE.problemSlug, mapScenarios(CHILD_TRAVEL_SCENARIOS, undefined)],
  [CHILD_NAME_ROUTE.problemSlug, mapScenarios(CHILD_NAME_SCENARIOS, undefined)],
  [PARENTAL_RIGHTS_RESTORATION_ROUTE.problemSlug, mapScenarios(PARENTAL_RIGHTS_RESTORATION_SCENARIOS, undefined)],
  [PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_ROUTE.problemSlug, mapScenarios(PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_SCENARIOS, undefined)],
  [PARENTAL_DISAGREEMENTS_ROUTE.problemSlug, mapScenarios(PARENTAL_DISAGREEMENTS_SCENARIOS, undefined)],
  [ADDITIONAL_CHILD_EXPENSES_ROUTE.problemSlug, mapScenarios(ADDITIONAL_CHILD_EXPENSES_SCENARIOS, undefined)],
  [SPOUSAL_SUPPORT_ROUTE.problemSlug, mapScenarios(SPOUSAL_SUPPORT_SCENARIOS, undefined)],
  [PRENUPTIAL_AGREEMENT_ROUTE.problemSlug, mapScenarios(PRENUPTIAL_AGREEMENT_SCENARIOS, undefined)],
  [INVALID_MARRIAGE_ROUTE.problemSlug, mapScenarios(INVALID_MARRIAGE_SCENARIOS, undefined)],
  [COMPLEX_MARITAL_PROPERTY_ROUTE.problemSlug, mapScenarios(COMPLEX_MARITAL_PROPERTY_SCENARIOS, undefined)],
  [SURROGACY_ORIGIN_ROUTE.problemSlug, mapScenarios(SURROGACY_ORIGIN_SCENARIOS, SURROGACY_ORIGIN_ROUTE.documentSlug)],
  [INTERNATIONAL_FAMILY_DISPUTES_ROUTE.problemSlug, mapScenarios(INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS, INTERNATIONAL_FAMILY_DISPUTES_ROUTE.documentSlug)],
  [RELATIVE_CHILD_CONTACT_ROUTE.problemSlug, mapScenarios(RELATIVE_CHILD_CONTACT_SCENARIOS, RELATIVE_CHILD_CONTACT_ROUTE.documentSlug)],
  [EMANCIPATION_ROUTE.problemSlug, mapScenarios(EMANCIPATION_SCENARIOS, EMANCIPATION_ROUTE.documentSlug)],
]);

export function getMappedLegacyFamilyScenarios(problemSlug: string, problemUrl: string): LegalRouteScenarioV1[] | null {
  const scenarios = MAPPED_FAMILY_LEGACY_SCENARIOS.get(problemSlug);
  if (!scenarios) return null;
  return scenarios.map((scenario) => ({
    ...scenario,
    scenarioUrl: `${problemUrl}?scenario=${encodeURIComponent(scenario.key)}`
  }));
}
