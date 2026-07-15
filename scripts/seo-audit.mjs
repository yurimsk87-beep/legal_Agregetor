import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHmac } from "node:crypto";

const root = process.cwd();
const issues = [];
const canonicalCache = new Map();

const sourceStats = runSourceAudit();
const liveStats = await runLiveAudit();
const databaseStats = await runDatabaseAudit(liveStats.siteUrl, liveStats.sitemapPageUrls ?? []);

const report = {
  generatedAt: new Date().toISOString(),
  siteUrl: liveStats.siteUrl,
  mode: liveStats.enabled ? "source+live+database" : "source+database",
  totals: {
    ...sourceStats,
    ...databaseStats,
    sitemapUrls: liveStats.sitemapUrls,
    pagesAudited: liveStats.pagesAudited,
    filterProbes: liveStats.filterProbes,
    apiProbes: liveStats.apiProbes,
    adminProbes: liveStats.adminProbes,
    internalLinksAudited: liveStats.internalLinksAudited,
    canonicalUrlsAudited: liveStats.canonicalUrlsAudited,
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length
  },
  issues
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "reports", "seo-audit.json"), JSON.stringify(report, null, 2), "utf8");

console.log("SEO audit complete");
console.log(`Mode: ${report.mode}`);
console.log(`Required files: ${report.totals.requiredFiles}`);
console.log(`Sitemap URLs: ${report.totals.sitemapUrls}`);
console.log(`Pages audited: ${report.totals.pagesAudited}`);
console.log(`Filter probes: ${report.totals.filterProbes}`);
console.log(`API probes: ${report.totals.apiProbes}`);
console.log(`Admin probes: ${report.totals.adminProbes}`);
console.log(`Internal links audited: ${report.totals.internalLinksAudited}`);
console.log(`Canonical URLs audited: ${report.totals.canonicalUrlsAudited}`);
console.log(`Database entities audited: ${report.totals.databaseEntitiesAudited}`);
console.log(`Errors: ${report.totals.errors}`);
console.log(`Warnings: ${report.totals.warnings}`);

for (const issue of issues.slice(0, 100)) {
  console.log(`[${issue.severity}] ${issue.page} - ${issue.message}`);
}

if (issues.length > 100) {
  console.log(`...and ${issues.length - 100} more issues. See reports/seo-audit.json`);
}

if (report.totals.errors > 0) {
  process.exitCode = 1;
}

