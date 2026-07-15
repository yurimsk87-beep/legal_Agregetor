import { prisma } from "./prisma";
import { HARANT_QUESTION_CATEGORIES } from "./harant-question-categories";
import { cleanPublicCopy, cleanPublicFaq } from "./public-copy";
import { getIndexableQuestionWhere, getPublicAnswerWhere, getPublicQuestionWhere } from "./qna-publication-rules";
import {
  articles,
  calculators,
  cases,
  checklists,
  cities,
  documentTemplates,
  faqItems,
  getFullName,
  legalScenarios,
  lawyers,
  nextBestActions,
  questions,
  seoPages,
  services,
  staticPages,
  videoPages
} from "./sample-data";
import type {
  Article,
  Calculator,
  CaseItem,
  City,
  DocumentTemplate,
  FaqEntityType,
  FaqItem,
  LegalChecklist,
  LegalScenario,
  LegalSource,
  Lawyer,
  NextBestAction,
  Question,
  SeoPage,
  Service,
  StaticPage,
  VideoPage
} from "./types";
import {
  canIndexCityServicePage,
  canIndexLawyerListingPage,
  canIndexLawyerProfilePage,
  canIndexQuestionPage,
  isIndexableQuestionAnswer
} from "./seo";

type LawyerFilters = {
  citySlug?: string;
  serviceSlug?: string;
  status?: string;
  online?: boolean;
  price?: string;
  take?: number;
};

type CityServiceIndexabilityInput = Parameters<typeof canIndexCityServicePage>[0];

const DEFAULT_LAWYERS_TAKE = 60;
const MAX_LAWYERS_TAKE = 500;

let databaseFallbackUntil = 0;
const loggedRepositoryFallbacks = new Set<string>();

async function withFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  const context = getRepositoryFallbackContext();

  if (!process.env.DATABASE_URL) {
    warnMissingDatabaseUrl(context);
    return fallback;
  }
  if (Date.now() < databaseFallbackUntil) return fallback;

  try {
    return await withDatabaseTimeout(query());
  } catch (error) {
    databaseFallbackUntil = Date.now() + databaseRetryDelayMs();
    warnRepositoryFallback(context, error);
    return fallback;
  }
}

async function withDatabaseTimeout<T>(query: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      query,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Database query timeout")), databaseQueryTimeoutMs());
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function databaseQueryTimeoutMs() {
  const configuredTimeout = Number(process.env.REPOSITORY_QUERY_TIMEOUT_MS);
  if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) return configuredTimeout;

  return isProductionBuild() ? 5_000 : 1_500;
}

function databaseRetryDelayMs() {
  const configuredRetryDelay = Number(process.env.REPOSITORY_DB_RETRY_DELAY_MS);
  if (Number.isFinite(configuredRetryDelay) && configuredRetryDelay > 0) return configuredRetryDelay;

  return 30_000;
}

function isProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";
}

function getRepositoryFallbackContext() {
  const stack = new Error().stack ?? "";
  const skippedFunctions = new Set(["getRepositoryFallbackContext", "withFallback"]);

  for (const line of stack.split("\n")) {
    const match = line.match(/\bat (?:async )?([A-Za-z0-9_$.[\]]+)/);
    const functionName = match?.[1]?.replace(/^Object\./, "");

    if (!functionName || skippedFunctions.has(functionName) || functionName.includes("<anonymous>")) continue;

    return functionName;
  }

  return "unknown";
}

function warnMissingDatabaseUrl(context: string) {
  if (process.env.NODE_ENV !== "production") return;

  const key = `${context}:missing-database-url`;
  if (loggedRepositoryFallbacks.has(key)) return;
  loggedRepositoryFallbacks.add(key);

  console.error(`[repositories:${context}] DATABASE_URL is missing. Fallback data used.`);
}

function warnRepositoryFallback(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") return;

  const reason = isDatabaseTimeoutError(error) ? "timeout" : "error";
  const phase = isProductionBuild() ? " during build" : "";
  const key = `${context}:${reason}:${phase}`;
  if (loggedRepositoryFallbacks.has(key)) return;
  loggedRepositoryFallbacks.add(key);

  if (reason === "timeout") {
    console.warn(`[repositories:${context}] Database query timeout${phase}. Fallback data used.`);
    return;
  }

  console.error(`[repositories:${context}] Database query failed${phase}. Fallback data used.`, error);
}

function isDatabaseTimeoutError(error: unknown) {
  return error instanceof Error && error.message === "Database query timeout";
}

const sampleLawyerSlugPrefixes = ["demo-lawyer", "sample-lawyer"];
const sampleLawyerUserIdPrefixes = ["demo-lawyer-", "sample-lawyer-"];

function isProductionHiddenSampleLawyer(lawyer: Pick<Lawyer, "slug"> & { userId?: string | null }) {
  return (
    sampleLawyerSlugPrefixes.some((prefix) => lawyer.slug.startsWith(prefix)) ||
    sampleLawyerUserIdPrefixes.some((prefix) => lawyer.userId?.startsWith(prefix))
  );
}

function isPublicAnswer(answer: Question["answers"][number]) {
  return isIndexableQuestionAnswer(answer);
}

function isPublicQuestion(question: Question) {
  const qualityStatus = question.qualityStatus ?? question.moderationStatus;
  return question.status === "PUBLISHED" && qualityStatus === "APPROVED";
}

function toPublicQuestion(question: Question) {
  return {
    ...question,
    answers: question.answers.filter(isPublicAnswer)
  };
}

export async function getCities() {
  const fallback = process.env.NODE_ENV === "production" ? [] : cities;

  return withFallback(
    async () =>
      (await prisma.city.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
      })).map(mapCity),
    fallback
  );
}

export async function getCity(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : cities.find((city) => city.slug === slug) ?? null;

  return withFallback(
    async () => {
      const city = await prisma.city.findUnique({ where: { slug } });
      return city ? mapCity(city) : null;
    },
    fallback
  );
}

export async function getServices() {
  const fallback = process.env.NODE_ENV === "production" ? [] : services;

  return withFallback(
    async () =>
      (await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
      })).map(mapService),
    fallback
  );
}

export async function getLawyerSpecializationServices() {
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : services
          .filter((service) => service.isActive && service.parentId == null)
          .filter((service) => lawyers.some((lawyer) => lawyer.services.some((lawyerService) => lawyerService.id === service.id)))
          .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return withFallback(
    async () =>
      (
        await prisma.service.findMany({
          where: {
            isActive: true,
            parentId: null,
            lawyers: { some: {} }
          },
          orderBy: { name: "asc" }
        })
      ).map(mapService),
    fallback
  );
}

