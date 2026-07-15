import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerForm } from "@/components/AnswerForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleList, LinkGrid, QuestionList } from "@/components/ContentBlocks";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { ExpandableLawyerGrid } from "@/components/lawyers/ExpandableLawyerGrid";
import { QuestionModal } from "@/components/QuestionModal";
import { QuestionAnswerCard } from "@/components/questions/QuestionAnswerCard";
import { StickyCta } from "@/components/StickyCta";
import { breadcrumbJsonLd, faqJsonLd, qapageJsonLd } from "@/lib/jsonld";
import { formatQuestionAuthorName, formatQuestionDate, formatQuestionNumber, getQuestionCategory } from "@/lib/question-display";
import { buildMetadata, canIndexQuestionListingPage, canIndexQuestionPage, isIndexableQuestionAnswer } from "@/lib/seo";
import { getArticles, getCities, getCity, getFaqs, getLawyers, getPublicServiceLinks, getQuestion, getQuestions, getService, getServices } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/server-auth";
import type { Answer, City, Lawyer, Question, Service } from "@/lib/types";

type PageProps = {
  params: Promise<{ questionSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { questionSlug } = await params;
  const service = await getService(questionSlug);
  if (service) {
    const [questions, faqs] = await Promise.all([getQuestions(service.id), getFaqs("SERVICE", service.id)]);
    return buildMetadata({
      title: `Вопросы юристам по теме ${service.name} — ответы специалистов`,
      description: `Опубликованные вопросы по теме «${service.name}»: ответы юристов, похожие ситуации и обращение через платформу.`,
      path: `/questions/${service.slug}/`,
      isIndexable: questions.length > 0 && faqs.length >= 3
    });
  }

  const city = await getCity(questionSlug);
  if (city) {
    const [questions, lawyers, faqs] = await Promise.all([getQuestions(), getLawyers({ citySlug: city.slug }), getFaqs("GENERAL", "home")]);
    const cityQuestions = questions.filter((question) => question.city?.slug === city.slug);
    return buildMetadata({
      title: `Вопросы юристам в городе ${city.name} — публичные ответы`,
      description: `Опубликованные вопросы пользователей из города ${city.name}: модерация, ответы юристов и связанные темы права.`,
      path: `/questions/${city.slug}/`,
      isIndexable: canIndexQuestionListingPage({
        city,
        questionCount: cityQuestions.filter((question) => question.answers.length > 0).length,
        lawyerCount: lawyers.length,
        faqCount: faqs.length,
        hasInternalLinks: true
      })
    });
  }

  const question = await getQuestion(questionSlug);
  return buildMetadata({
    title: question ? `${question.title} — ответ юриста` : "Вопрос не найден",
    description: question ? questionDescription(question) : "Вопрос не найден.",
    path: `/questions/${questionSlug}/`,
    isIndexable: canIndexQuestionPage(question)
  });
}

export default async function QuestionPage({ params }: PageProps) {
  const { questionSlug } = await params;
  const serviceCategory = await getService(questionSlug);
  if (serviceCategory) {
    return <QuestionCategoryPage serviceSlug={serviceCategory.slug} />;
  }

  const cityCategory = await getCity(questionSlug);
  if (cityCategory) {
    return <QuestionCityPage citySlug={cityCategory.slug} />;
  }

  const question = await getQuestion(questionSlug);
  if (!question) notFound();

  const [similar, lawyers, articles, cities, services, faqs, session] = await Promise.all([
    getQuestions(question.serviceId ?? undefined),
    getLawyers({ serviceSlug: question.service?.slug }),
    getArticles(question.serviceId ?? undefined),
    getCities(),
    getServices(),
    getServiceOrGeneralFaqs(question.serviceId),
    getCurrentSession()
  ]);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Вопросы юристам", path: "/questions/" },
    { name: question.title, path: `/questions/${question.slug}/` }
  ];
  const publicAnswers = getPublicAnswers(question);
  const qaStructuredData = canIndexQuestionPage(question) ? qapageJsonLd({ ...question, answers: publicAnswers }) : null;

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), qaStructuredData, faqJsonLd(faqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">{question.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-zinc-600">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-ink">{getQuestionCategory(question)}</span>
          <span>{formatQuestionNumber(question.publicNumber)}</span>
          <span>{formatQuestionAuthorName(question.userName)}</span>
          <span>{formatQuestionDate(question.publishedAt ?? question.createdAt)}</span>
        </div>
        <p className="mt-5 text-lg leading-8 text-zinc-700">{question.questionText ?? question.text}</p>
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Ответы на странице носят информационный характер и зависят от документов, сроков и фактических обстоятельств.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/problems/" className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
            Смотреть ситуации
          </Link>
          <Link href="#question" className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            Задать вопрос
          </Link>
        </div>
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-ink">Ответы юристов</h2>
          <div className="mt-5 grid gap-4">
            {publicAnswers.map((answer) => (
              <QuestionAnswerCard
                key={answer.id}
                answer={answer}
                cities={cities}
                services={services}
                defaultCityId={question.cityId}
                defaultServiceId={question.serviceId}
                sourcePage={`/questions/${question.slug}/`}
              />
            ))}
            {publicAnswers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line bg-white p-6 text-sm leading-6 text-zinc-600">
                Ответы появятся после модерации. Вопрос без опубликованного качественного ответа не индексируется.
              </div>
            ) : null}
          </div>
        </section>
        <section id="answer" className="mt-8">
          <h2 className="text-2xl font-semibold text-ink">Ответить на вопрос</h2>
          <div className="mt-5">
            {session?.role === "LAWYER" || session?.role === "ADMIN" ? (
              <AnswerForm questionId={question.id} />
            ) : (
              <Link
                href={`/login/?next=${encodeURIComponent(`/questions/${question.slug}/#answer`)}`}
                className="inline-flex rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-trust"
              >
                Войти как юрист и ответить
              </Link>
            )}
          </div>
        </section>
        <section id="question" className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-2xl font-semibold text-ink">Задать свой вопрос</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Вопрос будет создан как отдельная сущность Question и появится публично только после модерации.
          </p>
          <div className="mt-5">
            <QuestionModal
              sourcePage={`/questions/${question.slug}/`}
              defaultCityId={question.cityId ?? undefined}
              defaultServiceId={question.serviceId ?? undefined}
              label="Задать свой вопрос"
            />
          </div>
        </section>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Юристы по этой теме</h2>
        <div className="mt-6">
          <ExpandableLawyerGrid lawyers={lawyers} />
        </div>
      </section>
      <QuestionList questions={similar.filter((item) => item.id !== question.id)} />
      <ArticleList articles={articles} />
      <FaqBlock items={faqs} />
      <StickyCta href="#question" label="Задать свой вопрос" source={`/questions/${question.slug}/`} />
    </>
  );
}

