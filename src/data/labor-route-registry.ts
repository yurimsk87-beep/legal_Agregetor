import {
  LABOR_ADDITIVE_MANUAL_ACCEPTANCE_INTENTS,
  LABOR_ADDITIVE_ROUTES,
  getLaborAdditiveRoute,
  isLaborAdditiveRouteSlug
} from "@/data/labor-additive-routes";
import {
  LABOR_MANUAL_ACCEPTANCE_INTENTS,
  LABOR_ROUTES,
  getLaborRoute,
  type LaborRoute
} from "@/data/labor-routes";

export const ALL_LABOR_ROUTES: LaborRoute[] = [...LABOR_ROUTES, ...LABOR_ADDITIVE_ROUTES];
export const ALL_LABOR_MANUAL_ACCEPTANCE_INTENTS = [
  ...LABOR_MANUAL_ACCEPTANCE_INTENTS,
  ...LABOR_ADDITIVE_MANUAL_ACCEPTANCE_INTENTS
] as const;

export function getAnyLaborRoute(slug: string) {
  return getLaborRoute(slug) ?? getLaborAdditiveRoute(slug);
}

export { isLaborAdditiveRouteSlug };
