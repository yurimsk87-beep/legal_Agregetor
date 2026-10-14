import { documentResultSchema, type DocumentResultV1 } from "@/lib/document-result-contract";
import { getLegalRouteV1 } from "@/data/legal-route-standard";
import { getNavigatorDocument } from "@/data/documents";

/** A client-side draft is always unverified. Do not accept arbitrary route links. */
export function validateSavedDocument(input: unknown): DocumentResultV1 | null {
  const parsed = documentResultSchema.safeParse(input);
  if (!parsed.success) return null;
  const result = parsed.data;
  const route = getLegalRouteV1(result.categorySlug, result.routeSlug);
  if (!route || !getNavigatorDocument(result.documentSlug)) return null;
  if (!route.scenarios.some((item) =>
    item.key === result.scenarioKey && item.documentSlug === result.documentSlug
  )) return null;
  if (result.filingReady !== false) return null;
  return result;
}