export function isServiceLinkable(service: Pick<Service, "isActive" | "parentId">) {
  return service.isActive && service.parentId == null;
}

export function getPublicServiceLinks(serviceRows: Service[]) {
  return serviceRows.filter(isServiceLinkable);
}

export async function getService(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : services.find((service) => service.slug === slug) ?? null;

  return withFallback(
    async () => {
      const service = await prisma.service.findUnique({ where: { slug } });
      return service ? mapService(service) : null;
    },
    fallback
  );
}

export async function getStaticPage(slug: string): Promise<StaticPage | null> {
  return getDevelopmentStaticPages().find((page) => page.slug === slug) ?? null;
}

function getDevelopmentStaticPages() {
  return process.env.NODE_ENV === "production" ? [] : staticPages;
}

export async function getSeoPage(type: SeoPage["type"], slug: string) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? null
      : seoPages.find((page) => page.type === type && page.slug === slug.replace(/^\/|\/$/g, "")) ?? null;

  return withFallback(
    async () => {
      const page = await prisma.seoPage.findUnique({
        where: { type_slug: { type, slug: slug.replace(/^\/|\/$/g, "") } }
      });
      return page ? mapSeoPage(page) : null;
    },
    fallback
  );
}

export async function getSeoMerge(path: string) {
  const cleanPath = normalizeMergePath(path);

  return withFallback(
    async () => {
      const merge = await prisma.seoMerge.findFirst({ where: { oldUrl: cleanPath } });
      return merge
        ? {
            oldUrl: merge.oldUrl,
            newUrl: merge.newUrl,
            reason: merge.reason,
            redirectType: String(merge.redirectType) as "REDIRECT_301" | "GONE_410" | "NOINDEX"
          }
        : null;
    },
    null
  );
}

function normalizeMergePath(path: string) {
  const withoutQuery = path.split("?")[0] || "/";
  if (withoutQuery === "/") return "/";
  return `/${withoutQuery.replace(/^\/+|\/+$/g, "")}/`;
}

export async function getFaqs(entityType: FaqEntityType, entityId?: string | null) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : faqItems
          .filter((item) => item.entityType === entityType && (entityId ? item.entityId === entityId : true))
          .sort((a, b) => a.sortOrder - b.sortOrder);

  return withFallback(
    async () =>
      (await prisma.faqItem.findMany({
        where: { entityType, entityId: entityId ?? null },
        orderBy: { sortOrder: "asc" }
      })).map(mapFaq),
    fallback
  );
}

export async function getLawyers(filters: LawyerFilters = {}) {
  const take = normalizeLawyerTake(filters.take);
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : filterLawyers(lawyers, filters)
          .filter((lawyer) => !isProductionHiddenSampleLawyer(lawyer))
          .slice(0, take)
          .map(sanitizePublicLawyer);

  return withFallback(
    async () => {
      const rows = await prisma.lawyer.findMany({
        where: {
          active: true,
          blocked: false,
          profileStatus: "APPROVED",
          // Exclude dev/sample lawyers at the query level. They are verified seed
          // profiles that rank first, so post-pagination filtering would let them
          // crowd real lawyers out of `take` and return an empty public list.
          NOT: sampleLawyerSlugPrefixes.map((prefix) => ({ slug: { startsWith: prefix } })),
          status: filters.status === "ADVOCATE" ? "ADVOCATE" : filters.status === "LAWYER" ? "LAWYER" : undefined,
          cities: filters.citySlug
            ? {
                some: {
                  city: {
                    slug: filters.citySlug
                  }
                }
              }
            : undefined,
          services: filters.serviceSlug
            ? {
                some: {
                  service: {
                    slug: filters.serviceSlug
                  }
                }
              }
            : undefined
        },
        include: lawyerInclude(),
        orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        take
      });

      return rows.map(mapLawyer).filter((lawyer) => !isProductionHiddenSampleLawyer(lawyer)).map(sanitizePublicLawyer);
    },
    fallback
  );
}

export async function getLawyer(slug: string) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? null
      : sanitizeNullablePublicLawyer(lawyers.find((lawyer) => lawyer.slug === slug && !isProductionHiddenSampleLawyer(lawyer)) ?? null);

  return withFallback(
    async () => {
      const row = await prisma.lawyer.findUnique({
        where: { slug },
        include: lawyerInclude()
      });

      if (!row || !row.active || row.blocked || row.profileStatus !== "APPROVED") return null;
      const lawyer = mapLawyer(row);
      if (isProductionHiddenSampleLawyer(lawyer)) return null;
      return sanitizeNullablePublicLawyer(lawyer);
    },
    fallback
  );
}

export async function getArticles(serviceId?: string) {
  const fallback = process.env.NODE_ENV === "production" ? [] : articles.filter((article) => (serviceId ? article.serviceId === serviceId : true));

  return withFallback(
    async () => {
      const rows = await prisma.article.findMany({
        where: {
          isIndexable: true,
          status: "APPROVED",
          publishedAt: { not: null },
          serviceId
        },
        include: {
          service: true,
          city: true,
          author: true,
          reviewedBy: true,
          legalSources: { include: { source: true } }
        },
        orderBy: { publishedAt: "desc" },
        take: 24
      });

      return rows.map(mapArticle);
    },
    fallback
  );
}

export async function getArticle(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : articles.find((article) => article.slug === slug) ?? null;

  return withFallback(
    async () => {
      const row = await prisma.article.findUnique({
        where: { slug },
        include: {
          service: true,
          city: true,
          author: true,
          reviewedBy: true,
          legalSources: { include: { source: true } }
        }
      });

      return row ? mapArticle(row) : null;
    },
    fallback
  );
}

