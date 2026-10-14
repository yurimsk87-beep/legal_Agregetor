import { FAMILY_ADDITIVE_ROUTES, type FamilyAdditiveResultKind } from "@/data/family-additive-routes";
import { LABOR_CATEGORY_SLUG, LABOR_ROUTES, type LaborResultType } from "@/data/labor-routes";
import { legalProblems, type LegalProblem } from "@/data/legal-problems";
import { getMappedLegacyFamilyScenarios } from "@/data/legacy-family-route-catalog";

/**
 * Shared, read-only compatibility view over the existing legal navigation data.
 * A legacy entry is an explicitly tracked migration debt, NOT a certified v1 route.
 */
export const LEGAL_ROUTE_STANDARD_VERSION = "LEGAL_ROUTE_STANDARD_V1" as const;
export const FAMILY_CATEGORY_SLUG = "semya-i-deti" as const;

export type LegalRouteOutcomeKind =
  | "DRAFT"
  | "AGREEMENT_DRAFT"
  | "ENFORCEMENT_DRAFT"
  | "OFFICIAL_FORM"
  | "PREPARED_DATA"
  | "CHECKLIST"
  | "URGENT_INSTRUCTION"
  | "LEGAL_REVIEW_ONLY";

export type LegalRouteInput = {
  key: string;
  label: string;
  required: boolean;
  type: string;
};

export type LegalRouteScenarioV1 = {
  key: string;
  title: string;
  outcome: LegalRouteOutcomeKind;
  documentSlug: string | null;
  inputs: LegalRouteInput[];
  scenarioUrl: string;
  documentUrl: string | null;
};

export type LegalRouteV1 = {
  version: typeof LEGAL_ROUTE_STANDARD_VERSION;
  categorySlug: string;
  problemSlug: string;
  title: string;
  problemUrl: string;
  riskLevel: LegalProblem["riskLevel"];
  urgency: LegalProblem["urgency"];
  legalReviewedAt: string | null;
  migrationStatus: "ADAPTED_V1" | "SCENARIO_MAPPED_V1" | "LEGACY";
  source: "labor" | "family-additive" | "legacy-family";
  scenarios: LegalRouteScenarioV1[];
  relatedDocumentSlugs: string[];
};

/**
 * Frozen original inventory of family routes included in the V1 migration.
 * All baseline routes now have V1 result integration; new routes use the
 * structured family registry instead of being silently added to this list.
 */
export const LEGACY_FAMILY_ROUTE_SLUGS = [
  "brak-zags-i-smena-familii",
  "razvod-i-razdel-imushchestva",
  "opeka-i-popechitelstvo-nad-rebenkom",
  "roditeli-i-rebenok-posle-razvoda",
  "alimenty-na-rebenka",
  "lishenie-roditelskih-prav",
  "ogranichenie-roditelskih-prav",
  "ustanovlenie-otcovstva",
  "osparivanie-otcovstva",
  "usynovlenie-rebenka",
  "vyezd-rebenka-za-granitsu",
  "imya-familiya-otchestvo-rebenka",
  "vosstanovlenie-v-roditelskih-pravah",
  "otmena-ogranicheniya-roditelskih-prav",
  "raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu",
  "dopolnitelnye-rashody-na-rebenka",
  "soderzhanie-supruga-i-byvshego-supruga",
  "brachnyy-dogovor",
  "priznanie-braka-nedeystvitelnym",
  "slozhnye-imushchestvennye-spory-suprugov",
  "surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka",
  "mezhdunarodnye-semeynye-spory",
  "obshchenie-rodstvennikov-s-rebenkom",
  "emansipatsiya-nesovershennoletnego"
] as const;

const legacyFamilySet = new Set<string>(LEGACY_FAMILY_ROUTE_SLUGS);

const FAMILY_OUTCOMES: Record<FamilyAdditiveResultKind, LegalRouteOutcomeKind> = {
  checklist: "CHECKLIST",
  agreementDraft: "AGREEMENT_DRAFT",
  courtDraft: "DRAFT",
  enforcementDraft: "ENFORCEMENT_DRAFT",
  officialForm: "OFFICIAL_FORM",
  preparedData: "PREPARED_DATA",
  legalReviewOnly: "LEGAL_REVIEW_ONLY"
};

