import type { Metadata } from "next";
import { hasForbiddenContact } from "./contact-safety";
import { PUBLIC_ANSWER_MIN_QUALITY_SCORE } from "./qna-publication-rules";
import type { Article, City, FaqItem, Lawyer, Question, SeoMaturityStatus, SeoPage, Service } from "./types";

const blockingParamPrefixes = ["utm_"];
const blockingParamNames = new Set([
  "sort",
  "price",
  "online",
  "page",
  "filter",
  "city",
  "service",
  "status",
  "experience",
  "rating",
  "reviews",
  "q"
]);

const indexableMaturity = new Set<SeoMaturityStatus>(["READY_FOR_INDEX", "INDEXED"]);

export type SearchParams = Record<string, string | string[] | undefined>;

export type SeoScoreInput = {
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  seoText?: string | null;
  faqCount?: number;
  lawyerCount?: number;
  hasPrices?: boolean;
  hasInternalLinks?: boolean;
  hasJsonLd?: boolean;
  hasCta?: boolean;
};

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://pravopoisk.ru").replace(/\/$/, "");
}

export function withTrailingSlash(path: string) {
  if (path === "/") return "/";
  const clean = path.split("?")[0].replace(/\/+$/, "");
  return `${clean}/`;
}

export function absoluteUrl(path: string) {
  return `${siteUrl()}${withTrailingSlash(path)}`;
}

export function hasIndexBlockingParams(searchParams?: SearchParams | null) {
  if (!searchParams) return false;
  const keys = Object.keys(searchParams).filter((key) => searchParams[key] !== undefined);

  return keys.some((key) => {
    const value = searchParams[key];
    if (key === "page") {
      const page = Array.isArray(value) ? value[0] : value;
      return Number(page ?? "1") > 1;
    }
    if (blockingParamNames.has(key)) return true;
    if (blockingParamPrefixes.some((prefix) => key.startsWith(prefix))) return true;
    return true;
  });
}

export function calculateSeoScore(input: SeoScoreInput) {
  return (
    (input.title ? 10 : 0) +
    (input.description ? 10 : 0) +
    (input.h1 ? 10 : 0) +
    ((input.seoText?.trim().length ?? 0) >= 1500 ? 10 : (input.seoText?.trim().length ?? 0) >= 180 ? 7 : 0) +
    ((input.faqCount ?? 0) >= 3 ? 10 : 0) +
    ((input.lawyerCount ?? 0) > 0 ? 10 : 0) +
    (input.hasPrices ? 10 : 0) +
    (input.hasInternalLinks ? 10 : 0) +
    (input.hasJsonLd ? 10 : 0) +
    (input.hasCta ? 10 : 0)
  );
}

export function maturityAllowsIndex(maturity?: SeoMaturityStatus | null) {
  return Boolean(maturity && indexableMaturity.has(maturity));
}

export function canIndexSeoPage(input: {
  seoPage?: SeoPage | null;
  searchParams?: SearchParams | null;
  computedScore?: number;
  hasDuplicateKeyword?: boolean;
  hasCanonicalConflict?: boolean;
}) {
  const score = input.computedScore ?? input.seoPage?.seoScore ?? 0;

  return Boolean(
    input.seoPage?.isIndexable &&
      score >= 70 &&
      maturityAllowsIndex(input.seoPage.seoMaturity) &&
      input.seoPage.title &&
      input.seoPage.description &&
      input.seoPage.h1 &&
      input.seoPage.canonical &&
      input.seoPage.seoText &&
      !input.hasDuplicateKeyword &&
      !input.hasCanonicalConflict &&
      !hasIndexBlockingParams(input.searchParams)
  );
}

export function isPageIndexable(baseIndexable: boolean, searchParams?: SearchParams | null) {
  return baseIndexable && !hasIndexBlockingParams(searchParams);
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  isIndexable: boolean;
  searchParams?: SearchParams | null;
}): Metadata {
  const index = isPageIndexable(input.isIndexable, input.searchParams);

  return {
    title: input.title,
    description: input.description,
    metadataBase: new URL(siteUrl()),
    alternates: {
      canonical: absoluteUrl(input.path)
    },
    robots: {
      index,
      follow: true
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: absoluteUrl(input.path),
      siteName: "ПравоПоиск",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: `${siteUrl()}/og-default.png`,
          width: 1200,
          height: 630,
          alt: "ПравоПоиск — юридический навигатор для граждан"
        }
      ]
    }
  };
}