export async function getQuestions(serviceId?: string, cityId?: string, options: { skip?: number; take?: number; serviceIds?: string[] } = {}) {
  const skip = Math.max(0, options.skip ?? 0);
  const take = Math.min(Math.max(1, options.take ?? 24), 60);
  const serviceIds = "serviceIds" in options && Array.isArray(options.serviceIds) ? options.serviceIds : undefined;
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : questions
          .filter((question) => (serviceIds?.length ? question.serviceId && serviceIds.includes(question.serviceId) : serviceId ? question.serviceId === serviceId : true))
          .filter((question) => (cityId ? question.cityId === cityId : true))
          .filter(isPublicQuestion)
          .slice(skip, skip + take)
          .map(toPublicQuestion);

  return withFallback(
    async () => {
      const rows = await prisma.question.findMany({
        where: {
          serviceId: serviceIds?.length ? { in: serviceIds } : serviceId,
          cityId,
          ...getPublicQuestionWhere()
        },
        include: {
          city: true,
          service: true,
          reports: {
            where: { status: { in: ["NEW", "IN_REVIEW"] } },
            select: { id: true }
          },
          answers: {
            include: { lawyer: true },
            where: getPublicAnswerWhere()
          }
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take
      });

      return rows.map(mapQuestion).map(toPublicQuestion);
    },
    fallback
  );
}

// Candidate pool for the "Похожие вопросы" block: public questions whose title
// or text contains any of the given phrases. Lets the scorer rank relevant
// questions from the whole DB instead of an arbitrary recent window.
export async function getQuestionsMatchingPhrases(phrases: string[], take = 200) {
  // Title-only match: scanning the large `text` column with many ILIKEs over the
  // full question base is too slow (trips the repository query-timeout breaker).
  // Title carries the topic for relevant questions; full text is still used by
  // the scorer when ranking the fetched candidates.
  const terms = [...new Set(phrases.map((phrase) => phrase.trim().toLowerCase()).filter((phrase) => phrase.length >= 4))].slice(0, 20);
  if (!terms.length) return [];

  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : questions
          .filter(isPublicQuestion)
          .filter((question) => {
            const haystack = `${question.title} ${question.summary ?? ""} ${(question.tags ?? []).join(" ")}`.toLowerCase();
            return terms.some((term) => haystack.includes(term));
          })
          .slice(0, take)
          .map(toPublicQuestion);

  return withFallback(async () => {
    const rows = await prisma.question.findMany({
      where: {
        ...getPublicQuestionWhere(),
        OR: terms.map((term) => ({ title: { contains: term, mode: "insensitive" as const } }))
      },
      include: {
        city: true,
        service: true,
        reports: {
          where: { status: { in: ["NEW", "IN_REVIEW"] } },
          select: { id: true }
        },
        answers: {
          include: { lawyer: true },
          where: getPublicAnswerWhere()
        }
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take
    });

    return rows.map(mapQuestion).map(toPublicQuestion);
  }, fallback);
}

// Значимые слова запроса для поиска по вопросам: отбрасываем служебные слова и
// слишком короткие токены, чтобы многословные запросы («уволили без причины»)
// находили вопросы по ключевым словам, а не только по точному вхождению всей фразы.
const QUESTION_SEARCH_STOPWORDS = new Set([
  "без", "для", "или", "над", "под", "про", "что", "как", "так", "это", "эта", "эти",
  "все", "нет", "при", "она", "они", "его", "ему", "уже", "чем", "кто", "где"
]);

function getQuestionSearchTerms(term: string): string[] {
  const words = Array.from(
    new Set(term.split(/[^a-zа-яё0-9]+/i).filter((word) => word.length >= 3 && !QUESTION_SEARCH_STOPWORDS.has(word)))
  );
  return words.length ? words : [term];
}

// Full-text-ish search over public questions by title (fast, indexable substring).
// Used by the questions page search box ("поиск по вопросам").
export async function searchPublicQuestions(query: string, options: { skip?: number; take?: number } = {}) {
  const term = query.trim().toLowerCase();
  const skip = Math.max(0, options.skip ?? 0);
  const take = Math.min(Math.max(1, options.take ?? 24), 48);
  if (term.length < 2) return [];

  // Многословный запрос ищем по ключевым словам (OR), иначе блок «похожие вопросы»
  // пустует для естественных фраз. Однословный запрос ведёт себя как раньше.
  const terms = getQuestionSearchTerms(term);

  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : questions
          .filter(isPublicQuestion)
          .filter((question) => {
            const haystack = `${question.title} ${question.summary ?? ""}`.toLowerCase();
            return terms.some((word) => haystack.includes(word));
          })
          .slice(skip, skip + take)
          .map(toPublicQuestion);

  return withFallback(
    async () => {
      const rows = await prisma.question.findMany({
        where: {
          ...getPublicQuestionWhere(),
          OR: terms.map((word) => ({ title: { contains: word, mode: "insensitive" } }))
        },
        include: {
          city: true,
          service: true,
          reports: { where: { status: { in: ["NEW", "IN_REVIEW"] } }, select: { id: true } },
          answers: { include: { lawyer: true }, where: getPublicAnswerWhere() }
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take
      });

      return rows.map(mapQuestion).map(toPublicQuestion);
    },
    fallback
  );
}

export async function getQuestionPublicStats() {
  const fallback = {
    questionsCount: questions.filter(isPublicQuestion).length,
    answersCount: questions.filter(isPublicQuestion).reduce((sum, question) => sum + toPublicQuestion(question).answers.length, 0),
    lawyersOnlineCount: 35,
    averageAnswerTimeMinutes: 5
  };

  return withFallback(
    async () => {
      const [questionsCount, answersCount] = await Promise.all([
        prisma.question.count({ where: getPublicQuestionWhere() }),
        prisma.answer.count({ where: getPublicAnswerWhere() })
      ]);

      return {
        questionsCount,
        answersCount,
        lawyersOnlineCount: 35,
        averageAnswerTimeMinutes: 5
      };
    },
    fallback
  );
}

export async function getQuestionCategoryStats() {
  const fallbackCounts = new Map<string, number>();
  for (const question of questions.filter(isPublicQuestion)) {
    if (!question.serviceId) continue;
    fallbackCounts.set(question.serviceId, (fallbackCounts.get(question.serviceId) ?? 0) + 1);
  }
  const fallback = services
    .filter((service) => service.isActive && service.parentId == null)
    .map((service) => {
      const children = services.filter((child) => child.parentId === service.id);
      const serviceIds = [service.id, ...children.map((child) => child.id)];
      const questionCount = serviceIds.reduce((sum, id) => sum + (fallbackCounts.get(id) ?? 0), 0);
      return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        questionCount,
        serviceIds
      };
    })
    .filter((service) => service.questionCount > 0)
    .sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name, "ru"));

  return withFallback(
    async () => {
      const [groups, servicesWithChildren] = await Promise.all([
        prisma.question.groupBy({
          by: ["serviceId"],
          where: {
            serviceId: { not: null },
            ...getPublicQuestionWhere()
          },
          _count: { _all: true }
        }),
        prisma.service.findMany({
          where: {
            isActive: true,
            parentId: null
          },
          select: {
            id: true,
            name: true,
            slug: true,
            children: {
              where: { isActive: true },
              select: { id: true }
            }
          },
          orderBy: { name: "asc" }
        })
      ]);
      const countsByServiceId = new Map(groups.map((group) => [group.serviceId, group._count._all]));

      return servicesWithChildren
        .map((service) => {
          const serviceIds = [service.id, ...service.children.map((child) => child.id)];
          const questionCount = serviceIds.reduce((sum, id) => sum + (countsByServiceId.get(id) ?? 0), 0);
          return {
            id: service.id,
            name: service.name,
            slug: service.slug,
            questionCount,
            serviceIds
          };
        })
        .filter((category) => category.questionCount > 0)
        .sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name, "ru"));
    },
    fallback
  );
}