function runSourceAudit() {
  const requiredFiles = [
    "src/lib/seo.ts",
    "src/lib/jsonld.ts",
    "src/lib/sample-data.ts",
    "src/app/robots.ts",
    "src/app/login/page.tsx",
    "src/app/logout/route.ts",
    "src/app/sitemap.xml/route.ts",
    "src/app/search/page.tsx",
    "src/app/sitemap-pages.xml/route.ts",
    "src/app/sitemap-cities.xml/route.ts",
    "src/app/sitemap-services.xml/route.ts",
    "src/app/sitemap-city-services.xml/route.ts",
    "src/app/sitemap-lawyers.xml/route.ts",
    "src/app/sitemap-articles.xml/route.ts",
    "src/app/sitemap-questions.xml/route.ts",
    "src/app/sitemap-documents.xml/route.ts",
    "src/app/sitemap-calculators.xml/route.ts",
    "src/app/sitemap-cases.xml/route.ts",
    "src/app/sitemap-checklists.xml/route.ts",
    "src/app/sitemap-videos.xml/route.ts",
    "src/app/sitemap-scenarios.xml/route.ts",
    "src/middleware.ts",
    "src/app/api/events/route.ts",
    "src/app/api/lawyers/route.ts",
    "src/app/api/questions/route.ts",
    "src/app/api/reviews/route.ts",
    "src/app/api/seo-merge/route.ts",
    "src/app/contacts/page.tsx",
    "src/lib/auth.ts",
    "src/lib/server-auth.ts",
    "src/lib/contact-safety.ts",
    "src/lib/platform.ts",
    "src/lib/analytics-client.ts",
    "src/components/TrackableLink.tsx",
    "prisma/schema.prisma",
    "prisma.config.ts"
  ];

  for (const file of requiredFiles) {
    if (!existsSync(join(root, file))) {
      add("error", file, "Required SEO file is missing.");
    }
  }

  const seo = read("src/lib/seo.ts");
  const sample = read("src/lib/sample-data.ts");
  const schema = read("prisma/schema.prisma");
  const robots = read("src/app/robots.ts");
  const sitemap = read("src/lib/repositories.ts");
  const jsonld = read("src/lib/jsonld.ts");
  const lawyerCard = read("src/components/LawyerCard.tsx");
  const lawyerPage = read("src/app/yuristy/[lawyerSlug]/page.tsx");
  const eventsApi = read("src/app/api/events/route.ts");
  const lawyersApi = read("src/app/api/lawyers/route.ts");
  const questionsApi = read("src/app/api/questions/route.ts");
  const reviewsApi = read("src/app/api/reviews/route.ts");
  const middleware = read("src/middleware.ts");
  const auth = read("src/lib/auth.ts");
  const serverAuth = read("src/lib/server-auth.ts");
  const types = read("src/lib/types.ts");
  const analyticsClient = read("src/lib/analytics-client.ts");

  checkContains(seo, "hasIndexBlockingParams", "src/lib/seo.ts", "Missing query-param noindex guard.");
  checkContains(seo, "calculateSeoScore", "src/lib/seo.ts", "Missing seoScore calculation.");
  checkContains(seo, "maturityAllowsIndex", "src/lib/seo.ts", "Missing seoMaturity gate.");
  checkContains(seo, "canIndexCityServicePage", "src/lib/seo.ts", "Missing city+service quality gate.");
  checkContains(seo, "canIndexQuestionPage", "src/lib/seo.ts", "Missing question UGC quality gate.");
  checkContains(seo, "canIndexArticlePage", "src/lib/seo.ts", "Missing article quality gate.");

  for (const param of ["sort", "price", "online", "rating", "page", "filter", "utm_"]) {
    checkContains(robots, param, "src/app/robots.ts", `robots.txt does not block ${param}.`);
  }

  for (const type of [
    "Organization",
    "WebSite",
    "BreadcrumbList",
    "LegalService",
    "Person",
    "FAQPage",
    "Article",
    "Question",
    "Answer",
    "VideoObject",
    "LocalBusiness"
  ]) {
    checkContains(jsonld, type, "src/lib/jsonld.ts", `Missing JSON-LD generator or type: ${type}.`);
  }

  for (const model of [
    "SearchIntent",
    "KeywordDemand",
    "KeywordTarget",
    "SeoScore",
    "SeoRevision",
    "SeoMaturity",
    "LegalSource",
    "LawChange",
    "ContentFreshness",
    "BotVisit",
    "IndexStatus",
    "SeoMerge",
    "PotentialSeoPage",
    "CompetitorPage"
  ]) {
    checkContains(schema, `model ${model}`, "prisma/schema.prisma", `Missing Prisma model ${model}.`);
  }

  for (const sitemapName of [
    "pages",
    "cities",
    "services",
    "city-services",
    "lawyers",
    "articles",
    "questions",
    "documents",
    "calculators",
    "cases",
    "checklists",
    "videos",
    "scenarios"
  ]) {
    checkContains(sitemap, `"${sitemapName}"`, "src/lib/repositories.ts", `Missing sitemap kind ${sitemapName}.`);
  }

  if (/href=\{?`?\$\{?basePath\}?\?/.test(read("src/components/Filters.tsx"))) {
    add("error", "src/components/Filters.tsx", "Filters expose crawlable parameter links instead of non-link controls.");
  }

  const indexableCount = count(sample, "isIndexable: true");
  const seoScoreCount = count(sample, "seoScore");
  const maturityCount = count(sample, "seoMaturity");
  const faqCount = count(sample, "makeFaqs(");

  if (indexableCount < 10) add("warning", "src/lib/sample-data.ts", "Few indexable sample pages found.");
  if (seoScoreCount < 3) add("error", "src/lib/sample-data.ts", "Sample data does not expose enough seoScore fields.");
  if (maturityCount < 3) add("error", "src/lib/sample-data.ts", "Sample data does not expose enough seoMaturity fields.");
  if (faqCount < 6) add("warning", "src/lib/sample-data.ts", "FAQ coverage may be too thin.");

  if (sitemap.includes("?sort=") || sitemap.includes("?page=") || sitemap.includes("?filter=")) {
    add("error", "src/lib/repositories.ts", "Potential filter or pagination URL appears in sitemap source.");
  }

  checkContains(sitemap, '"/contacts/"', "src/lib/repositories.ts", "Contacts page is missing from sitemap pages.");
  checkContains(analyticsClient, "PLATFORM_PHONE_CLICKED", "src/lib/analytics-client.ts", "Missing platform contact analytics events.");
  checkContains(analyticsClient, "__YANDEX_METRIKA_ID", "src/lib/analytics-client.ts", "Yandex Metrika goals cannot read the server-side counter id.");
  checkContains(read("src/lib/contact-safety.ts"), "redactForbiddenContacts", "src/lib/contact-safety.ts", "Missing public contact redaction helper.");
  checkContains(lawyersApi, "canonicalPolicy", "src/app/api/lawyers/route.ts", "Public lawyers API must document noindex/canonical policy for query-param filters.");
  checkContains(middleware, "requireAdmin", "src/middleware.ts", "Admin area is not protected by middleware.");
  checkContains(middleware, "verifySessionToken", "src/middleware.ts", "Admin middleware must verify signed session tokens.");
  checkContains(middleware, "AUTH_COOKIE_NAME", "src/middleware.ts", "Admin middleware must read the session cookie.");
  checkContains(middleware, "x-robots-tag", "src/middleware.ts", "Admin protection must send noindex robots header.");
  checkContains(auth, "createSessionToken", "src/lib/auth.ts", "Missing session token creation.");
  checkContains(auth, "verifySessionToken", "src/lib/auth.ts", "Missing session token verification.");
  checkContains(serverAuth, "requireAdminSession", "src/lib/server-auth.ts", "Missing server-side admin role guard.");
  checkContains(read("src/app/login/page.tsx"), "bcrypt.compare", "src/app/login/page.tsx", "Login must verify password hashes.");
  checkContains(types, '"NEEDS_REVIEW"', "src/lib/types.ts", "Local QualityStatus type is missing NEEDS_REVIEW.");
  checkContains(questionsApi, "redactForbiddenContacts(data.userName)", "src/app/api/questions/route.ts", "Question API must redact contacts from public userName.");
  checkContains(reviewsApi, "redactForbiddenContacts(data.userName)", "src/app/api/reviews/route.ts", "Review API must redact contacts from public userName.");

  for (const token of ["phone:", "whatsapp", "telegram", "email:", "site:", "socials", "contacts"]) {
    if (lawyersApi.includes(token)) {
      add("error", "src/app/api/lawyers/route.ts", `Public lawyers API may expose direct lawyer contact data: ${token}.`);
    }
  }

  for (const [file, text] of [
    ["src/components/LawyerCard.tsx", lawyerCard],
    ["src/app/yuristy/[lawyerSlug]/page.tsx", lawyerPage]
  ]) {
    for (const token of ["lawyer.phone", "lawyer.whatsapp", "lawyer.telegram", "lawyer.email", "CALL_CLICK", "WHATSAPP_CLICK", "TELEGRAM_CLICK", "PHONE_VIEW", "wa.me", "t.me"]) {
      if (text.includes(token)) {
        add("error", file, `Public lawyer contact leak or legacy personal-contact event found: ${token}.`);
      }
    }
  }

  for (const token of ["telephone: lawyer", "email: lawyer"]) {
    if (jsonld.includes(token)) add("error", "src/lib/jsonld.ts", `JSON-LD exposes a personal lawyer contact: ${token}.`);
  }

  for (const token of ['"CALL_CLICK"', '"WHATSAPP_CLICK"', '"TELEGRAM_CLICK"', '"PHONE_VIEW"', "lawyer_phone_clicked", "lawyer_whatsapp_clicked", "lawyer_telegram_clicked", "lawyer_email_clicked"]) {
    if (eventsApi.includes(token) || analyticsClient.includes(token)) {
      add("error", "analytics", `Personal lawyer contact event is still accepted or emitted: ${token}.`);
    }
  }

  return {
    requiredFiles: requiredFiles.length,
    indexableMarkers: indexableCount,
    seoScoreMarkers: seoScoreCount,
    seoMaturityMarkers: maturityCount
  };
}

async function runLiveAudit() {
  const siteUrl = normalizeSiteUrl(process.env.SITE_URL || envValue("SITE_URL") || "http://localhost:3000");
  const stats = {
    enabled: false,
    siteUrl,
    sitemapUrls: 0,
    pagesAudited: 0,
    filterProbes: 0,
    internalLinksAudited: 0,
    canonicalUrlsAudited: 0,
    sitemapPageUrls: [],
    apiProbes: 0,
    adminProbes: 0
  };

  await auditRobots(siteUrl);

  let sitemapIndex;
  try {
    sitemapIndex = await fetchText(`${siteUrl}/sitemap.xml`);
  } catch (error) {
    add("warning", `${siteUrl}/sitemap.xml`, `Live audit skipped: ${error.message}`);
    return stats;
  }

  stats.enabled = true;
  const sitemapUrls = unique(extractLocs(sitemapIndex)).filter((url) => url.includes("/sitemap-"));
  if (sitemapUrls.length === 0) {
    add("error", `${siteUrl}/sitemap.xml`, "Sitemap index does not contain child sitemaps.");
  }

  const pageUrls = [];
  for (const sitemapUrl of sitemapUrls) {
    try {
      const xml = await fetchText(sitemapUrl);
      const urls = extractLocs(xml);
      for (const url of urls) {
        if (url.includes("?")) add("error", url, "Parameterized URL appears in sitemap.");
        if (/([?&]page=|\/page\/\d+)/.test(url)) add("error", url, "Paginated URL appears in sitemap.");
        pageUrls.push(normalizePageUrl(url));
      }
    } catch (error) {
      add("error", sitemapUrl, `Cannot fetch child sitemap: ${error.message}`);
    }
  }

  const uniquePageUrls = unique(pageUrls);
  stats.sitemapUrls = uniquePageUrls.length;
  stats.sitemapPageUrls = uniquePageUrls;

  const maxPages = Number(process.env.SEO_AUDIT_MAX_PAGES || envValue("SEO_AUDIT_MAX_PAGES") || 250);
  const pagesToAudit = uniquePageUrls.slice(0, maxPages);
  const titleMap = new Map();
  const descriptionMap = new Map();
  const internalLinks = new Set();

  const pageResults = await mapLimit(pagesToAudit, auditConcurrency(), async (url) => {
    stats.pagesAudited += 1;
    return auditPage(url, siteUrl);
  });

  for (const result of pageResults) {
    if (!result) continue;
    stats.canonicalUrlsAudited += result.canonicalAudited ? 1 : 0;
    if (result.title) addToMap(titleMap, result.title.trim(), result.url);
    if (result.description) addToMap(descriptionMap, result.description.trim(), result.url);
    for (const link of result.internalLinks) internalLinks.add(link);
  }

  checkDuplicates("title", titleMap);
  checkDuplicates("description", descriptionMap);
  stats.internalLinksAudited = await auditInternalLinks([...internalLinks], siteUrl, new Set(pagesToAudit.map(normalizePageUrl)));

  const filterUrls = [
    { url: `${siteUrl}/moskva/nasledstvo/?sort=rating`, canonical: `${siteUrl}/moskva/nasledstvo/` },
    { url: `${siteUrl}/moskva/nasledstvo/?price=low`, canonical: `${siteUrl}/moskva/nasledstvo/` },
    { url: `${siteUrl}/moskva/nasledstvo/?online=true`, canonical: `${siteUrl}/moskva/nasledstvo/` },
    { url: `${siteUrl}/moskva/nasledstvo/?page=2`, canonical: `${siteUrl}/moskva/nasledstvo/` },
    { url: `${siteUrl}/search?q=alimenty`, canonical: `${siteUrl}/search/` }
  ];

  for (const { url, canonical } of filterUrls) {
    stats.filterProbes += 1;
    await auditNoindexProbe(url, canonical);
  }

  stats.apiProbes += 1;
  await auditLawyersApiSafety(`${siteUrl}/api/lawyers?city=moskva&service=nasledstvo`);
  stats.adminProbes += 1;
  await auditAdminProtection(`${siteUrl}/admin/`);

  return stats;
}

async function auditRobots(siteUrl) {
  const robotsUrl = `${siteUrl}/robots.txt`;
  let text;
  try {
    text = await fetchText(robotsUrl);
  } catch (error) {
    add("error", robotsUrl, `robots.txt is not available: ${error.message}`);
    return;
  }

  for (const rule of ["/login", "/logout", "/register", "/lk", "/admin", "/search", "?sort=", "?price=", "?online=", "?rating=", "?filter=", "?page=", "?utm_"]) {
    if (!text.includes(rule)) add("error", robotsUrl, `Missing robots rule for ${rule}.`);
  }

  if (!text.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
    add("error", robotsUrl, "robots.txt does not point to the sitemap index for SITE_URL.");
  }
}

async function auditPage(url, siteUrl) {
  let response;
  let html;
  try {
    response = await timedFetch(url, { redirect: "follow" });
    html = await response.text();
  } catch (error) {
    add("error", url, `Cannot fetch page: ${error.message}`);
    return null;
  }

  if (normalizePageUrl(response.url) !== normalizePageUrl(url)) {
    add("error", url, `Sitemap URL redirects to ${response.url}.`);
  }

  if (!response.ok) {
    add("error", url, `Page returned HTTP ${response.status}.`);
    return null;
  }

  const title = textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = attrFromTag(html, "meta", "name", "description", "content");
  const robots = attrFromTag(html, "meta", "name", "robots", "content");
  const canonicals = [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]*>/gi)].map((match) => attr(match[0], "href")).filter(Boolean);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const jsonLdItems = extractJsonLd(html);
  const hasFaqJsonLd = jsonLdItems.some((item) => jsonLdType(item) === "FAQPage" && Array.isArray(item.mainEntity) && item.mainEntity.length >= 3);
  const hasVisibleFaq = html.includes('data-seo-block="faq"');
  const hasCta = html.includes('data-seo-block="cta"');
  const visibleText = stripTags(html).replace(/\s+/g, " ").trim();
  const internalLinks = extractInternalLinks(html, url, siteUrl);

  if (!title) add("error", url, "Missing title.");
  if (!description) add("error", url, "Missing meta description.");
  if (h1Count !== 1) add("error", url, `Expected exactly one H1, found ${h1Count}.`);
  if (canonicals.length !== 1) add("error", url, `Expected exactly one canonical, found ${canonicals.length}.`);
  if (canonicals[0]?.includes("?")) add("error", url, "Canonical contains query parameters.");
  if (canonicals[0] && !samePageUrl(canonicals[0], url)) {
    add("error", url, `Canonical is not self-referential. Got ${canonicals[0]}.`);
  }
  if (robots.toLowerCase().includes("noindex")) add("error", url, "Noindex page appears in sitemap.");
  if (jsonLdItems.length === 0) add("error", url, "Missing JSON-LD.");
  if (!hasFaqJsonLd || !hasVisibleFaq) add("error", url, "Indexable sitemap page must show FAQ and matching FAQPage JSON-LD.");
  if (!hasCta) add("error", url, "Indexable sitemap page has no detectable CTA.");
  if (visibleText.length < 700) add("warning", url, "Visible text is thin for an indexable page.");
  if (internalLinks.length < 3) add("warning", url, "Weak internal linking: fewer than 3 internal links.");

  validateJsonLdAgainstVisibleContent(url, jsonLdItems, visibleText);
  auditAggregatorContactSafety(url, html);

  const canonical = canonicals[0];
  let canonicalAudited = false;
  if (canonical) {
    canonicalAudited = true;
    if (!samePageUrl(canonical, url)) {
      await auditCanonicalTarget(url, canonical, siteUrl);
    }
  }

  return {
    url,
    title,
    description,
    canonicalAudited,
    internalLinks: internalLinks.map((link) => link.url)
  };
}

async function auditCanonicalTarget(pageUrl, canonical, siteUrl) {
  if (!canonical.startsWith(siteUrl)) {
    add("warning", pageUrl, `Canonical points outside SITE_URL: ${canonical}`);
    return;
  }

  const key = normalizePageUrl(canonical);
  if (!canonicalCache.has(key)) {
    try {
      const response = await timedFetch(key, { redirect: "follow" });
      const html = await response.text();
      canonicalCache.set(key, { ok: response.ok, status: response.status, finalUrl: response.url, html });
    } catch (error) {
      canonicalCache.set(key, { ok: false, status: 0, finalUrl: key, html: "", error });
    }
  }

  const result = canonicalCache.get(key);
  if (!result.ok) {
    add("error", pageUrl, `Canonical target is not OK: ${canonical} returned HTTP ${result.status || "network error"}.`);
    return;
  }

  if (normalizePageUrl(result.finalUrl) !== key) {
    add("error", pageUrl, `Canonical target redirects to ${result.finalUrl}.`);
  }

  const robots = attrFromTag(result.html, "meta", "name", "robots", "content").toLowerCase();
  if (robots.includes("noindex")) {
    add("error", pageUrl, `Canonical target is noindex: ${canonical}.`);
  }
}

function validateJsonLdAgainstVisibleContent(url, items, visibleText) {
  for (const item of items) {
    const type = jsonLdType(item);
    if (type === "FAQPage") {
      for (const question of item.mainEntity ?? []) {
        if (question?.name && !visibleText.includes(String(question.name))) {
          add("error", url, `FAQPage JSON-LD question is not visible: ${question.name}`);
        }
      }
    }

    const label = item?.name || item?.headline || item?.title;
    if (["Article", "Question", "VideoObject", "Person", "LegalService"].includes(type) && label && !visibleText.includes(String(label))) {
      add("warning", url, `${type} JSON-LD label is not clearly visible: ${label}`);
    }
  }
}

function auditAggregatorContactSafety(url, html) {
  const platformPhone = (process.env.NEXT_PUBLIC_PLATFORM_PHONE || envValue("NEXT_PUBLIC_PLATFORM_PHONE") || "").replace(/[^\d+]/g, "");
  const platformEmail = (process.env.NEXT_PUBLIC_PLATFORM_EMAIL || envValue("NEXT_PUBLIC_PLATFORM_EMAIL") || "suport@pravopoisk.ru").toLowerCase();
  const telLinks = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map((match) => match[1].replace(/[^\d+]/g, ""));
  const mailLinks = [...html.matchAll(/href=["']mailto:([^"']+)["']/gi)].map((match) => match[1].toLowerCase());

  for (const phone of telLinks) {
    if (!platformPhone || phone !== platformPhone) {
      add("error", url, `Public page exposes a non-platform phone link: tel:${phone}.`);
    }
  }

  for (const email of mailLinks) {
    if (email !== platformEmail) {
      add("error", url, `Public page exposes a non-platform email link: mailto:${email}.`);
    }
  }

  if (/\b(?:wa\.me|t\.me|telegram\.me|vk\.com)\//i.test(html)) {
    add("error", url, "Public page exposes a personal messenger or social link.");
  }

  if (/\+7\s*495\s*100|lawyer\d+@example\.ru|mailto:lawyer/i.test(html)) {
    add("error", url, "Public page contains seeded lawyer contact data.");
  }
}

async function auditLawyersApiSafety(url) {
  let response;
  let text;
  let data;

  try {
    response = await timedFetch(url, { redirect: "follow" });
    text = await response.text();
    data = JSON.parse(text);
  } catch (error) {
    add("error", url, `Cannot audit public lawyers API: ${error.message}`);
    return;
  }

  if (!response.ok) {
    add("error", url, `Public lawyers API returned HTTP ${response.status}.`);
    return;
  }

  if (!data?.ok || !Array.isArray(data.items)) {
    add("error", url, "Public lawyers API does not return the expected safe list shape.");
    return;
  }

  if (!String(data.canonicalPolicy ?? "").toLowerCase().includes("noindex")) {
    add("warning", url, "Public lawyers API does not describe noindex policy for filtered URLs.");
  }

  for (const item of data.items) {
    for (const key of ["phone", "whatsapp", "telegram", "email", "site", "socials", "contacts"]) {
      if (Object.hasOwn(item, key)) {
        add("error", url, `Public lawyers API exposes forbidden contact key: ${key}.`);
      }
    }
  }

  if (/\+7\s*495\s*100|\+7495100|lawyer\d+@example\.ru|wa\.me|t\.me|telegram\.me|vk\.com|mailto:lawyer/i.test(text)) {
    add("error", url, "Public lawyers API exposes seeded lawyer contact data or direct messenger links.");
  }
}

async function auditAdminProtection(url) {
  let response;

  try {
    response = await timedFetch(url, { redirect: "manual" });
  } catch (error) {
    add("error", url, `Cannot audit admin protection: ${error.message}`);
    return;
  }

  if (![307, 308].includes(response.status)) {
    add("error", url, `Admin route is not protected. Expected redirect to /login/ without session, got ${response.status}.`);
  }

  const location = response.headers.get("location") ?? "";
  if (!location.includes("/login/")) {
    add("error", url, `Admin route must redirect unauthorized users to /login/. Got ${location || "missing location"}.`);
  }

  const robots = response.headers.get("x-robots-tag") ?? "";
  if (!robots.toLowerCase().includes("noindex")) {
    add("error", url, "Unauthorized admin response must be noindex.");
  }

  await auditAuthorizedAdmin(url);
}

async function auditAuthorizedAdmin(url) {
  const cookie = await createAuditAdminCookie();
  let response;
  let html;

  try {
    response = await timedFetch(url, {
      redirect: "manual",
      headers: {
        cookie
      }
    });
    html = await response.text();
  } catch (error) {
    add("error", url, `Cannot audit authorized admin response: ${error.message}`);
    return;
  }

  if (response.status !== 200) {
    add("error", url, `Admin route does not accept a valid signed ADMIN session cookie. Got HTTP ${response.status}.`);
    return;
  }

  const robots = attrFromTag(html, "meta", "name", "robots", "content").toLowerCase();
  if (!robots.includes("noindex")) {
    add("error", url, "Authorized admin page must render meta robots noindex.");
  }
}

async function createAuditAdminCookie() {
  const email = process.env.ADMIN_EMAIL || envValue("ADMIN_EMAIL") || "admin@example.ru";
  let sub = "user-admin";

  if (process.env.DATABASE_URL || envValue("DATABASE_URL")) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
      await prisma.$disconnect();

      if (user?.role === "ADMIN") {
        sub = user.id;
      } else {
        add("error", "database", `Configured ADMIN_EMAIL does not belong to an ADMIN user: ${email}.`);
      }
    } catch (error) {
      add("warning", "database", `Cannot resolve admin user for auth audit: ${error.message}`);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({ sub, email, role: "ADMIN", iat: now, exp: now + 60 * 10 });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", process.env.JWT_SECRET || envValue("JWT_SECRET") || "change-me-in-production")
    .update(unsignedToken)
    .digest("base64url");

  return `legal_admin_session=${unsignedToken}.${signature}`;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

async function auditInternalLinks(urls, siteUrl, alreadyAudited = new Set()) {
  const maxLinks = Number(process.env.SEO_AUDIT_MAX_INTERNAL_LINKS || envValue("SEO_AUDIT_MAX_INTERNAL_LINKS") || 250);
  const queue = unique(urls)
    .map(normalizePageUrl)
    .filter((url) => url.startsWith(siteUrl) && !alreadyAudited.has(url))
    .slice(0, maxLinks);

  await mapLimit(queue, auditConcurrency(), async (url) => {
    try {
      const response = await timedFetch(url, { redirect: "follow" });
      if (response.status >= 400) add("error", url, `Broken internal link returned HTTP ${response.status}.`);
    } catch (error) {
      add("error", url, `Cannot fetch internal link: ${error.message}`);
    }
  });

  return queue.length;
}

async function auditNoindexProbe(url, expectedCanonical) {
  let html;
  let response;
  try {
    response = await timedFetch(url, { redirect: "follow" });
    html = await response.text();
  } catch (error) {
    add("warning", url, `Cannot fetch noindex probe: ${error.message}`);
    return;
  }

  if (!response.ok && !url.includes("/search")) {
    add("warning", url, `Noindex probe returned HTTP ${response.status}.`);
    return;
  }

  const robots = attrFromTag(html, "meta", "name", "robots", "content").toLowerCase();
  const canonical = attrFromTag(html, "link", "rel", "canonical", "href");

  if (!robots.includes("noindex")) add("error", url, "Filter or pagination URL is not noindex.");
  if (canonical !== expectedCanonical) {
    add("error", url, `Filter canonical mismatch. Expected ${expectedCanonical}, got ${canonical || "missing"}.`);
  }
}

async function runDatabaseAudit(siteUrl, sitemapUrls) {
  const stats = { databaseEntitiesAudited: 0 };
  if (!process.env.DATABASE_URL && !envValue("DATABASE_URL")) return stats;

  let PrismaClient;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch (error) {
    add("warning", "database", `Database audit skipped: ${error.message}`);
    return stats;
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();

    const [
      seoPages,
      articles,
      questions,
      documents,
      calculators,
      cases,
      checklists,
      videos,
      scenarios
    ] = await Promise.all([
      prisma.seoPage.findMany(),
      prisma.article.findMany({ include: { legalSources: true } }),
      prisma.question.findMany({ include: { answers: true } }),
      prisma.documentTemplate.findMany(),
      prisma.calculator.findMany(),
      prisma.case.findMany(),
      prisma.checklist.findMany(),
      prisma.videoPage.findMany(),
      prisma.legalScenario.findMany()
    ]);

    stats.databaseEntitiesAudited =
      seoPages.length + articles.length + questions.length + documents.length + calculators.length + cases.length + checklists.length + videos.length + scenarios.length;

    auditSeoPages(seoPages, siteUrl);
    const qualityByUrl = new Map();

    for (const page of seoPages) {
      if (page.canonical) {
        qualityByUrl.set(normalizePageUrl(resolveUrl(page.canonical, siteUrl)), {
          isIndexable: page.isIndexable,
          seoScore: page.seoScore,
          seoMaturity: page.seoMaturity,
          robots: page.robots,
          source: `SeoPage:${page.type}:${page.slug}`
        });
      }
    }

    for (const article of articles) {
      const url = normalizePageUrl(`${siteUrl}/blog/${article.slug}/`);
      qualityByUrl.set(url, {
        isIndexable: article.isIndexable,
        seoScore: articleQualityScore(article),
        seoMaturity: article.publishedAt && article.contentFreshness !== "OUTDATED" ? "READY_FOR_INDEX" : "DRAFT",
        freshness: article.contentFreshness,
        source: `Article:${article.slug}`
      });
      if (article.isIndexable) auditArticleQuality(article, url);
    }

    for (const question of questions) {
      const approvedAnswers = question.answers.filter((answer) => answer.isModerated && answer.qualityStatus === "APPROVED" && answer.answerQualityScore >= 60);
      const url = normalizePageUrl(`${siteUrl}/questions/${question.slug}/`);
      qualityByUrl.set(url, {
        isIndexable: question.isIndexable && question.qualityStatus === "APPROVED" && !question.isDuplicate && approvedAnswers.length >= 1,
        seoScore: questionQualityScore(question, approvedAnswers),
        seoMaturity: question.isIndexable && question.qualityStatus === "APPROVED" ? "READY_FOR_INDEX" : "DRAFT",
        ugc: true,
        source: `Question:${question.slug}`
      });
      if (question.isIndexable) auditQuestionQuality(question, approvedAnswers, url);
    }

    for (const document of documents) addQuality(qualityByUrl, `${siteUrl}/documents/${document.slug}/`, document, `Document:${document.slug}`);
    for (const calculator of calculators) addQuality(qualityByUrl, `${siteUrl}/calculators/${calculator.slug}/`, calculator, `Calculator:${calculator.slug}`);
    for (const caseItem of cases) addQuality(qualityByUrl, `${siteUrl}/cases/${caseItem.slug}/`, caseItem, `Case:${caseItem.slug}`);
    for (const checklist of checklists) addQuality(qualityByUrl, `${siteUrl}/checklist/${checklist.slug}/`, checklist, `Checklist:${checklist.slug}`);
    for (const video of videos) addQuality(qualityByUrl, `${siteUrl}/video/${video.slug}/`, video, `VideoPage:${video.slug}`);
    for (const scenario of scenarios) addQuality(qualityByUrl, `${siteUrl}/chto-delat-esli/${scenario.slug}/`, scenario, `LegalScenario:${scenario.slug}`);

    for (const sitemapUrl of sitemapUrls) {
      const quality = qualityByUrl.get(normalizePageUrl(sitemapUrl));
      if (!quality) continue;
      if (!quality.isIndexable) add("error", sitemapUrl, `${quality.source} is in sitemap but isIndexable/quality gate is false.`);
      if ((quality.seoScore ?? 0) < 70) add("error", sitemapUrl, `${quality.source} is in sitemap with seoScore < 70.`);
      if (!["READY_FOR_INDEX", "INDEXED"].includes(quality.seoMaturity)) add("error", sitemapUrl, `${quality.source} is in sitemap with seoMaturity=${quality.seoMaturity}.`);
      if (String(quality.robots ?? "").toLowerCase().includes("noindex")) add("error", sitemapUrl, `${quality.source} is in sitemap but robots is noindex.`);
      if (quality.freshness === "OUTDATED") add("error", sitemapUrl, `${quality.source} is OUTDATED but appears in sitemap.`);
    }
  } catch (error) {
    add("warning", "database", `Database audit skipped: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

function auditSeoPages(pages, siteUrl) {
  const titleMap = new Map();
  const descriptionMap = new Map();
  const keywordMap = new Map();

  for (const page of pages.filter((item) => item.isIndexable)) {
    const label = `SeoPage:${page.type}:${page.slug}`;
    if (!page.title) add("error", label, "Indexable SeoPage has no title.");
    if (!page.description) add("error", label, "Indexable SeoPage has no description.");
    if (!page.h1) add("error", label, "Indexable SeoPage has no H1.");
    if (!page.seoText || page.seoText.trim().length < 180) add("error", label, "Indexable SeoPage has weak seoText.");
    if (!page.canonical) add("error", label, "Indexable SeoPage has no canonical.");
    if (page.seoScore < 70) add("error", label, "Indexable SeoPage has seoScore < 70.");
    if (!["READY_FOR_INDEX", "INDEXED"].includes(page.seoMaturity)) add("error", label, `Indexable SeoPage has seoMaturity=${page.seoMaturity}.`);
    if (String(page.robots ?? "").toLowerCase().includes("noindex")) add("error", label, "Indexable SeoPage has robots noindex.");
    if (page.canonical && !resolveUrl(page.canonical, siteUrl).startsWith(siteUrl)) add("error", label, "SeoPage canonical points outside SITE_URL.");
    if (page.title) addToMap(titleMap, page.title.trim(), label);
    if (page.description) addToMap(descriptionMap, page.description.trim(), label);
    if (page.primaryKeyword) addToMap(keywordMap, page.primaryKeyword.trim().toLowerCase(), label);
  }

  checkDuplicates("SeoPage title", titleMap);
  checkDuplicates("SeoPage description", descriptionMap);
  checkDuplicates("primaryKeyword", keywordMap);
}

function auditArticleQuality(article, url) {
  if (!article.publishedAt) add("error", url, "Indexable article is not published.");
  if (article.contentFreshness === "OUTDATED") add("error", url, "Indexable article is OUTDATED.");
  if (!article.serviceId) add("error", url, "Indexable article has no service link.");
  if (!article.authorId) add("error", url, "Indexable article has no author.");
  if (!article.content || article.content.trim().length < 300) add("error", url, "Indexable article content is too thin.");
}

function auditQuestionQuality(question, approvedAnswers, url) {
  if (question.qualityStatus !== "APPROVED") add("error", url, "Indexable question is not APPROVED.");
  if (question.isDuplicate) add("error", url, "Duplicate question is indexable.");
  if (!question.serviceId) add("error", url, "Indexable question has no service.");
  if (!question.summary) add("error", url, "Indexable question has no summary.");
  if (question.text.trim().length < 80) add("error", url, "Indexable question text is too short.");
  if (approvedAnswers.length < 1) add("error", url, "Indexable question has no moderated high-quality answer.");
}

function addQuality(map, url, entity, source) {
  map.set(normalizePageUrl(url), {
    isIndexable: entity.isIndexable,
    seoScore: entity.seoScore,
    seoMaturity: entity.seoMaturity,
    source
  });
}

function articleQualityScore(article) {
  return (
    (article.title ? 10 : 0) +
    (article.excerpt ? 10 : 0) +
    (article.content ? 10 : 0) +
    ((article.content?.trim().length ?? 0) >= 300 ? 10 : 0) +
    (article.authorId ? 10 : 0) +
    (article.publishedAt ? 10 : 0) +
    (article.updatedAt ? 10 : 0) +
    (article.serviceId ? 10 : 0) +
    (article.contentFreshness !== "OUTDATED" ? 10 : 0) +
    (article.legalSources?.length ? 10 : 0)
  );
}

function questionQualityScore(question, approvedAnswers) {
  return (
    (question.title?.trim().length >= 20 ? 15 : 0) +
    (question.text?.trim().length >= 80 ? 15 : 0) +
    (question.summary ? 15 : 0) +
    (question.serviceId ? 15 : 0) +
    (question.qualityStatus === "APPROVED" ? 15 : 0) +
    (!question.isDuplicate ? 10 : 0) +
    (approvedAnswers.length >= 1 ? 15 : 0)
  );
}

function read(file) {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function checkContains(source, needle, page, message) {
  if (!source.includes(needle)) add("error", page, message);
}

function count(source, needle) {
  return source.split(needle).length - 1;
}

function add(severity, page, message) {
  issues.push({ severity, page, message });
}

function normalizeSiteUrl(value) {
  return String(value).replace(/\/+$/, "");
}

function normalizePageUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  return url.toString();
}

function samePageUrl(left, right) {
  return normalizePageUrl(left) === normalizePageUrl(right);
}

function resolveUrl(pathOrUrl, siteUrl) {
  return new URL(pathOrUrl, siteUrl).toString();
}

function envValue(key) {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return "";
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((row) => row.trim().startsWith(`${key}=`));
  return line ? line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") : "";
}

async function fetchText(url) {
  const response = await timedFetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.SEO_AUDIT_FETCH_TIMEOUT_MS || envValue("SEO_AUDIT_FETCH_TIMEOUT_MS") || 30000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function auditConcurrency() {
  return Number(process.env.SEO_AUDIT_CONCURRENCY || envValue("SEO_AUDIT_CONCURRENCY") || 8);
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const current = nextIndex;
        nextIndex += 1;
        results[current] = await worker(items[current], current);
      }
    })
  );

  return results;
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => decodeEntities(match[1].trim()));
}