export function canIndexCityPage(input: {
  city?: City | null;
  seoPage?: SeoPage | null;
  faqCount: number;
  lawyerCount: number;
  hasPrices?: boolean;
  searchParams?: SearchParams | null;
}) {
  const computedScore = calculateSeoScore({
    title: input.seoPage?.title,
    description: input.seoPage?.description,
    h1: input.seoPage?.h1,
    seoText: input.seoPage?.seoText,
    faqCount: input.faqCount,
    lawyerCount: input.lawyerCount,
    hasPrices: input.hasPrices ?? true,
    hasInternalLinks: true,
    hasJsonLd: true,
    hasCta: true
  });

  return Boolean(
    input.city?.isActive &&
      input.faqCount >= 3 &&
      input.lawyerCount >= 3 &&
      canIndexSeoPage({ seoPage: input.seoPage, searchParams: input.searchParams, computedScore })
  );
}

export function canIndexServicePage(input: {
  service?: Service | null;
  seoPage?: SeoPage | null;
  faqCount: number;
  lawyerCount: number;
  hasPrices?: boolean;
  searchParams?: SearchParams | null;
}) {
  const computedScore = calculateSeoScore({
    title: input.seoPage?.title,
    description: input.seoPage?.description,
    h1: input.seoPage?.h1,
    seoText: input.seoPage?.seoText,
    faqCount: input.faqCount,
    lawyerCount: input.lawyerCount,
    hasPrices: input.hasPrices ?? true,
    hasInternalLinks: true,
    hasJsonLd: true,
    hasCta: true
  });

  return Boolean(
    input.service?.isActive &&
      input.faqCount >= 3 &&
      input.lawyerCount >= 3 &&
      canIndexSeoPage({ seoPage: input.seoPage, searchParams: input.searchParams, computedScore })
  );
}

export function canIndexCityServicePage(input: {
  city?: City | null;
  service?: Service | null;
  seoPage?: SeoPage | null;
  faqCount: number;
  lawyerCount: number;
  reviewedLawyerCount: number;
  verifiedLawyerCount: number;
  hasDemandOrManualApproval: boolean;
  hasPrices: boolean;
  hasRelatedContent: boolean;
  hasInternalLinks: boolean;
  searchParams?: SearchParams | null;
}) {
  const computedScore = calculateSeoScore({
    title: input.seoPage?.title,
    description: input.seoPage?.description,
    h1: input.seoPage?.h1,
    seoText: input.seoPage?.seoText,
    faqCount: input.faqCount,
    lawyerCount: input.lawyerCount,
    hasPrices: input.hasPrices,
    hasInternalLinks: input.hasInternalLinks,
    hasJsonLd: true,
    hasCta: true
  });

  return Boolean(
    input.city?.isActive &&
      input.service?.isActive &&
      input.hasDemandOrManualApproval &&
      input.lawyerCount >= 5 &&
      input.reviewedLawyerCount >= 2 &&
      input.verifiedLawyerCount >= 1 &&
      input.faqCount >= 3 &&
      input.hasPrices &&
      input.hasRelatedContent &&
      input.hasInternalLinks &&
      canIndexSeoPage({ seoPage: input.seoPage, searchParams: input.searchParams, computedScore })
  );
}

type QuestionIndexabilityAnswer = Pick<
  Question["answers"][number],
  | "status"
  | "answerStatus"
  | "isModerated"
  | "qualityStatus"
  | "moderationStatus"
  | "containsContactAttempt"
  | "containsUnsupportedLegalClaim"
  | "containsFearPressure"
  | "containsGenericLeadBait"
  | "answerQualityScore"
  | "text"
>;

type QuestionIndexabilityInput = Pick<
  Question,
  "isIndexable" | "status" | "qualityStatus" | "isDuplicate" | "hasOpenReports" | "trustScore" | "title" | "text" | "serviceId"
> & {
  answers: QuestionIndexabilityAnswer[];
};

export function canIndexQuestionPage(question?: QuestionIndexabilityInput | null) {
  if (!question) return false;
  const moderatedAnswers = question.answers.filter(isIndexableQuestionAnswer);
  const hasModeratedLawyerAnswer = moderatedAnswers.length >= 1;

  return Boolean(
    question.isIndexable &&
      question.status === "PUBLISHED" &&
      question.qualityStatus === "APPROVED" &&
      !question.isDuplicate &&
      !question.hasOpenReports &&
      (question.trustScore ?? 0) >= 85 &&
      question.title.trim().length >= 20 &&
      question.text.trim().length >= 120 &&
      !hasForbiddenContact(`${question.title}\n${question.text}`) &&
      question.serviceId &&
      hasModeratedLawyerAnswer
  );
}

export function isIndexableQuestionAnswer(answer: QuestionIndexabilityAnswer) {
  const status = answer.status ?? answer.answerStatus;
  const qualityStatus = answer.qualityStatus ?? answer.moderationStatus;

  return Boolean(
    status === "PUBLISHED" &&
      answer.isModerated &&
      qualityStatus === "APPROVED" &&
      !answer.containsContactAttempt &&
      !answer.containsUnsupportedLegalClaim &&
      !answer.containsFearPressure &&
      !answer.containsGenericLeadBait &&
      !hasForbiddenContact(answer.text) &&
      (answer.answerQualityScore ?? 0) >= PUBLIC_ANSWER_MIN_QUALITY_SCORE
  );
}