export async function getHarantQuestionCategoryStats() {
  const fallbackCounts = new Map<string, number>();
  for (const question of questions.filter(isPublicQuestion)) {
    if (!question.serviceId) continue;
    fallbackCounts.set(question.serviceId, (fallbackCounts.get(question.serviceId) ?? 0) + 1);
  }
  const fallback = services
    .filter((service) => HARANT_QUESTION_CATEGORIES.includes(service.name as (typeof HARANT_QUESTION_CATEGORIES)[number]))
    .map((service) => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
      questionCount: fallbackCounts.get(service.id) ?? 0
    }))
    .sort((a, b) => HARANT_QUESTION_CATEGORIES.indexOf(a.name as (typeof HARANT_QUESTION_CATEGORIES)[number]) - HARANT_QUESTION_CATEGORIES.indexOf(b.name as (typeof HARANT_QUESTION_CATEGORIES)[number]));

  return withFallback(
    async () => {
      const groups = await prisma.question.groupBy({
        by: ["serviceId"],
        where: {
          serviceId: { not: null },
          status: "PUBLISHED",
          qualityStatus: "APPROVED"
        },
        _count: { _all: true },
        orderBy: { _count: { serviceId: "desc" } }
      });
      const countsByServiceId = new Map(groups.map((group) => [group.serviceId, group._count._all]));
      const rows = await prisma.service.findMany({
        where: { name: { in: [...HARANT_QUESTION_CATEGORIES] }, isActive: true },
        select: { id: true, name: true, slug: true }
      });
      const serviceByName = new Map(rows.map((service) => [service.name, service]));

      return HARANT_QUESTION_CATEGORIES.map((name) => {
        const service = serviceByName.get(name);
        return service
          ? {
              id: service.id,
              name: service.name,
              slug: service.slug,
              questionCount: countsByServiceId.get(service.id) ?? 0
            }
          : null;
      }).filter((category): category is { id: string; name: string; slug: string; questionCount: number } => Boolean(category));
    },
    fallback
  );
}

export async function getQuestionCategoryServices() {
  const fallback = services
    .filter((service) => HARANT_QUESTION_CATEGORIES.includes(service.name as (typeof HARANT_QUESTION_CATEGORIES)[number]))
    .sort((a, b) => HARANT_QUESTION_CATEGORIES.indexOf(a.name as (typeof HARANT_QUESTION_CATEGORIES)[number]) - HARANT_QUESTION_CATEGORIES.indexOf(b.name as (typeof HARANT_QUESTION_CATEGORIES)[number]));

  return withFallback(
    async () => {
      const rows = await prisma.service.findMany({
        where: { name: { in: [...HARANT_QUESTION_CATEGORIES] }, isActive: true },
        orderBy: { name: "asc" }
      });
      const serviceByName = new Map(rows.map((service) => [service.name, service]));

      return HARANT_QUESTION_CATEGORIES.map((name) => {
        const service = serviceByName.get(name);
        return service ? mapService(service) : null;
      }).filter((service): service is Service => Boolean(service));
    },
    fallback
  );
}

export async function getQuestion(slug: string) {
  const fallbackQuestion = process.env.NODE_ENV === "production" ? null : questions.find((question) => question.slug === slug);
  const fallback = fallbackQuestion && isPublicQuestion(fallbackQuestion) ? toPublicQuestion(fallbackQuestion) : null;

  return withFallback(
    async () => {
      const row = await prisma.question.findUnique({
        where: { slug },
        include: {
          city: true,
          service: true,
          reports: {
            where: { status: { in: ["NEW", "IN_REVIEW"] } },
            select: { id: true }
          },
          answers: {
            include: { lawyer: true },
            where: getPublicAnswerWhere()
          }
        }
      });

      return row?.status === "PUBLISHED" && row.qualityStatus === "APPROVED" ? mapQuestion(row) : null;
    },
    fallback
  );
}

export async function getDocuments(serviceId?: string) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : documentTemplates.filter((document) => (serviceId ? document.serviceId === serviceId : true));

  return withFallback(
    async () =>
      (await prisma.documentTemplate.findMany({
        where: { serviceId },
        orderBy: { title: "asc" }
      })).map(mapDocument),
    fallback
  );
}

export async function getDocument(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : documentTemplates.find((document) => document.slug === slug) ?? null;

  return withFallback(
    async () => {
      const row = await prisma.documentTemplate.findUnique({ where: { slug } });
      return row ? mapDocument(row) : null;
    },
    fallback
  );
}

export async function getCalculators(serviceId?: string) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : calculators.filter((calculator) => (serviceId ? calculator.serviceId === serviceId : true));

  return withFallback(
    async () =>
      (await prisma.calculator.findMany({
        where: { serviceId },
        orderBy: { title: "asc" }
      })).map(mapCalculator),
    fallback
  );
}

export async function getCalculator(slug: string) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? null
      : calculators.find((calculator) => calculator.slug === slug || (slug === "neustoyka" && calculator.slug === "neustojka")) ?? null;

  return withFallback(
    async () => {
      const row =
        (await prisma.calculator.findUnique({ where: { slug } })) ??
        (slug === "neustoyka" ? await prisma.calculator.findUnique({ where: { slug: "neustojka" } }) : null);
      return row ? mapCalculator(row) : null;
    },
    fallback
  );
}

export async function getCases(serviceId?: string) {
  const fallback = process.env.NODE_ENV === "production" ? [] : cases.filter((caseItem) => (serviceId ? caseItem.serviceId === serviceId : true));

  return withFallback(
    async () =>
      (await prisma.case.findMany({
        where: { serviceId },
        orderBy: { updatedAt: "desc" }
      })).map(mapCase),
    fallback
  );
}

