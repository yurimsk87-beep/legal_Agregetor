import { PARENTS_CHILD_LEGAL_RULES } from "@/data/parents-child-legal-review";
import { CHILD_SUPPORT_LEGAL_RULES } from "@/data/child-support-legal-review";
import { PARENTAL_RIGHTS_DEPRIVATION_RULES } from "@/data/parental-rights-deprivation-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_RULES } from "@/data/parental-rights-restriction-legal-review";
import { PATERNITY_ESTABLISHMENT_RULES } from "@/data/paternity-establishment-legal-review";
import { PATERNITY_CONTEST_RULES } from "@/data/paternity-contest-legal-review";
import { ADOPTION_RULES } from "@/data/adoption-legal-review";
import { CHILD_TRAVEL_RULES } from "@/data/child-travel-legal-review";
import { CHILD_NAME_RULES } from "@/data/child-name-legal-review";
import { PARENTAL_RIGHTS_RESTORATION_RULES } from "@/data/parental-rights-restoration-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_RULES } from "@/data/parental-rights-restriction-cancellation-legal-review";
import { PARENTAL_DISAGREEMENTS_RULES } from "@/data/parental-disagreements-legal-review";
import { ADDITIONAL_CHILD_EXPENSES_LEGAL_RULES } from "@/data/additional-child-expenses-legal-review";
import { SPOUSAL_SUPPORT_LEGAL_RULES } from "@/data/spousal-support-legal-review";
import { PRENUPTIAL_AGREEMENT_LEGAL_RULES } from "@/data/prenuptial-agreement-legal-review";
import { INVALID_MARRIAGE_LEGAL_RULES } from "@/data/invalid-marriage-legal-review";
import { COMPLEX_MARITAL_PROPERTY_LEGAL_RULES } from "@/data/complex-marital-property-legal-review";
import { SURROGACY_ORIGIN_RULES } from "@/data/surrogacy-origin-legal-review";
import { INTERNATIONAL_FAMILY_DISPUTES_RULES } from "@/data/international-family-disputes-legal-review";
import { RELATIVE_CHILD_CONTACT_RULES } from "@/data/relative-child-contact-legal-review";
import { EMANCIPATION_RULES } from "@/data/emancipation-legal-review";
import { GUARDIANSHIP_LEGAL_RULES } from "@/data/guardianship-legal-review";
import { DIVORCE_PROPERTY_LEGAL_RULES } from "@/data/divorce-property-legal-review";
import { getMappedLegacyFamilyScenarios } from "@/data/legacy-family-route-catalog";
import type { LegalDraftRequest } from "@/lib/legal-draft-contract";

/**
 * Never accept caller-provided legal rules as a source of truth.
 * A draft route must identify a registered document and scenario, and every
 * rule must match its stored authoritative record for that scenario.
 */
const rulesByRoute: ReadonlyMap<string, readonly unknown[]> = new Map<string, readonly unknown[]>([
  ["roditeli-i-rebenok-posle-razvoda", PARENTS_CHILD_LEGAL_RULES],
  ["alimenty-na-rebenka", CHILD_SUPPORT_LEGAL_RULES],
  ["lishenie-roditelskih-prav", PARENTAL_RIGHTS_DEPRIVATION_RULES],
  ["ogranichenie-roditelskih-prav", PARENTAL_RIGHTS_RESTRICTION_RULES],
  ["ustanovlenie-otcovstva", PATERNITY_ESTABLISHMENT_RULES],
  ["osparivanie-otcovstva", PATERNITY_CONTEST_RULES],
  ["usynovlenie-rebenka", ADOPTION_RULES],
  ["vyezd-rebenka-za-granitsu", CHILD_TRAVEL_RULES],
  ["imya-familiya-otchestvo-rebenka", CHILD_NAME_RULES],
  ["vosstanovlenie-v-roditelskih-pravah", PARENTAL_RIGHTS_RESTORATION_RULES],
  ["otmena-ogranicheniya-roditelskih-prav", PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_RULES],
  ["raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu", PARENTAL_DISAGREEMENTS_RULES],
  ["dopolnitelnye-rashody-na-rebenka", ADDITIONAL_CHILD_EXPENSES_LEGAL_RULES],
  ["soderzhanie-supruga-i-byvshego-supruga", SPOUSAL_SUPPORT_LEGAL_RULES],
  ["brachnyy-dogovor", PRENUPTIAL_AGREEMENT_LEGAL_RULES],
  ["priznanie-braka-nedeystvitelnym", INVALID_MARRIAGE_LEGAL_RULES],
  ["slozhnye-imushchestvennye-spory-suprugov", COMPLEX_MARITAL_PROPERTY_LEGAL_RULES],
  ["surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka", SURROGACY_ORIGIN_RULES],
  ["mezhdunarodnye-semeynye-spory", INTERNATIONAL_FAMILY_DISPUTES_RULES],
  ["obshchenie-rodstvennikov-s-rebenkom", RELATIVE_CHILD_CONTACT_RULES],
  ["emansipatsiya-nesovershennoletnego", EMANCIPATION_RULES],
  ["opeka-i-popechitelstvo-nad-rebenkom", GUARDIANSHIP_LEGAL_RULES],
  ["razvod-i-razdel-imushchestva", DIVORCE_PROPERTY_LEGAL_RULES],
]);