async function QuestionCategoryPage({ serviceSlug }: { serviceSlug: string }) {
  const service = await getService(serviceSlug);
  if (!service) notFound();

  const [questions, lawyers, articles, faqs] = await Promise.all([
    getQuestions(service.id),
    getLawyers({ serviceSlug: service.slug }),
    getArticles(service.id),
    getServiceOrGeneralFaqs(service.id)
  ]);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Вопросы юристам", path: "/questions/" },
    { name: service.name, path: `/questions/${service.slug}/` }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqJsonLd(faqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">Вопросы юристам по теме {service.name}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Подборка опубликованных вопросов и ответов юристов по теме. Новые вопросы проходят модерацию и не индексируются до проверки.
        </p>
        <div id="question" className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-2xl font-semibold text-ink">Задать вопрос по теме</h2>
          <div className="mt-5">
            <QuestionModal sourcePage={`/questions/${service.slug}/`} defaultServiceId={service.id} />
          </div>
        </div>
      </section>
      <QuestionList questions={questions} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Юристы по теме</h2>
        <div className="mt-6">
          <ExpandableLawyerGrid lawyers={lawyers} />
        </div>
      </section>
      <ArticleList articles={articles} />
      <SeoTextForQuestions serviceName={service.name} />
      <FaqBlock items={faqs} />
      <StickyCta href="#question" label="Задать вопрос" source={`/questions/${service.slug}/`} />
    </>
  );
}

