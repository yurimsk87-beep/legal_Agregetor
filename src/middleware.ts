import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { canonicalizePublicPathSegments } from "@/lib/canonical-slugs";

const botPattern = /(googlebot|yandexbot|bingbot|duckduckbot|slurp|baiduspider)/i;

// Public-facing redirects must resolve against the canonical site origin, not
// `request.url`. Behind a reverse proxy that rewrites the Host header to the
// upstream target (e.g. 127.0.0.1:3000 / localhost:3000), `request.url` would
// otherwise leak that internal host into Location headers
// (https://localhost:3000/...). NEXT_PUBLIC_SITE_URL is inlined at build time,
// so it always carries the real public domain regardless of the proxy. Internal
// fetches (api/seo-merge, api/bot-visits) intentionally keep using request.url
// so they hit the local server.
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://pravopoisk.ru").replace(/\/$/, "");

function siteRedirect(pathname: string): URL {
  return new URL(pathname, SITE_ORIGIN);
}
const publicSeoRedirects: Record<string, string> = {
  "/spb/": "/sankt-peterburg/",
  "/zhilishchnye-voprosy/": "/zhilishchnye-spory/",
  "/yurist-online/": "/questions/",
  "/konsultaciya-yurista-online/": "/questions/",
  "/besplatnaya-konsultaciya-yurista/": "/questions/",
  "/besplatnaya-yurist-online/": "/questions/",
  "/yuridicheskaya-konsultaciya/": "/questions/",
  "/yuridicheskaya-konsultaciya-online/": "/questions/",
  "/besplatnaya-yuridicheskaya-konsultaciya/": "/questions/",
  "/besplatnaya-yuridicheskaya-konsultaciya-online/": "/questions/",
  "/konsultaciya-yurista/": "/questions/",
  "/vopros-yuristu/": "/questions/",
  "/vopros-yuristu-besplatno/": "/questions/",
  "/sprasit-yurista-online/": "/questions/",
  "/zadat-vopros-yuristu/": "/questions/",
  "/zadati-vopros-yuristu/": "/questions/",
  "/contact/": "/contacts/",
  "/privacy/": "/legal/privacy/",
  "/privacy-policy/": "/legal/privacy/",
  "/terms/": "/legal/terms/",
  "/user-agreement/": "/legal/terms/",
  "/personal-data-consent/": "/legal/personal-data-consent/",
  "/question-rules/": "/legal/qna-rules/",
  "/answer-rules/": "/legal/qna-rules/",
  // Объединённые дубли ситуаций: канонический slug — из problems_target_structure.json
  "/problems/semya/razvod-s-detmi/": "/problems/semya-i-deti/razvod/",
  "/problems/semya-i-deti/razvod-s-detmi/": "/problems/semya-i-deti/razvod/",
  "/problems/semya/alimenty-ne-platyat/": "/problems/semya-i-deti/alimenty/",
  "/problems/semya-i-deti/alimenty-ne-platyat/": "/problems/semya-i-deti/alimenty/",
  "/problems/semya/vzyiskat-alimenty/": "/problems/semya-i-deti/alimenty/",
  "/problems/semya-i-deti/vzyiskat-alimenty/": "/problems/semya-i-deti/alimenty/",
  "/problems/semya/dolg-po-alimentam/": "/problems/semya-i-deti/alimenty/",
  "/problems/semya-i-deti/dolg-po-alimentam/": "/problems/semya-i-deti/alimenty/",
  "/problems/dolgi-kredity-i-pristavy/dolgi-po-alimentam/": "/problems/semya-i-deti/alimenty/",
  "/problems/semya/osporit-otcovstvo/": "/problems/semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva/",
  "/problems/semya-i-deti/osporit-otcovstvo/": "/problems/semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva/",
  "/problems/semya/ustanovit-otcovstvo/": "/problems/semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva/",
  "/problems/semya-i-deti/ustanovit-otcovstvo/": "/problems/semya-i-deti/ustanovlenie-ili-osparivanie-otcovstva/",
  "/problems/semya-i-deti/razdel-imuschestva-pri-razvode/": "/problems/semya-i-deti/razdel-imushchestva-suprugov/",
  "/problems/semya-i-deti/domashnee-nasilie/": "/problems/semya-i-deti/nasilie-v-seme/"
};

type SeoMergeResponse = {
  ok: boolean;
  merge?: {
    oldUrl: string;
    newUrl?: string | null;
    reason: string;
    redirectType: "REDIRECT_301" | "GONE_410" | "NOINDEX";
  } | null;
};

type SeoMergeResult = NonNullable<SeoMergeResponse["merge"]> | null;

