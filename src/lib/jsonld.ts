import type { Breadcrumb, City, FaqItem, Lawyer, Question, Service } from "./types";
import { absoluteUrl, canIndexQuestionPage, isIndexableQuestionAnswer, siteUrl, withTrailingSlash } from "./seo";
import { getFullName, getStatusLabel, siteName } from "./sample-data";
import { platformContacts, platformSocialSameAs } from "./platform";

export function organizationJsonLd() {
  const contactPoint = {
    "@type": "ContactPoint",
    ...(platformContacts.phone ? { telephone: platformContacts.phone } : {}),
    ...(platformContacts.email ? { email: platformContacts.email } : {}),
    contactType: "customer support",
    areaServed: platformContacts.regions,
    availableLanguage: ["ru"]
  };
  const hasContactPoint = Boolean(platformContacts.phone || platformContacts.email);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: platformContacts.name || siteName,
    url: siteUrl(),
    logo: `${siteUrl()}/logo.svg`,
    ...(platformContacts.email ? { email: platformContacts.email } : {}),
    ...(platformContacts.phone ? { telephone: platformContacts.phone } : {}),
    address: platformContacts.address
      ? {
          "@type": "PostalAddress",
          streetAddress: platformContacts.address,
          addressCountry: "RU"
        }
      : undefined,
    ...(hasContactPoint ? { contactPoint: [contactPoint] } : {}),
    sameAs: platformSocialSameAs
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/questions?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function breadcrumbJsonLd(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function faqJsonLd(items: FaqItem[]) {
  if (items.length < 3) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function legalServiceJsonLd(input: {
  path: string;
  name: string;
  description: string;
  city?: City | null;
  service?: Service | null;
  lawyers?: Lawyer[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    areaServed: input.city?.name,
    serviceType: input.service?.name,
    provider: input.lawyers?.slice(0, 8).map((lawyer) => ({
      "@type": "Person",
      name: getFullName(lawyer),
      jobTitle: getStatusLabel(lawyer.status),
      url: absoluteUrl(`/lawyers/${lawyer.slug}/`)
    }))
  };
}

export function lawyerPersonJsonLd(lawyer: Lawyer) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: getFullName(lawyer),
    jobTitle: getStatusLabel(lawyer.status),
    url: absoluteUrl(`/lawyers/${lawyer.slug}/`),
    worksFor: {
      "@type": "Organization",
      name: platformContacts.name || siteName,
      url: siteUrl()
    },
    areaServed: lawyer.cities.map((city) => city.name),
    knowsAbout: lawyer.services.map((service) => service.name)
  };
}

export function questionJsonLd(question: Question) {
  const moderatedAnswers = question.answers.filter(isIndexableQuestionAnswer);
  if (moderatedAnswers.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Question",
    name: question.title,
    text: question.text,
    dateCreated: question.createdAt,
    answerCount: moderatedAnswers.length,
    acceptedAnswer: moderatedAnswers
      .slice(0, 1)
      .map((answer) => ({
        "@type": "Answer",
        text: answer.text,
        dateCreated: answer.createdAt,
        author: {
          "@type": "Person",
          name: answer.lawyerName,
          url: absoluteUrl(withTrailingSlash(`/lawyers/${answer.lawyerSlug}`))
        }
      }))[0]
  };
}

export function qapageJsonLd(question: Question) {
  if (!canIndexQuestionPage(question)) return null;
  const mainEntity = questionJsonLd(question);
  if (!mainEntity) return null;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity
  };
}

export function videoObjectJsonLd(input: {
  name: string;
  description: string;
  path: string;
  uploadDate: string;
  transcript: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    uploadDate: input.uploadDate,
    contentUrl: absoluteUrl(input.path),
    transcript: input.transcript
  };
}

export function localBusinessJsonLd(city: City, lawyers: Lawyer[], path = `/${city.slug}/`) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${siteName} — ${city.name}`,
    url: absoluteUrl(path),
    areaServed: city.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: city.region,
      addressCountry: "RU"
    },
    employee: lawyers.slice(0, 10).map((lawyer) => ({
      "@type": "Person",
      name: getFullName(lawyer),
      jobTitle: getStatusLabel(lawyer.status)
    }))
  };
}