async function QuestionCityPage({ citySlug }: { citySlug: string }) {
  const city = await getCity(citySlug);
  if (!city) notFound();

  const [allQuestions, lawyers, services, faqs] = await Promise.all([
    getQuestions(),
    getLawyers({ citySlug: city.slug }),
    getServices(),
    getFaqs("GENERAL", "home")
  ]);
  const questions = allQuestions.filter((question) => question.city?.slug === city.slug);
  const publicServiceLinks = getPublicServiceLinks(services);
  const indexableServiceLinks = await getIndexableQuestionCityServiceLinks({
    city,
    services: publicServiceLinks,
    questions,
    lawyers,
    fallbackFaqCount: faqs.length
  });
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Вопросы юристам", path: "/questions/" },
    { name: city.name, path: `/questions/${city.slug}/` }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqJsonLd(faqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">Вопросы юристам в городе {city.name}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Опубликованные вопросы по региону. Ветка становится публичной только после модерации вопроса и ответов.
        </p>
        <div className="mt-6">
          <QuestionModal sourcePage={`/questions/${city.slug}/`} defaultCityId={city.id} />
        </div>
      </section>
      <QuestionList questions={questions} />
      {indexableServiceLinks.length ? (
        <LinkGrid title={`Темы вопросов в городе ${city.name}`} items={indexableServiceLinks.slice(0, 12)} makeHref={(service) => `/questions/${city.slug}/${service.slug}/`} />
      ) : null}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Юристы в городе {city.name}</h2>
        <div className="mt-6">
          <ExpandableLawyerGrid lawyers={lawyers} filterBySelectedRegion={false} />
        </div>
      </section>
      <FaqBlock items={faqs} />
      <StickyCta href="#question" label="Задать вопрос" source={`/questions/${city.slug}/`} />
    </>
  );
}

function SeoTextForQuestions({ serviceName }: { serviceName: string }) {
  return (
    <section data-seo-block="seo-text" className="bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Как использовать ответы юристов по теме {serviceName}</h2>
        <p className="mt-4 leading-8 text-zinc-700">
          Вопросы помогают сравнить подходы специалистов и понять возможные документы, сроки и риски. Новые вопросы проходят модерацию, а ответы с контактами или рекламой не публикуются автоматически.
        </p>
      </div>
    </section>
  );
}

async function getServiceOrGeneralFaqs(serviceId?: string | null) {
  const serviceFaqs = serviceId ? await getFaqs("SERVICE", serviceId) : [];
  return serviceFaqs.length >= 3 ? serviceFaqs : getFaqs("GENERAL", "home");
}

async function getIndexableQuestionCityServiceLinks(input: {
  city: City;
  services: Service[];
  questions: Question[];
  lawyers: Lawyer[];
  fallbackFaqCount: number;
}) {
  const links = await Promise.all(
    input.services.map(async (service) => {
      const serviceFaqs = await getFaqs("SERVICE", service.id);
      const faqCount = serviceFaqs.length >= 3 ? serviceFaqs.length : input.fallbackFaqCount;
      const questionCount = input.questions.filter((question) => question.serviceId === service.id && question.answers.length > 0).length;
      const lawyerCount = input.lawyers.filter((lawyer) => lawyer.serviceSlugs.includes(service.slug)).length;

      return canIndexQuestionListingPage({
        city: input.city,
        service,
        questionCount,
        lawyerCount,
        faqCount,
        hasInternalLinks: true
      })
        ? service
        : null;
    })
  );

  return links.filter((service): service is Service => Boolean(service));
}

function getPublicAnswers(question: Question): Answer[] {
  return question.answers.filter(isIndexableQuestionAnswer);
}

function questionDescription(question: Question) {
  const topic = question.service?.name ? ` по теме «${question.service.name}»` : "";
  const city = question.city?.namePrepositional ? ` в ${question.city.namePrepositional}` : "";
  const base = question.summary || question.text;
  return truncate(`${question.title}. Ответ юриста${topic}${city}: ${base}`, 165);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}