// Middleware runs in the Edge runtime, so we cannot import Prisma here and must
// reach the database through the `/api/seo-merge` route. To avoid an extra HTTP
// round-trip + DB hit on every public request, results (including "no merge")
// are cached in-process with a short TTL. Popular pages and the common
// no-merge case are then served from memory. We intentionally keep the broad
// path coverage in `shouldCheckSeoMerge` instead of a prefix whitelist, because
// SeoMerge targets arbitrary slugs (city/service pages) and narrowing would
// silently break their canonical 301/410 redirects.
const SEO_MERGE_CACHE_TTL_MS = 60_000;
const SEO_MERGE_CACHE_MAX_ENTRIES = 500;
const seoMergeCache = new Map<string, { value: SeoMergeResult; expiresAt: number }>();

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const response = NextResponse.next();
  const userAgent = request.headers.get("user-agent") ?? "";
  const normalizedPath = normalizePublicPath(request.nextUrl.pathname);
  const publicSeoRedirect = publicSeoRedirects[normalizedPath] ?? canonicalSlugRedirect(normalizedPath);
  const technicalNoindexPath = isTechnicalNoindexPath(request.nextUrl.pathname);

  // /search/ удалён — единый поиск переехал в /questions/. Постоянный редирект с
  // сохранением ?q=, чтобы старые ссылки/закладки/поисковый кэш не давали 404.
  if (normalizedPath === "/search/") {
    const target = siteRedirect("/questions/");
    target.search = request.nextUrl.search;
    const redirectResponse = NextResponse.redirect(target, 308);
    trackBotVisit(request, event, userAgent, 308, redirectResponse);
    return redirectResponse;
  }

  if (publicSeoRedirect) {
    const redirectResponse = NextResponse.redirect(siteRedirect(publicSeoRedirect), 301);
    trackBotVisit(request, event, userAgent, 301, redirectResponse);
    return redirectResponse;
  }

  const trailingSlashResponse = redirectToTrailingSlash(request);
  if (trailingSlashResponse) {
    if (technicalNoindexPath) trailingSlashResponse.headers.set("x-robots-tag", "noindex, nofollow");
    trackBotVisit(request, event, userAgent, trailingSlashResponse.status, trailingSlashResponse);
    return trailingSlashResponse;
  }

  if (technicalNoindexPath) {
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const adminResponse = await requireAdmin(request);
    if (adminResponse) {
      trackBotVisit(request, event, userAgent, adminResponse.status, adminResponse);
      return adminResponse;
    }
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (isAccountPath(request.nextUrl.pathname)) {
    const accountResponse = await requireUser(request);
    if (accountResponse) {
      trackBotVisit(request, event, userAgent, accountResponse.status, accountResponse);
      return accountResponse;
    }
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (isLawyerCabinetPath(request.nextUrl.pathname)) {
    const lawyerResponse = await requireLawyer(request);
    if (lawyerResponse) {
      trackBotVisit(request, event, userAgent, lawyerResponse.status, lawyerResponse);
      return lawyerResponse;
    }
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (isLegacyLawyerPath(request.nextUrl.pathname)) {
    const lawyerResponse = await requireLawyerOrAdmin(request);
    if (lawyerResponse) {
      trackBotVisit(request, event, userAgent, lawyerResponse.status, lawyerResponse);
      return lawyerResponse;
    }
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (shouldCheckSeoMerge(request)) {
    const merge = await resolveSeoMerge(request);

    if (merge?.redirectType === "REDIRECT_301" && merge.newUrl) {
      const redirectResponse = NextResponse.redirect(siteRedirect(merge.newUrl), 301);
      trackBotVisit(request, event, userAgent, 301, redirectResponse);
      return redirectResponse;
    }

    if (merge?.redirectType === "GONE_410") {
      const goneResponse = new NextResponse("Gone", {
        status: 410,
        headers: {
          "x-robots-tag": "noindex, follow"
        }
      });
      trackBotVisit(request, event, userAgent, 410, goneResponse);
      return goneResponse;
    }

    if (merge?.redirectType === "NOINDEX") {
      response.headers.set("x-robots-tag", "noindex, follow");
    }
  }

  trackBotVisit(request, event, userAgent, response.status, response);

  return response;
}

function detectBot(userAgent: string) {
  const match = userAgent.match(botPattern);
  return match?.[1] ?? "unknown";
}

function normalizePublicPath(pathname: string) {
  if (pathname === "/") return "/";
  return `/${pathname.replace(/^\/+|\/+$/g, "")}/`;
}

function canonicalSlugRedirect(pathname: string) {
  if (isNavigatorPath(pathname)) return null;

  const canonicalPath = canonicalizePublicPathSegments(pathname);
  if (canonicalPath === pathname) return null;

  return canonicalPath;
}

function isNavigatorPath(pathname: string) {
  return pathname === "/problems/" || pathname.startsWith("/problems/") || pathname === "/documents/" || pathname.startsWith("/documents/") || pathname === "/tools/" || pathname.startsWith("/tools/");
}

function isTechnicalNoindexPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/lawyer-cabinet" ||
    pathname.startsWith("/lawyer-cabinet/") ||
    pathname === "/lawyer" ||
    pathname.startsWith("/lawyer/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/test" ||
    pathname.startsWith("/test/") ||
    pathname === "/__test" ||
    pathname.startsWith("/__test/") ||
    pathname === "/debug" ||
    pathname.startsWith("/debug/") ||
    pathname === "/dev" ||
    pathname.startsWith("/dev/") ||
    pathname === "/__dev" ||
    pathname.startsWith("/__dev/") ||
    pathname === "/fallback" ||
    pathname.startsWith("/fallback/")
  );
}

function redirectToTrailingSlash(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") return null;
  if (pathname.endsWith("/")) return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/_next/")) return null;
  if (pathname.includes(".")) return null;

  const url = siteRedirect(`${pathname}/`);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

function shouldCheckSeoMerge(request: NextRequest) {
  // Escape hatch: allow disabling the SEO-merge lookup entirely without a deploy
  // change to code (e.g. if it ever needs to be turned off under load).
  if (process.env.ENABLE_SEO_MERGE_MIDDLEWARE === "false") return false;

  const pathname = request.nextUrl.pathname;
  if (pathname === "/") return false;
  if (pathname.startsWith("/admin")) return false;
  if (isAccountPath(pathname)) return false;
  if (isLawyerCabinetPath(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.includes(".")) return false;
  return true;
}

function isLawyerCabinetPath(pathname: string) {
  return pathname === "/lawyer-cabinet" || pathname.startsWith("/lawyer-cabinet/");
}

function isAccountPath(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

function isLegacyLawyerPath(pathname: string) {
  return pathname === "/lawyer" || pathname.startsWith("/lawyer/");
}

async function requireAdmin(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (session?.role === "ADMIN") return null;
  if (session) {
    const response = NextResponse.redirect(siteRedirect("/"), 307);
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  const loginUrl = siteRedirect("/login/");
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(loginUrl, 307);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

async function requireUser(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (session?.role === "USER") return null;
  if (session) {
    const response = NextResponse.redirect(siteRedirect("/"), 307);
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  const loginUrl = siteRedirect("/login/");
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(loginUrl, 307);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

async function requireLawyer(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (session?.role === "LAWYER") return null;
  if (session) {
    const response = NextResponse.redirect(siteRedirect("/"), 307);
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  const loginUrl = siteRedirect("/login/");
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(loginUrl, 307);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

async function requireLawyerOrAdmin(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (session?.role === "LAWYER" || session?.role === "ADMIN") return null;

  const loginUrl = siteRedirect("/login/");
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(loginUrl, 307);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

function trackBotVisit(request: NextRequest, event: NextFetchEvent, userAgent: string, statusCode: number, response?: NextResponse) {
  if (!botPattern.test(userAgent)) return;
  if (request.nextUrl.pathname.startsWith("/api/bot-visits")) return;

  response?.headers.set("x-bot-detected", "true");
  const startedAt = Date.now();
  const endpoint = new URL("/api/bot-visits", request.url);

  event.waitUntil(
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.BOT_VISIT_SECRET ? { "x-internal-token": process.env.BOT_VISIT_SECRET } : {})
      },
      body: JSON.stringify({
        botName: detectBot(userAgent),
        url: request.nextUrl.pathname + request.nextUrl.search,
        statusCode,
        responseTime: Date.now() - startedAt,
        userAgent
      })
    }).catch(() => undefined)
  );
}

async function resolveSeoMerge(request: NextRequest): Promise<SeoMergeResult> {
  const path = request.nextUrl.pathname;
  const cached = seoMergeCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const endpoint = new URL("/api/seo-merge", request.url);
    endpoint.searchParams.set("path", path);

    const response = await fetch(endpoint, {
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      cacheSeoMerge(path, null);
      return null;
    }
    const data = (await response.json()) as SeoMergeResponse;
    const merge = data.merge ?? null;
    cacheSeoMerge(path, merge);
    return merge;
  } catch {
    // Network/parse failures are not cached so a transient error does not pin a
    // wrong result for the whole TTL.
    return null;
  }
}

function cacheSeoMerge(path: string, value: SeoMergeResult) {
  if (seoMergeCache.size >= SEO_MERGE_CACHE_MAX_ENTRIES) {
    const oldestKey = seoMergeCache.keys().next().value;
    if (oldestKey !== undefined) seoMergeCache.delete(oldestKey);
  }
  seoMergeCache.set(path, { value, expiresAt: Date.now() + SEO_MERGE_CACHE_TTL_MS });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