export async function getCase(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : cases.find((caseItem) => caseItem.slug === slug) ?? null;

  return withFallback(
    async () => {
      const row = await prisma.case.findUnique({ where: { slug } });
      return row ? mapCase(row) : null;
    },
    fallback
  );
}

export async function getChecklists(serviceId?: string) {
  const fallback =
    process.env.NODE_ENV === "production" ? [] : checklists.filter((item) => (serviceId ? item.serviceId === serviceId : true));

  return withFallback(
    async () =>
      (await prisma.checklist.findMany({
        where: { serviceId },
        orderBy: { title: "asc" }
      })).map(mapChecklist),
    fallback
  );
}

export async function getChecklist(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : checklists.find((item) => item.slug === slug) ?? null;

  return withFallback(
    async () => {
      const row = await prisma.checklist.findUnique({ where: { slug } });
      return row ? mapChecklist(row) : null;
    },
    fallback
  );
}

export async function getVideoPages(serviceId?: string) {
  const fallback =
    process.env.NODE_ENV === "production" ? [] : videoPages.filter((item) => (serviceId ? item.relatedServiceId === serviceId : true));

  return withFallback(
    async () =>
      (await prisma.videoPage.findMany({
        where: { relatedServiceId: serviceId },
        orderBy: { title: "asc" }
      })).map(mapVideoPage),
    fallback
  );
}

export async function getVideoPage(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : videoPages.find((item) => item.slug === slug) ?? null;

  return withFallback(
    async () => {
      const row = await prisma.videoPage.findUnique({ where: { slug } });
      return row ? mapVideoPage(row) : null;
    },
    fallback
  );
}

export async function getLegalScenarios(serviceId?: string) {
  const fallback =
    process.env.NODE_ENV === "production" ? [] : legalScenarios.filter((item) => (serviceId ? item.serviceId === serviceId : true));

  return withFallback(
    async () =>
      (await prisma.legalScenario.findMany({
        where: { serviceId },
        orderBy: { title: "asc" }
      })).map(mapLegalScenario),
    fallback
  );
}

export async function getLegalScenario(slug: string) {
  const fallback = process.env.NODE_ENV === "production" ? null : legalScenarios.find((item) => item.slug === slug) ?? null;

  return withFallback(
    async () => {
      const row = await prisma.legalScenario.findUnique({ where: { slug } });
      return row ? mapLegalScenario(row) : null;
    },
    fallback
  );
}

export async function getNextBestActions(pageType?: NextBestAction["pageType"], serviceId?: string | null, cityId?: string | null) {
  const fallback =
    process.env.NODE_ENV === "production"
      ? []
      : nextBestActions
          .filter((item) => (pageType ? item.pageType === pageType : true))
          .filter((item) => (serviceId ? item.serviceId === serviceId : true))
          .filter((item) => (cityId ? item.cityId === cityId : true))
          .sort((a, b) => b.priority - a.priority);

  return withFallback(
    async () =>
      (await prisma.nextBestAction.findMany({
        where: {
          pageType,
          serviceId: serviceId ?? undefined,
          cityId: cityId ?? undefined
        },
        orderBy: { priority: "desc" }
      })).map(mapNextBestAction),
    fallback
  );
}

export type RootListingPage = "documents" | "calculators" | "checklists" | "videos" | "lawyers" | "questions";

export async function canIndexRootListingPage(page: RootListingPage) {
  if (page === "documents") return (await getDocuments()).length > 0;
  if (page === "calculators") return (await getCalculators()).length > 0;
  if (page === "checklists") return (await getChecklists()).length > 0;
  if (page === "videos") return (await getVideoPages()).length > 0;
  if (page === "lawyers") return (await getLawyers()).length > 0;

  const [cityRows, serviceRows] = await Promise.all([getCities(), getServices()]);
  return cityRows.length > 0 && serviceRows.length > 0;
}

export async function getCityServiceSeoIndexability(city: City, service: Service, searchParams?: CityServiceIndexabilityInput["searchParams"]) {
  const [seo, cityFaqs, serviceFaqs, cityServiceLawyers, relatedQuestions, relatedArticles] = await Promise.all([
    getSeoPage("CITY_SERVICE", `${city.slug}/${service.slug}`),
    getFaqs("CITY_SERVICE", `${city.id}:${service.id}`),
    getFaqs("SERVICE", service.id),
    getLawyers({ citySlug: city.slug, serviceSlug: service.slug }),
    getQuestions(service.id),
    getArticles(service.id)
  ]);
  const effectiveFaqs = cityFaqs.length >= 3 ? cityFaqs : serviceFaqs;
  const indexability: CityServiceIndexabilityInput = {
    city,
    service,
    seoPage: seo,
    faqCount: effectiveFaqs.length,
    lawyerCount: cityServiceLawyers.length,
    reviewedLawyerCount: 0,
    verifiedLawyerCount: cityServiceLawyers.filter((lawyer) => lawyer.isVerified).length,
    hasDemandOrManualApproval: true,
    hasPrices: cityServiceLawyers.some((lawyer) => Boolean(lawyer.consultationPrice)),
    hasRelatedContent: relatedQuestions.length > 0 || relatedArticles.length > 0,
    hasInternalLinks: true,
    searchParams
  };

  return {
    seo,
    isIndexable: canIndexCityServicePage(indexability)
  };
}

export async function getSitemapEntries(
  kind:
    | "pages"
    | "lawyers"
    | "questions"
) {
  if (kind === "pages") {
    const includeLawyersRoot = await canIndexRootListingPage("lawyers");

    return [
      "/",
      "/document-check/",
      "/problems/",
      "/documents/",
      "/tools/",
      "/questions/",
      ...(includeLawyersRoot ? ["/lawyers/"] : []),
      "/about/",
      "/contacts/",
      "/legal/privacy/",
      "/legal/terms/",
      "/legal/personal-data-consent/",
      "/legal/disclaimer/",
      "/legal/qna-rules/",
      "/legal/lawyer-rules/"
    ];
  }

  if (kind === "lawyers") {
    const [profileEntries, listingEntries] = await Promise.all([
      getLawyers().then((lawyerRows) =>
        lawyerRows.filter(canIndexLawyerProfilePage).map((lawyer) => `/lawyers/${lawyer.slug}/`)
      ),
      getLawyerListingSitemapEntries()
    ]);

    return [...listingEntries, ...profileEntries];
  }

  if (kind === "questions") {
    return (await getQuestions()).filter((question) => canIndexQuestionPage(question)).map((question) => `/questions/${question.slug}/`);
  }

  return [];
}

