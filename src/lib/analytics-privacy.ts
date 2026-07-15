export const ANALYTICS_CONSENT_COOKIE = "pravopoisk_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "pravopoisk:analytics-consent";

export type AnalyticsConsent = "granted" | "denied";
export type SafeAnalyticsPayload = Record<string, string | number | boolean>;

const safePayloadKeys = new Set([
  "category",
  "city",
  "cityId",
  "defaultCityId",
  "defaultServiceId",
  "feedbackSubmitted",
  "format",
  "lawyerId",
  "leadId",
  "placement",
  "questionId",
  "recipients",
  "service",
  "serviceId",
  "slug",
  "sourceType",
  "step",
  "status",
  "scenarioId",
  "riskLevel",
  "urgency",
  "durationBucket",
  "leadScore",
  "seoQualityScore"
]);

const safeNumberKeys = new Set(["recipients", "leadScore", "seoQualityScore"]);
const safeBooleanKeys = new Set(["feedbackSubmitted"]);
const safeToken = /^[a-zA-Z0-9._:-]{1,120}$/;
const staticRoutes = new Set([
  "about",
  "answer-rules",
  "calculators",
  "cases",
  "cities",
  "contacts",
  "documents",
  "for-lawyers",
  "how-we-check-lawyers",
  "lawyers",
  "legal",
  "login",
  "personal-data-consent",
  "privacy",
  "question-rules",
  "questions",
  "rating",
  "reestr-advokatov",
  "review-policy",
  "services",
  "specializations",
  "terms",
  "top",
  "video"
]);

export function readAnalyticsConsent(cookieHeader: string | null | undefined): AnalyticsConsent | null {
  if (!cookieHeader) return null;

  for (const item of cookieHeader.split(";")) {
    const [name, ...parts] = item.trim().split("=");
    if (name !== ANALYTICS_CONSENT_COOKIE) continue;

    const value = decodeURIComponent(parts.join("="));
    return value === "granted" || value === "denied" ? value : null;
  }

  return null;
}

export function hasAnalyticsConsent(cookieHeader: string | null | undefined) {
  return readAnalyticsConsent(cookieHeader) === "granted";
}

export function normalizeAnalyticsRoute(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  let path = value.trim();
  if (!path) return undefined;

  try {
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(path)) {
      path = new URL(path).pathname;
    }
  } catch {
    return undefined;
  }

  path = path.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/")) return undefined;

  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const [root] = segments;

  if (segments.length === 1 && staticRoutes.has(root)) return `/${root}`;

  if (root === "questions") {
    if (segments.length === 2) return "/questions/[questionSlug]";
    return "/questions/[city]/[service]";
  }

  if (root === "lawyers") {
    if (segments.length === 2) return "/lawyers/[lawyerSlug]";
    return "/lawyers/[city]/[service]";
  }

  if (root === "blog") return segments.length === 1 ? "/blog" : "/blog/[articleSlug]";
  if (root === "documents") return segments.length === 1 ? "/documents" : "/documents/[documentSlug]";
  if (root === "legal") return segments.length === 1 ? "/legal" : "/legal/[legalSlug]";
  if (root === "cases") return segments.length === 1 ? "/cases" : "/cases/[caseSlug]";
  if (root === "calculators") return segments.length === 1 ? "/calculators" : "/calculators/[calculatorSlug]";
  if (root === "video") return segments.length === 1 ? "/video" : "/video/[videoSlug]";
  if (root === "chto-delat-esli") return segments.length === 1 ? "/chto-delat-esli" : "/chto-delat-esli/[scenarioSlug]";

  if (root === "admin" || root === "lawyer-cabinet" || root === "account") {
    return segments.length === 1 ? `/${root}` : `/${root}/[route]`;
  }

  if (segments.length === 1) return "/[slug]";
  if (segments.length === 2) return "/[city]/[service]";
  return "/[dynamic]";
}

export function sanitizeAnalyticsPayload(payload: Record<string, unknown> | undefined): SafeAnalyticsPayload | undefined {
  if (!payload) return undefined;

  const entries = Object.entries(payload)
    .filter(([key]) => safePayloadKeys.has(key))
    .map(([key, value]) => [key, sanitizePayloadValue(key, value)] as const)
    .filter((entry): entry is readonly [string, string | number | boolean] => entry[1] !== undefined);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function sanitizeAnalyticsToken(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return safeToken.test(normalized) ? normalized : undefined;
}

function sanitizePayloadValue(key: string, value: unknown): string | number | boolean | undefined {
  if (typeof value === "string") return sanitizeAnalyticsToken(value);
  if (typeof value === "number" && safeNumberKeys.has(key) && Number.isFinite(value)) return value;
  if (typeof value === "boolean" && safeBooleanKeys.has(key)) return value;
  return undefined;
}