function extractJsonLd(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const items = [];

  for (const script of scripts) {
    try {
      const value = JSON.parse(decodeEntities(script[1].trim()));
      if (Array.isArray(value)) items.push(...value);
      else if (value?.["@graph"]) items.push(...value["@graph"]);
      else items.push(value);
    } catch {
      add("error", "JSON-LD", "Invalid JSON-LD script found.");
    }
  }

  return items;
}

function jsonLdType(item) {
  const value = item?.["@type"];
  return Array.isArray(value) ? value[0] : String(value ?? "");
}

function extractInternalLinks(html, baseUrl, siteUrl) {
  const links = [];
  const siteOrigin = new URL(siteUrl).origin;
  const matches = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)];

  for (const match of matches) {
    const href = decodeEntities(match[1]);
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;

    let parsed;
    try {
      parsed = new URL(href, baseUrl);
    } catch {
      continue;
    }

    if (parsed.origin !== siteOrigin) continue;
    if (parsed.pathname.startsWith("/_next") || parsed.pathname.startsWith("/api/")) continue;
    if (/\.(png|jpe?g|webp|avif|svg|css|js|ico|xml|txt|pdf|zip)$/i.test(parsed.pathname)) continue;

    if (parsed.search && hasBlockingSearch(parsed.search)) {
      add("error", baseUrl, `Crawlable internal link exposes blocked query params: ${parsed.pathname}${parsed.search}`);
    }

    links.push({ url: normalizePageUrl(parsed.toString()) });
  }

  return unique(links.map((link) => link.url)).map((url) => ({ url }));
}