export function canIndexQuestionListingPage(input: {
  city?: City | null;
  service?: Service | null;
  questionCount: number;
  lawyerCount: number;
  faqCount: number;
  hasInternalLinks?: boolean;
}) {
  const minimumQuestions = input.service ? 2 : 3;

  return Boolean(
    input.city?.isActive &&
      (!input.service || input.service.isActive) &&
      input.questionCount >= minimumQuestions &&
      input.lawyerCount >= 2 &&
      input.faqCount >= 3 &&
      input.hasInternalLinks !== false
  );
}

export function canIndexLawyerListingPage(input: {
  city?: City | null;
  service?: Service | null;
  lawyerCount: number;
  verifiedLawyerCount: number;
  faqCount: number;
  hasRelatedContent: boolean;
  hasInternalLinks?: boolean;
}) {
  return Boolean(
    input.city?.isActive &&
      (!input.service || input.service.isActive) &&
      input.lawyerCount >= 3 &&
      input.verifiedLawyerCount >= 1 &&
      input.faqCount >= 3 &&
      input.hasRelatedContent &&
      input.hasInternalLinks !== false
  );
}

// Seeded dev/sample lawyers stay publicly visible but must never be indexed
// (placeholder profiles populated for dev city pages).
const NON_INDEXABLE_LAWYER_SLUG_PREFIXES = ["demo-lawyer", "sample-lawyer", "dev-city-lawyer"];

export function isNonIndexableSampleLawyerSlug(slug?: string | null) {
  return Boolean(slug && NON_INDEXABLE_LAWYER_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix)));
}

export function canIndexLawyerProfilePage(
  lawyer?: Pick<Lawyer, "active" | "blocked" | "profileStatus" | "isVerified" | "cities" | "services" | "description" | "slug"> | null
) {
  return Boolean(
    lawyer &&
      !isNonIndexableSampleLawyerSlug(lawyer.slug) &&
      lawyer.active !== false &&
      !lawyer.blocked &&
      lawyer.profileStatus === "APPROVED" &&
      lawyer.isVerified &&
      lawyer.cities.length > 0 &&
      lawyer.services.length > 0 &&
      lawyer.description.trim().length >= 120
  );
}

export function canIndexArticlePage(input: {
  article?: Article | null;
  seoPage?: SeoPage | null;
  faqCount: number;
  hasLegalSources?: boolean;
}) {
  const article = input.article;
  const sensitiveService = article?.service?.slug
    ? ["nalogovye-spory", "bankrotstvo-fizicheskih-lits", "alimenty", "voennoe-pravo"].includes(article.service.slug)
    : false;

  return Boolean(
    article?.status === "APPROVED" &&
      article.isIndexable &&
      article.contentFreshness !== "OUTDATED" &&
      article.publishedAt &&
      article.updatedAt &&
      article.title &&
      article.excerpt &&
      article.content.trim().length >= 300 &&
      article.authorId &&
      (!sensitiveService || article.reviewedByLawyerId) &&
      article.serviceId &&
      input.faqCount >= 3 &&
      (!input.seoPage || canIndexSeoPage({ seoPage: input.seoPage }))
  );
}

export function shouldIncludeInSitemap(input: {
  isIndexable: boolean;
  seoScore?: number | null;
  seoMaturity?: SeoMaturityStatus | null;
  noindex?: boolean;
  freshness?: "FRESH" | "NEEDS_REVIEW" | "OUTDATED";
}) {
  return Boolean(
    input.isIndexable &&
      (input.seoScore ?? 0) >= 70 &&
      maturityAllowsIndex(input.seoMaturity) &&
      !input.noindex &&
      input.freshness !== "OUTDATED"
  );
}

export function titleForLawyer(fullName: string, statusLabel: string, cityName: string) {
  return `${fullName} — ${statusLabel}, ${cityName}, профиль юриста`;
}

export function descriptionForLawyer(fullName: string, cityName: string, serviceNames: string[], isVerified: boolean) {
  const verification = isVerified ? "Проверенный профиль. " : "";
  const location = cityName ? ` в городе ${cityName}` : "";
  const specializations = serviceNames.length ? ` Специализации: ${serviceNames.slice(0, 3).join(", ")}.` : "";

  return `${verification}${fullName}${location}.${specializations} Обратиться к юристу можно через платформу без публикации контактов.`;
}

export function ensureFaqVisibleBeforeJsonLd(faqs: FaqItem[]) {
  return faqs.length >= 3;
}
