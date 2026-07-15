import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { QuestionList } from "@/components/ContentBlocks";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { ExpandableLawyerGrid } from "@/components/lawyers/ExpandableLawyerGrid";
import { QuestionModal } from "@/components/QuestionModal";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { buildMetadata, canIndexQuestionListingPage } from "@/lib/seo";
import { getCity, getFaqs, getLawyers, getQuestions, getService } from "@/lib/repositories";

type PageProps = {
  params: Promise<{ questionSlug: string; categorySlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { questionSlug, categorySlug } = await params;
  const [city, service] = await Promise.all([getCity(questionSlug), getService(categorySlug)]);
  const [allQuestions, lawyers, serviceFaqs, generalFaqs] =
    city && service
      ? await Promise.all([
          getQuestions(service.id),
          getLawyers({ citySlug: city.slug, serviceSlug: service.slug }),
          getFaqs("SERVICE", service.id),
          getFaqs("GENERAL", "home")
        ])
      : [[], [], [], []];
  const questions = city ? allQuestions.filter((question) => question.city?.slug === city.slug) : [];
  const visibleFaqs = serviceFaqs.length >= 3 ? serviceFaqs : generalFaqs;

  return buildMetadata({
    title: city && service ? `Вопросы по теме ${service.name} в городе ${city.name}` : "Вопросы не найдены",
    description:
      city && service
        ? `Опубликованные вопросы по теме «${service.name}» в городе ${city.name}: модерация и публичные ответы юристов.`
        : "Раздел вопросов не найден.",
    path: `/questions/${questionSlug}/${categorySlug}/`,
    isIndexable: canIndexQuestionListingPage({
      city,
      service,
      questionCount: questions.filter((question) => question.answers.length > 0).length,
      lawyerCount: lawyers.length,
      faqCount: visibleFaqs.length,
      hasInternalLinks: true
    })
  });
}

export default async function QuestionCityCategoryPage({ params }: PageProps) {
  const { questionSlug, categorySlug } = await params;
  const [city, service] = await Promise.all([getCity(questionSlug), getService(categorySlug)]);
  if (!city || !service) notFound();

  const [allQuestions, lawyers, faqs] = await Promise.all([
    getQuestions(service.id),
    getLawyers({ citySlug: city.slug, serviceSlug: service.slug }),
    getFaqs("SERVICE", service.id)
  ]);
  const questions = allQuestions.filter((question) => question.city?.slug === city.slug);
  const visibleFaqs = faqs.length >= 3 ? faqs : await getFaqs("GENERAL", "home");
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Вопрос-ответ", path: "/questions/" },
    { name: city.name, path: `/questions/${city.slug}/` },
    { name: service.name, path: `/questions/${city.slug}/${service.slug}/` }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqJsonLd(visibleFaqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section id="question" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">
          Вопросы по теме {service.name} в городе {city.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Эта страница индексируется только при достаточном объеме опубликованных вопросов, полезных ответов и внутренней перелинковки.
        </p>
        <div className="mt-6">
          <QuestionModal
            sourcePage={`/questions/${city.slug}/${service.slug}/`}
            defaultCityId={city.id}
            defaultServiceId={service.id}
          />
        </div>
      </section>
      <QuestionList questions={questions} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Юристы по теме</h2>
        <div className="mt-6">
          <ExpandableLawyerGrid lawyers={lawyers} filterBySelectedRegion={false} />
        </div>
      </section>
      <FaqBlock items={visibleFaqs} />
    </>
  );
}