const LABOR_OUTCOMES: Record<LaborResultType, LegalRouteOutcomeKind> = {
  DRAFT: "DRAFT",
  PREPARED_DATA: "PREPARED_DATA",
  CHECKLIST: "CHECKLIST",
  URGENT_INSTRUCTION: "URGENT_INSTRUCTION"
};

function scenarioUrls(problemUrl: string, key: string, documentSlug?: string) {
  return {
    scenarioUrl: `${problemUrl}?scenario=${encodeURIComponent(key)}`,
    documentUrl: documentSlug ? `/documents/${documentSlug}/` : null
  };
}

export function adaptLegalProblemToV1(problem: LegalProblem): LegalRouteV1 {
  const problemUrl = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const base = {
    version: LEGAL_ROUTE_STANDARD_VERSION,
    categorySlug: problem.categorySlug,
    problemSlug: problem.slug,
    title: problem.title,
    problemUrl,
    riskLevel: problem.riskLevel,
    urgency: problem.urgency,
    legalReviewedAt: problem.lastReviewedAt ?? null,
    relatedDocumentSlugs: problem.relatedDocumentSlugs
  } satisfies Omit<LegalRouteV1, "migrationStatus" | "source" | "scenarios">;

  if (problem.categorySlug === LABOR_CATEGORY_SLUG) {
    const route = LABOR_ROUTES.find((item) => item.slug === problem.slug);
    if (!route) throw new Error(`Labor route not registered: ${problem.slug}`);
    return {
      ...base,
      migrationStatus: "ADAPTED_V1",
      source: "labor",
      scenarios: route.scenarios.map((scenario) => ({
        key: scenario.key,
        title: scenario.title,
        outcome: LABOR_OUTCOMES[scenario.resultType],
        documentSlug: scenario.documentSlug ?? null,
        inputs: scenario.questions.map((label, index) => ({
          key: `scenario-${index + 1}`,
          label,
          required: true,
          type: "text"
        })),
        ...scenarioUrls(problemUrl, scenario.key, scenario.documentSlug)
      }))
    };
  }

  if (problem.categorySlug === FAMILY_CATEGORY_SLUG) {
    const route = FAMILY_ADDITIVE_ROUTES[problem.slug as keyof typeof FAMILY_ADDITIVE_ROUTES];
    if (route) {
      return {
        ...base,
        migrationStatus: "ADAPTED_V1",
        source: "family-additive",
        scenarios: Object.values(route.scenarios).map((scenario) => ({
          key: scenario.key,
          title: scenario.title,
          outcome: FAMILY_OUTCOMES[scenario.resultKind],
          documentSlug: scenario.documentSlug,
          inputs: scenario.helperFields.map((field) => ({
            key: field.name,
            label: field.label,
            required: field.required ?? false,
            type: field.type
          })),
          ...scenarioUrls(problemUrl, scenario.key, scenario.documentSlug)
        }))
      };
    }
    if (!legacyFamilySet.has(problem.slug)) {
      throw new Error(`Unregistered family route ${problem.slug}. New routes must implement LEGAL_ROUTE_STANDARD_V1.`);
    }
    return {
      ...base,
      migrationStatus: "ADAPTED_V1",
      source: "legacy-family",
      scenarios: getMappedLegacyFamilyScenarios(problem.slug, problemUrl) ?? []
    };
  }

  throw new Error(`Unsupported legal category: ${problem.categorySlug}`);
}

export function getLegalRouteRegistry(): LegalRouteV1[] {
  return legalProblems.map(adaptLegalProblemToV1);
}

export function getLegalRouteV1(categorySlug: string, problemSlug: string): LegalRouteV1 | null {
  const problem = legalProblems.find((entry) => entry.categorySlug === categorySlug && entry.slug === problemSlug);
  return problem ? adaptLegalProblemToV1(problem) : null;
}