function hasBlockingSearch(search) {
  const params = new URLSearchParams(search);
  for (const key of params.keys()) {
    if (["sort", "price", "online", "rating", "filter", "page", "utm_"].some((item) => key === item || key.startsWith(item))) return true;
  }
  return false;
}

function textBetween(html, regex) {
  const match = html.match(regex);
  return match ? decodeEntities(stripTags(match[1]).trim()) : "";
}

function attrFromTag(html, tag, markerAttr, markerValue, targetAttr) {
  const regex = new RegExp(`<${tag}[^>]+${markerAttr}=["']${escapeRegex(markerValue)}["'][^>]*>`, "i");
  const match = html.match(regex);
  return match ? decodeEntities(attr(match[0], targetAttr) || "") : "";
}

function attr(tagHtml, name) {
  const regex = new RegExp(`${name}=["']([^"']+)["']`, "i");
  const match = tagHtml.match(regex);
  return match ? match[1] : "";
}

function stripTags(value) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values) {
  return [...new Set(values)];
}

function addToMap(map, value, url) {
  map.set(value, [...(map.get(value) || []), url]);
}

function checkDuplicates(kind, map) {
  for (const [value, urls] of map.entries()) {
    if (urls.length > 1) {
      add("error", urls.join(", "), `Duplicate ${kind}: ${value}`);
    }
  }
}
