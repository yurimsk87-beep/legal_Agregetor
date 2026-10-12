import {
  LABOR_ADDITIVE_LEGAL_REVIEWED_AT,
  LABOR_ADDITIVE_LEGAL_RULES
} from "@/data/labor-additive-legal-sources";
import {
  LABOR_LEGAL_REVIEWED_AT,
  LABOR_LEGAL_RULES,
  getLaborRulesByIds,
  getLaborRulesForArea,
  type LaborLegalRule
} from "@/data/labor-legal-sources";
import { isLaborAdditiveRouteSlug } from "@/data/labor-additive-routes";
import type { LaborRoute } from "@/data/labor-routes";

export const ALL_LABOR_LEGAL_RULES: LaborLegalRule[] = [...LABOR_LEGAL_RULES, ...LABOR_ADDITIVE_LEGAL_RULES];

export function getLaborRulesForRoute(route: LaborRoute) {
  return isLaborAdditiveRouteSlug(route.slug)
    ? LABOR_ADDITIVE_LEGAL_RULES.filter((rule) => rule.routeSlugs.includes(route.slug))
    : getLaborRulesForArea(route.areaId);
}

export function getAnyLaborRulesByIds(ids: string[]) {
  const oldRules = getLaborRulesByIds(ids);
  const requested = new Set(ids);
  return [...oldRules, ...LABOR_ADDITIVE_LEGAL_RULES.filter((rule) => requested.has(rule.id))];
}

export function getLaborLegalReviewedAt(routeSlug: string) {
  return isLaborAdditiveRouteSlug(routeSlug) ? LABOR_ADDITIVE_LEGAL_REVIEWED_AT : LABOR_LEGAL_REVIEWED_AT;
}