type TrustedRule = { id: string; norm: string; url: string; statement?: string; scope?: string; limitations?: string };

function parseTrustedRule(raw: unknown): (TrustedRule & { scenarios: string[] }) | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const norm = typeof value.norm === "string" ? value.norm
    : typeof value.provision === "string" ? value.provision : null;
  if (typeof value.id !== "string" || !norm || typeof value.url !== "string" || !Array.isArray(value.scenarios)) return null;
  return {
    id: value.id,
    norm,
    url: value.url,
    scenarios: value.scenarios.filter((scenario): scenario is string => typeof scenario === "string"),
    statement: typeof value.statement === "string" ? value.statement : undefined,
    scope: typeof value.scope === "string" ? value.scope : typeof value.scopeNote === "string" ? value.scopeNote : undefined,
    limitations: typeof value.limitations === "string" ? value.limitations : undefined
  };
}

export type VerifiedFamilyDraftRequest = LegalDraftRequest & { verifiedRouteSlug: string; verifiedDocumentSlug: string };

export function verifyFamilyLegalDraftRequest(input: LegalDraftRequest): VerifiedFamilyDraftRequest {
  const match = input.route.match(/^\/documents\/([^/?#]+)\/$/);
  if (!match) throw new Error("Unknown document URL");
  const documentSlug = match[1];
  const routes = [...rulesByRoute.keys()].filter((slug) =>
    getMappedLegacyFamilyScenarios(slug, `/problems/semya-i-deti/${slug}/`)
      ?.some((scenario) => scenario.key === input.scenario && scenario.documentSlug === documentSlug)
  );
  if (routes.length !== 1) throw new Error("Document and scenario do not identify a unique verified family route");
  const routeRules = rulesByRoute.get(routes[0]) ?? [];
  const serverRules = new Map(
    routeRules.map(parseTrustedRule).filter((rule): rule is NonNullable<typeof rule> => rule !== null)
      .filter((rule) => rule.scenarios.includes(input.scenario))
      .map((rule) => [rule.id, rule])
  );
  if (!input.allowedLegalRules.length) throw new Error("Legal rules required");
  const trustedRules = input.allowedLegalRules.map((provided) => {
    const record = serverRules.get(provided.id);
    if (!record || record.norm !== provided.norm || record.url !== provided.url) {
      throw new Error("Client legal rule does not match the trusted scenario registry");
    }
    return {
      id: record.id, norm: record.norm, url: record.url,
      statement: record.statement, scope: record.scope, limitations: record.limitations
    };
  });
  if (new Set(trustedRules.map((rule) => rule.id)).size !== trustedRules.length) throw new Error("Duplicate legal rule IDs");
  if (input.filingReady || !input.requiresLegalReview) throw new Error("Only unverified draft requests are permitted");

  return { ...input, allowedLegalRules: trustedRules, filingReady: false, requiresLegalReview: true, verifiedRouteSlug: routes[0], verifiedDocumentSlug: documentSlug };
}