type LawyerListingSitemapStats = {
  city: City;
  service?: Service;
  lawyerIds: Set<string>;
  verifiedLawyerIds: Set<string>;
};

async function getLawyerListingSitemapEntries() {
  if (!process.env.DATABASE_URL) return [];

  try {
    const [lawyerRows, faqRows, questionRows, articleRows, documentRows] = await withDatabaseTimeout(
      Promise.all([
        prisma.lawyer.findMany({
          where: { active: true, blocked: false, profileStatus: "APPROVED" },
          select: {
            id: true,
            userId: true,
            slug: true,
            isVerified: true,
            cities: { select: { city: true } },
            services: { select: { service: true } }
          }
        }),
        prisma.faqItem.findMany({
          where: { entityType: { in: ["GENERAL", "CITY", "SERVICE"] } },
          select: { entityType: true, entityId: true }
        }),
        prisma.question.findMany({
          where: getIndexableQuestionWhere(),
          select: { cityId: true, serviceId: true }
        }),
        prisma.article.findMany({
          where: { status: "APPROVED", isIndexable: true, publishedAt: { not: null } },
          select: { serviceId: true }
        }),
        prisma.documentTemplate.findMany({ select: { serviceId: true } })
      ])
    );

    const cityListings = new Map<string, LawyerListingSitemapStats>();
    const cityServiceListings = new Map<string, LawyerListingSitemapStats>();

    for (const lawyer of lawyerRows) {
      if (isProductionHiddenSampleLawyer(lawyer)) continue;

      for (const cityRelation of lawyer.cities) {
        const city = mapCity(cityRelation.city);
        const cityStats = cityListings.get(city.id) ?? createLawyerListingStats(city);
        addLawyerToListingStats(cityStats, lawyer.id, lawyer.isVerified);
        cityListings.set(city.id, cityStats);

        for (const serviceRelation of lawyer.services) {
          const service = mapService(serviceRelation.service);
          const key = cityServiceKey(city.id, service.id);
          const cityServiceStats = cityServiceListings.get(key) ?? createLawyerListingStats(city, service);
          addLawyerToListingStats(cityServiceStats, lawyer.id, lawyer.isVerified);
          cityServiceListings.set(key, cityServiceStats);
        }
      }
    }

    const generalFaqCount = faqRows.filter((faq) => faq.entityType === "GENERAL" && faq.entityId === "home").length;
    const faqCount = (entityType: "CITY" | "SERVICE", entityId: string) => {
      const specificCount = faqRows.filter((faq) => faq.entityType === entityType && faq.entityId === entityId).length;
      return specificCount >= 3 ? specificCount : generalFaqCount;
    };
    const questionCityIds = new Set(questionRows.flatMap((question) => (question.cityId ? [question.cityId] : [])));
    const questionCityServiceKeys = new Set(
      questionRows.flatMap((question) => (question.cityId && question.serviceId ? [cityServiceKey(question.cityId, question.serviceId)] : []))
    );
    const articleServiceIds = new Set(articleRows.map((article) => article.serviceId));
    const documentServiceIds = new Set(documentRows.flatMap((document) => (document.serviceId ? [document.serviceId] : [])));

    const cityEntries = [...cityListings.values()]
      .filter((item) =>
        canIndexLawyerListingPage({
          city: item.city,
          lawyerCount: item.lawyerIds.size,
          verifiedLawyerCount: item.verifiedLawyerIds.size,
          faqCount: faqCount("CITY", item.city.id),
          hasRelatedContent: questionCityIds.has(item.city.id),
          hasInternalLinks: true
        })
      )
      .map((item) => `/lawyers/${item.city.slug}/`);
    const cityServiceEntries = [...cityServiceListings.values()]
      .filter((item) => {
        const service = item.service;
        if (!service) return false;

        return canIndexLawyerListingPage({
          city: item.city,
          service,
          lawyerCount: item.lawyerIds.size,
          verifiedLawyerCount: item.verifiedLawyerIds.size,
          faqCount: faqCount("SERVICE", service.id),
          hasRelatedContent:
            questionCityServiceKeys.has(cityServiceKey(item.city.id, service.id)) ||
            articleServiceIds.has(service.id) ||
            documentServiceIds.has(service.id),
          hasInternalLinks: true
        });
      })
      .map((item) => `/lawyers/${item.city.slug}/${item.service!.slug}/`);

    return [...cityEntries, ...cityServiceEntries].sort();
  } catch {
    if (process.env.NODE_ENV === "production") {
      console.error("[repositories] Unable to build lawyer listing sitemap entries from database.");
    }
    return [];
  }
}

function createLawyerListingStats(city: City, service?: Service): LawyerListingSitemapStats {
  return { city, service, lawyerIds: new Set(), verifiedLawyerIds: new Set() };
}

function addLawyerToListingStats(stats: LawyerListingSitemapStats, lawyerId: string, isVerified: boolean) {
  stats.lawyerIds.add(lawyerId);
  if (isVerified) stats.verifiedLawyerIds.add(lawyerId);
}

function cityServiceKey(cityId: string, serviceId: string) {
  return `${cityId}:${serviceId}`;
}

function filterLawyers(source: Lawyer[], filters: LawyerFilters) {
  return source
    .filter((lawyer) => (filters.citySlug ? lawyer.citySlugs.includes(filters.citySlug) : true))
    .filter((lawyer) => (filters.serviceSlug ? lawyer.serviceSlugs.includes(filters.serviceSlug) : true))
    .filter((lawyer) => (filters.status === "ADVOCATE" ? lawyer.status === "ADVOCATE" : true))
    .filter((lawyer) => (filters.status === "LAWYER" ? lawyer.status === "LAWYER" : true))
    .filter((lawyer) => (filters.price === "low" ? (lawyer.consultationPrice ?? 0) <= 2500 : true))
    .sort((a, b) => Number(b.isVerified) - Number(a.isVerified) || a.id.localeCompare(b.id));
}

function normalizeLawyerTake(take: number | undefined) {
  if (take === undefined) return DEFAULT_LAWYERS_TAKE;
  if (!Number.isFinite(take)) return DEFAULT_LAWYERS_TAKE;
  return Math.min(Math.max(1, Math.floor(take)), MAX_LAWYERS_TAKE);
}

function sanitizeNullablePublicLawyer(lawyer: Lawyer | null): Lawyer | null {
  return lawyer ? sanitizePublicLawyer(lawyer) : null;
}

function sanitizePublicLawyer(lawyer: Lawyer): Lawyer {
  return {
    ...lawyer,
    description: removeUnverifiedReviewClaims(lawyer.description),
    phone: null,
    whatsapp: null,
    telegram: null,
    email: null
  };
}

