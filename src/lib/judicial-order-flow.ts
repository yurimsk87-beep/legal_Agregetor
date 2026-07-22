export const judicialOrderDebtRoute = {
  routeId: "judicial_order_debt",
  problemSlug: "sudebnyy-prikaz",
  categorySlug: "dolgi-kredity-i-pristavy",
  canonicalUrl: "/problems/dolgi-kredity-i-pristavy/sudebnyy-prikaz/",
  documentSlug: "vozrazhenie-na-sudebnyy-prikaz",
  documentVariant: "credit-loan",
  toolUrl: "/tools/sudebnyy-prikaz-deadline/",
  reviewUrl: "/document-review/"
} as const;

export type JudicialOrderRouteSource = "home" | "problems" | "situation" | "ai-navigator" | "document" | "tool";

export function normalizeJudicialOrderQuery(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

export function isJudicialOrderQuery(query: string) {
  const normalized = normalizeJudicialOrderQuery(query);
  return /(судебн|судебный|судебного|судебныи|суд)/.test(normalized) && /(приказ|приказа|преказ|прекз)/.test(normalized);
}

export function isJudicialOrderDebtQuery(query: string) {
  const normalized = normalizeJudicialOrderQuery(query);
  if (!isJudicialOrderQuery(normalized)) return false;
  return /(долг|кредит|банк|мфо|займ|заем|коллектор|взыскател|пристав|списал|карта|счет)/.test(normalized) || normalized === "судебный приказ";
}

export function getJudicialOrderProblemHref(query: string) {
  return isJudicialOrderDebtQuery(query) ? judicialOrderDebtRoute.canonicalUrl : null;
}

export function getJudicialOrderCheckHref(source: JudicialOrderRouteSource, entryUrl: string = judicialOrderDebtRoute.canonicalUrl) {
  return `/check/?route_id=${judicialOrderDebtRoute.routeId}&problem_slug=${judicialOrderDebtRoute.problemSlug}&source=${source}&risk=high&urgency=few_days&entry_url=${encodeURIComponent(entryUrl)}`;
}

export function getJudicialOrderDocumentHref(extraParams: Record<string, string | boolean | null | undefined> = {}) {
  const params = new URLSearchParams({
    variant: judicialOrderDebtRoute.documentVariant,
    route_id: judicialOrderDebtRoute.routeId
  });
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return `/documents/${judicialOrderDebtRoute.documentSlug}/?${params.toString()}#fill-online`;
}
