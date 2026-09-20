import type { Lawyer } from "@/lib/types";

export type ReviewLawyerFetcher = (filters: { serviceSlug: FamilyReviewServiceSlug; take: number }) => Promise<Lawyer[]>;

export const FAMILY_REVIEW_SERVICE_SLUGS = [
  "semeynye-spory",
  "alimenty",
  "razvod",
  "razdel-imushchestva",
  "opredelenie-mesta-zhitelstva-rebenka",
  "poryadok-obshcheniya-s-rebenkom",
  "lishenie-roditelskih-prav",
  "braknyy-dogovor",
  "ustanovlenie-otcovstva",
  "osparivanie-otcovstva",
  "mezhdunarodnoe-pravo"
] as const;

export type FamilyReviewServiceSlug = typeof FAMILY_REVIEW_SERVICE_SLUGS[number];

const allowedServices = new Set<string>(FAMILY_REVIEW_SERVICE_SLUGS);

export function normalizeFamilyReviewService(value: string | null | undefined): FamilyReviewServiceSlug {
  return value && allowedServices.has(value) ? value as FamilyReviewServiceSlug : "semeynye-spory";
}

export function getFamilyReviewService(route: string, scenario = ""): FamilyReviewServiceSlug {
  const context = `${route} ${scenario}`.toLowerCase();
  if (/(osparivanie-otcovstva|paternity-contest)/.test(context)) return "osparivanie-otcovstva";
  if (/(ustanovlenie-otcovstva|paternity-establishment)/.test(context)) return "ustanovlenie-otcovstva";
  if (/(aliment|child-support|spousal-support)/.test(context)) return "alimenty";
  if (/(mesto-zhitelstva|meste-zhitelstva|residence)/.test(context)) return "opredelenie-mesta-zhitelstva-rebenka";
  if (/(obshchen|communication|contact|ispolnenie-poryadka)/.test(context)) return "poryadok-obshcheniya-s-rebenkom";
  if (/(lishen[a-z-]*roditelsk|ogranichen[a-z-]*roditelsk|vosstanovlen[a-z-]*roditelsk|parental-right)/.test(context)) return "lishenie-roditelskih-prav";
  if (/(brachn|prenuptial)/.test(context)) return "braknyy-dogovor";
  if (/(razdel-imushch|imushchestven|property|mortgage)/.test(context)) return "razdel-imushchestva";
  if (/(mezhdunarod|international)/.test(context)) return "mezhdunarodnoe-pravo";
  if (/(razvod|rastorzhen)/.test(context)) return "razvod";
  return "semeynye-spory";
}

export function selectReviewLawyers(candidates: Lawyer[], limit = 4) {
  return [...candidates]
    .filter((lawyer) => lawyer.active !== false && lawyer.blocked !== true && lawyer.profileStatus === "APPROVED")
    .sort((a, b) => Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified))
      || (b.rating ?? 0) - (a.rating ?? 0)
      || (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      || b.experienceYears - a.experienceYears
      || a.id.localeCompare(b.id))
    .slice(0, Math.min(4, Math.max(0, limit)));
}

export async function getFamilyReviewLawyers(
  service: FamilyReviewServiceSlug,
  fetchCandidates: ReviewLawyerFetcher
) {
  const specific = selectReviewLawyers(await fetchCandidates({ serviceSlug: service, take: 20 }));
  if (specific.length || service === "semeynye-spory") {
    return { service, lawyers: specific };
  }

  const fallbackService = "semeynye-spory" as const;
  return {
    service: fallbackService,
    lawyers: selectReviewLawyers(await fetchCandidates({ serviceSlug: fallbackService, take: 20 }))
  };
}