function lawyerInclude() {
  return {
    services: { include: { service: true } },
    cities: { include: { city: true } },
    profile: true,
    priceItems: { include: { service: true } },
    verifications: true,
    reviews: {
      where: { isModerated: true, qualityStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 7
    }
  } as const;
}

function removeUnverifiedReviewClaims(value: string) {
  const sanitized = value
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/(?:рейтинг|отзыв|звезд|лучши|топ)/i.test(sentence))
    .join(" ")
    .trim();

  return sanitized;
}

function mapCity(row: any): City {
  const known = cities.find((city) => city.slug === row.slug);
  const namePrepositional = row.namePrepositional ?? known?.namePrepositional ?? row.name;
  return {
    id: row.id,
    name: row.name,
    namePrepositional,
    slug: row.slug,
    region: row.region,
    federalDistrict: row.federalDistrict ?? known?.federalDistrict ?? null,
    isActive: row.isActive,
    seoText: cleanPublicCopy(row.seoText, `Юристы в ${namePrepositional}`)
  };
}

function mapService(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    fullDescription: cleanPublicCopy(row.fullDescription, row.name),
    isActive: row.isActive,
    parentId: row.parentId
  };
}

function mapLawyer(row: any): Lawyer {
  const mappedCities = (row.cities ?? []).map((item: any) => mapCity(item.city));
  const mappedServices = (row.services ?? []).map((item: any) => mapService(item.service));

  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    middleName: row.middleName,
    slug: row.slug,
    photoUrl: row.photoUrl,
    status: row.status,
    experienceYears: row.experienceYears,
    description: row.description,
    education: row.education,
    licenseNumber: row.licenseNumber,
    isVerified: row.isVerified,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    consultationPrice: row.consultationPrice,
    primaryServiceId: row.primaryServiceId,
    phone: null,
    whatsapp: null,
    telegram: null,
    email: null,
    active: row.active ?? true,
    blocked: row.blocked ?? false,
    profileStatus: row.profileStatus ?? (row.isVerified ? "APPROVED" : "PENDING"),
    consentToNotifications: row.consentToNotifications ?? true,
    citySlugs: mappedCities.map((city: City) => city.slug),
    serviceSlugs: mappedServices.map((service: Service) => service.slug),
    cities: mappedCities,
    services: mappedServices,
    reviews: (row.reviews ?? []).map((review: any) => ({
      id: review.id,
      lawyerId: review.lawyerId,
      serviceId: review.serviceId,
      cityId: review.cityId,
      userName: review.userName,
      rating: review.rating,
      text: review.text,
      qualityStatus: review.qualityStatus,
      isModerated: review.isModerated,
      createdAt: review.createdAt.toISOString()
    })),
    profile: row.profile
      ? {
          about: row.profile.about,
          specializationText: row.profile.specializationText ?? null,
          servicesAndPricesText: row.profile.servicesAndPricesText ?? null,
          reviewsText: row.profile.reviewsText ?? null,
          courtExperience: row.profile.courtExperience,
          officeAddress: row.profile.officeAddress,
          casesCount: row.profile.casesCount,
          responseTimeMinutes: row.profile.responseTimeMinutes,
          consentToAdminAssistedAnswers: row.profile.consentToAdminAssistedAnswers ?? false,
          adminAssistedConsentAt: row.profile.adminAssistedConsentAt?.toISOString?.() ?? null,
          adminAssistedConsentComment: row.profile.adminAssistedConsentComment ?? null
        }
      : undefined,
    priceItems: (row.priceItems ?? []).map((item: any) => ({
      id: item.id,
      lawyerId: item.lawyerId,
      serviceId: item.serviceId,
      title: item.title,
      priceFrom: item.priceFrom,
      priceTo: item.priceTo
    })),
    verifications: (row.verifications ?? []).map((item: any) => ({
      id: item.id,
      lawyerId: item.lawyerId,
      type: item.type,
      status: item.status,
      comment: item.comment
    }))
  };
}

function mapArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    shortAnswer: row.shortAnswer,
    importantPoints: asStringArray(row.importantPoints),
    steps: asStringArray(row.steps),
    documents: asStringArray(row.documents),
    deadlines: asStringArray(row.deadlines),
    prices: asStringArray(row.prices),
    risks: asStringArray(row.risks),
    mistakes: asStringArray(row.mistakes),
    serviceId: row.serviceId,
    cityId: row.cityId,
    authorId: row.authorId,
    authorName: getFullName(row.author),
    reviewedByLawyerId: row.reviewedByLawyerId,
    reviewedByLawyerName: row.reviewedBy ? getFullName(row.reviewedBy) : null,
    status: row.status,
    isIndexable: row.isIndexable,
    contentFreshness: row.contentFreshness,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    legalSources: (row.legalSources ?? []).map((item: any) => mapLegalSource(item.source)),
    service: row.service ? mapService(row.service) : undefined,
    city: row.city ? mapCity(row.city) : null
  };
}

function mapLegalSource(row: any): LegalSource {
  return {
    id: row.id,
    title: row.title,
    codeName: row.codeName,
    articleNumber: row.articleNumber,
    url: row.url,
    lastCheckedAt: row.lastCheckedAt.toISOString()
  };
}

