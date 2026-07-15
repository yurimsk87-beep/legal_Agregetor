import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { QuestionList } from "@/components/ContentBlocks";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { LawyerCard } from "@/components/LawyerCard";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { breadcrumbJsonLd, faqJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { buildMetadata, canIndexLawyerListingPage } from "@/lib/seo";
import { getCity, getDocuments, getFaqs, getLawyers, getQuestions, getService } from "@/lib/repositories";

type PageProps = {
  params: Promise<{ lawyerSlug: string; categorySlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lawyerSlug, categorySlug } = await params;
  const [city, service] = await Promise.all([getCity(lawyerSlug), getService(categorySlug)]);
  const [lawyers, allQuestions, documents, serviceFaqs, generalFaqs] =
    city && service
      ? await Promise.all([
          getLawyers({ citySlug: city.slug, serviceSlug: service.slug }),
          getQuestions(service.id),
          getDocuments(service.id),
          getFaqs("SERVICE", service.id),
          getFaqs("GENERAL", "home")
        ])
      : [[], [], [], [], []];
  const questions = city ? allQuestions.filter((question) => question.city?.slug === city.slug && question.answers.length > 0) : [];
  const faqs = serviceFaqs.length >= 3 ? serviceFaqs : generalFaqs;

  return buildMetadata({
    title: city && service ? `Юристы по теме ${service.name} в городе ${city.name}` : "Страница не найдена",
    description:
      city && service
        ? `Проверенные юристы по теме «${service.name}» в городе ${city.name}: профили, ответы, публикации и документы.`
        : "Страница не найдена.",
    path: `/lawyers/${lawyerSlug}/${categorySlug}/`,
    isIndexable: canIndexLawyerListingPage({
      city,
      service,
      lawyerCount: lawyers.length,
      verifiedLawyerCount: lawyers.filter((lawyer) => lawyer.isVerified).length,
      faqCount: faqs.length,
      hasRelatedContent: questions.length > 0 || documents.length > 0,
      hasInternalLinks: true
    })
  });
}

export default async function LawyersCityCategoryPage({ params }: PageProps) {
  const { lawyerSlug, categorySlug } = await params;
  const [city, service] = await Promise.all([getCity(lawyerSlug), getService(categorySlug)]);
  if (!city || !service) notFound();

  const [lawyers, allQuestions, documents, serviceFaqs] = await Promise.all([
    getLawyers({ citySlug: city.slug, serviceSlug: service.slug }),
    getQuestions(service.id),
    getDocuments(service.id),
    getFaqs("SERVICE", service.id)
  ]);
  const questions = allQuestions.filter((question) => question.city?.slug === city.slug);
  const faqs = serviceFaqs.length >= 3 ? serviceFaqs : await getFaqs("GENERAL", "home");
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юристы", path: "/lawyers/" },
    { name: city.name, path: `/lawyers/${city.slug}/` },
    { name: service.name, path: `/lawyers/${city.slug}/${service.slug}/` }
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          legalServiceJsonLd({
            path: `/lawyers/${city.slug}/${service.slug}/`,
            name: `${service.name} в городе ${city.name}`,
            description: service.shortDescription,
            city,
            service,
            lawyers
          }),
          faqJsonLd(faqs)
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">
          Юристы по теме {service.name} в городе {city.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Сравните профили по опыту, статусу, ответам и публикациям. Если данных по странице мало, она остается noindex, follow.
        </p>
        <div className="mt-6">
          <QuestionCtaLink
            sourcePage={`/lawyers/${city.slug}/${service.slug}/`}
            defaultCityId={city.id}
            defaultServiceId={service.id}
          />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {lawyers.length ? (
            lawyers.map((lawyer) => <LawyerCard key={lawyer.id} lawyer={lawyer} compact />)
          ) : (
            <p className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-600">
              Профили юристов по этой теме временно недоступны. Вы можете задать вопрос через платформу.
            </p>
          )}
        </div>
      </section>
      <QuestionList questions={questions} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Публикации и документы по теме</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ...documents.slice(0, 3).map((item) => ({ href: `/documents/${item.slug}/`, title: item.title, text: item.description })),
            { href: "/problems/", title: "Правовой навигатор", text: "Выберите жизненную ситуацию, проверьте сроки, риски, документы и подходящих юристов." }
          ].map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg border border-line bg-white p-5 hover:border-trust">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
            </a>
          ))}
        </div>
      </section>
      <section data-seo-block="seo-text" className="bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Как выбрать специалиста</h2>
          <p className="mt-4 leading-8 text-zinc-700">
            Для локальной страницы важны реальные юристы, вопросы по теме, публикации, документы, FAQ и внутренняя перелинковка. Профили без подтверждения, контакты в публичном HTML и пустые страницы не используются для индексации.
          </p>
        </div>
      </section>
      <FaqBlock items={faqs} />
    </>
  );
}