function mapQuestion(row: any): Question {
  const publicText = row.enrichedText ?? row.text;
  const publicTitle = row.enrichedTitle ?? row.title;
  const answers = (row.answers ?? [])
    .filter((answer: any) => answer.lawyer && !isProductionHiddenSampleLawyer(answer.lawyer))
    .map((answer: any) => ({
      id: answer.id,
      questionId: answer.questionId,
      lawyerId: answer.lawyerId,
      lawyerName: getFullName(answer.lawyer),
      lawyerSlug: answer.lawyer.slug,
      lawyerPhotoUrl: answer.lawyer.photoUrl ?? null,
      lawyerCity: answer.lawyer.cities?.[0]?.city?.name ?? row.city?.name,
      lawyerSpecialization: row.service?.name,
      lawyerExperienceYears: answer.lawyer.experienceYears,
      lawyerProfileStatus: answer.lawyer.isVerified ? "VERIFIED" : "PENDING",
      text: answer.text,
      answerText: answer.text,
      authorType: answer.authorType ?? "LAWYER",
      status: answer.status ?? (answer.isModerated ? "PUBLISHED" : "MODERATION"),
      answerStatus: answer.status ?? (answer.isModerated ? "PUBLISHED" : "MODERATION"),
      moderationStatus: answer.qualityStatus,
      containsContactAttempt: answer.containsContactAttempt ?? false,
      containsUnsupportedLegalClaim: answer.containsUnsupportedLegalClaim ?? false,
      containsFearPressure: answer.containsFearPressure ?? false,
      containsGenericLeadBait: answer.containsGenericLeadBait ?? false,
      legalReferencesVerified: answer.legalReferencesVerified ?? false,
      answerReviewStatus: answer.answerReviewStatus ?? null,
      answerReviewReason: answer.answerReviewReason ?? null,
      editorReviewedAt: answer.editorReviewedAt?.toISOString?.() ?? null,
      publishedByAdmin: false,
      qualityStatus: answer.qualityStatus,
      answerQualityScore: answer.answerQualityScore,
      isModerated: answer.isModerated,
      publishedAt: answer.publishedAt?.toISOString?.() ?? null,
      createdAt: answer.createdAt.toISOString()
    }));

  return {
    id: row.id,
    publicNumber: row.publicNumber ?? publicNumberFromQuestionId(row.id),
    title: publicTitle,
    slug: row.slug,
    text: publicText,
    rawText: undefined,
    enrichedTitle: row.enrichedTitle ?? null,
    enrichedText: row.enrichedText ?? null,
    enrichmentStatus: row.enrichmentStatus ?? "RAW",
    preliminaryAnswer: undefined,
    preliminaryAnswerStatus: row.preliminaryAnswerStatus ?? "NOT_REQUESTED",
    scenarioId: row.scenarioId ?? null,
    legalStage: row.legalStage ?? null,
    urgency: row.urgency ?? null,
    riskLevel: row.riskLevel ?? null,
    facts: Array.isArray(row.facts) ? row.facts : [],
    missingFacts: Array.isArray(row.missingFacts) ? row.missingFacts : [],
    clarificationAnswers: null,
    leadScore: row.leadScore ?? 0,
    seoQualityScore: row.seoQualityScore ?? 0,
    userConfirmedEnrichmentAt: row.userConfirmedEnrichmentAt?.toISOString?.() ?? null,
    aiAssisted: row.aiAssisted ?? false,
    editorReviewedAt: row.editorReviewedAt?.toISOString?.() ?? null,
    indexabilityReason: undefined,
    questionText: publicText,
    cityId: row.cityId,
    serviceId: row.serviceId,
    userName: row.userName || (row.isAnonymous ? "Пользователь" : "Гость"),
    authorType: row.isAnonymous ? "GUEST" : "USER",
    userEmail: undefined,
    isAnonymous: row.isAnonymous ?? false,
    notificationsEnabled: row.notificationsEnabled ?? true,
    summary: row.summary,
    shortPreview: row.summary ?? truncateText(publicText, 180),
    category: row.service?.slug === "zhilishchnye-spory" ? "Жилищное право" : row.service?.name,
    tags: row.service?.name ? [row.service.name] : [],
    status: row.status ?? "PUBLISHED",
    moderationStatus: row.qualityStatus,
    qualityStatus: row.qualityStatus,
    moderationComment: undefined,
    sourcePage: undefined,
    hasAttachments: row.hasAttachments ?? false,
    isIndexable: row.isIndexable,
    isDuplicate: row.isDuplicate,
    hasOpenReports: (row.reports?.length ?? 0) > 0,
    trustScore: row.trustScore ?? 0,
    answersCount: answers.length,
    publishedAt: row.publishedAt?.toISOString?.() ?? null,
    createdAt: row.createdAt.toISOString(),
    city: row.city ? mapCity(row.city) : null,
    service: row.service ? mapService(row.service) : null,
    answers
  };
}

function publicNumberFromQuestionId(id: string) {
  const number = id.match(/\d+/)?.[0]?.padStart(6, "0") ?? "000000";
  return `QP-${number}`;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function mapFaq(row: any): FaqItem {
  const cleanFaq = cleanPublicFaq(row.question, row.answer);
  return {
    id: row.id,
    question: cleanFaq.question,
    answer: cleanFaq.answer,
    entityType: row.entityType,
    entityId: row.entityId,
    sortOrder: row.sortOrder
  };
}

function mapSeoPage(row: any): SeoPage {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    cityId: row.cityId,
    serviceId: row.serviceId,
    lawyerId: row.lawyerId,
    title: row.title,
    description: row.description,
    h1: row.h1,
    seoText: cleanPublicCopy(row.seoText, row.h1),
    canonical: row.canonical,
    robots: row.robots,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity,
    primaryKeyword: row.primaryKeyword
  };
}

function mapDocument(row: any): DocumentTemplate {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    serviceId: row.serviceId,
    content: row.content,
    structure: asStringArray(row.structure),
    commonMistakes: asStringArray(row.commonMistakes),
    priceFrom: row.priceFrom ?? 3500,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity
  };
}

function mapCalculator(row: any): Calculator {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    formula: row.formula,
    example: row.example,
    serviceId: row.serviceId,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity
  };
}

function mapCase(row: any): CaseItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    situation: row.situation,
    problem: row.problem,
    lawyerActions: row.lawyerActions,
    documentsPrepared: row.documentsPrepared,
    result: row.result,
    duration: row.duration,
    clientReview: row.clientReview,
    serviceId: row.serviceId,
    cityId: row.cityId,
    lawyerId: row.lawyerId,
    isAnonymized: row.isAnonymized,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity
  };
}

function mapChecklist(row: any): LegalChecklist {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    items: asStringArray(row.items),
    serviceId: row.serviceId,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity
  };
}

function mapVideoPage(row: any): VideoPage {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    transcript: row.transcript,
    timestamps: asStringArray(row.timestamps),
    relatedServiceId: row.relatedServiceId,
    relatedLawyerId: row.relatedLawyerId,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity
  };
}

function mapLegalScenario(row: any): LegalScenario {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    problem: row.problem,
    explanation: row.explanation,
    deadlines: row.deadlines,
    documents: asStringArray(row.documents),
    risks: asStringArray(row.risks),
    serviceId: row.serviceId,
    isIndexable: row.isIndexable,
    seoScore: row.seoScore,
    seoMaturity: row.seoMaturity
  };
}

function mapNextBestAction(row: any): NextBestAction {
  return {
    id: row.id,
    pageType: row.pageType,
    serviceId: row.serviceId,
    cityId: row.cityId,
    actionType: row.actionType,
    title: row.title,
    url: row.url,
    priority: row.priority
  };
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}
