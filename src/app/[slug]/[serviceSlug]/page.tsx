import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleList, Checklist, QuestionList, SeoText } from "@/components/ContentBlocks";
import { FaqBlock } from "@/components/FaqBlock";
import { Filters } from "@/components/Filters";
import { JsonLd } from "@/components/JsonLd";
import { ExpandableLawyerGrid } from "@/components/lawyers/ExpandableLawyerGrid";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { StickyCta } from "@/components/StickyCta";
import { breadcrumbJsonLd, faqJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { buildMetadata, shouldIncludeInSitemap, type SearchParams } from "@/lib/seo";
import type { SeoPage } from "@/lib/types";
import {
  getArticles,
  getCityServiceSeoIndexability,
  getCities,
  getCity,
  getDocuments,
  getFaqs,
  getLegalScenario,
  getNextBestActions,
  getLawyers,
  getLawyerSpecializationServices,
  getQuestions,
  getSeoMerge,
  getSeoPage,
  getService,
} from "@/lib/repositories";

type PageProps = {
  params: Promise<{ slug: string; serviceSlug: string }>;
  searchParams?: Promise<SearchParams>;
};

const informationalSections: Record<string, string> = {
  "chto-delat-esli": "Что делать, если",
  instrukcii: "Инструкции",
  oshibki: "Ошибки",
  sroki: "Сроки",
  riski: "Риски",
  dokazatelstva: "Доказательства",
  zhaloba: "Жалоба",
  pretenziya: "Претензия",
  otkaz: "Отказ",
  posledstviya: "Последствия",
  compare: "Сравнение",
  slovar: "Словарь",
  zakony: "Законы",
  life: "Жизненные ситуации",
  sudy: "Суды",
  online: "Онлайн",
  proverka: "Проверка"
};

export const revalidate = 900;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug: citySlug, serviceSlug } = await params;
  if (citySlug === "documents" || citySlug === "problems") notFound();
  const query = searchParams ? await searchParams : undefined;
  const [city, service] = await Promise.all([getCity(citySlug), getService(serviceSlug)]);

  if (!city || !service) {
    const sectionTitle = informationalSections[citySlug];
    if (!sectionTitle) {
      const merge = await getSeoMerge(`/${citySlug}/${serviceSlug}/`);
      if (merge) {
        return buildMetadata({
          title: "Страница объединена с основным разделом",
          description: merge.reason,
          path: merge.newUrl ?? `/${citySlug}/${serviceSlug}/`,
          isIndexable: false
        });
      }

      notFound();
    }

    const scenario = await getLegalScenario(serviceSlug);
    if (scenario) {
      return buildMetadata({
        title: `${scenario.title} — что делать, документы, сроки, риски`,
        description: `${scenario.problem} ${scenario.deadlines}`,
        path: `/${citySlug}/${serviceSlug}/`,
        isIndexable: shouldIncludeInSitemap(scenario),
        searchParams: query
      });
    }

    const h1 = `${sectionTitle}: ${humanizeSlug(serviceSlug)}`;
    return buildMetadata({
      title: `${h1} — юридическая инструкция`,
      description: "Проблема, сроки, документы, риски, частые ошибки и следующий шаг для получения юридической помощи.",
      path: `/${citySlug}/${serviceSlug}/`,
      isIndexable: false,
      searchParams: query
    });
  }

  const cityServiceSeo = await getCityServiceSeoIndexability(city, service, query);
  const seo = cityServiceSeo.seo;
  const fallbackPage = {
    title: `${service.name} в ${city.namePrepositional} — юристы и консультация`,
    description: `Подберите юриста по направлению «${service.name}» в ${city.namePrepositional}. Сравните специализацию, опыт и подтвержденные сведения профиля.`,
    seoText: `${service.fullDescription}\n\n${city.seoText}`
  };
  const page = seo ? sanitizeLandingSeoPage(seo, fallbackPage) : null;

  return buildMetadata({
    title: page?.title ?? fallbackPage.title,
    description: page?.description ?? fallbackPage.description,
    path: `/${city.slug}/${service.slug}/`,
    // Страницы «город + услуга» закрыты от индексации (тонкие/шаблонные, dev-юристы).
    isIndexable: false,
    searchParams: query
  });
}

export default async function CityServicePage({ params }: PageProps) {
  const { slug: citySlug, serviceSlug } = await params;
  if (citySlug === "documents" || citySlug === "problems") notFound();
  const [city, service, cities, services] = await Promise.all([
    getCity(citySlug),
    getService(serviceSlug),
    getCities(),
    getLawyerSpecializationServices()
  ]);

  if (!city || !service) {
    const sectionTitle = informationalSections[citySlug];
    if (!sectionTitle) {
      const merge = await getSeoMerge(`/${citySlug}/${serviceSlug}/`);
      if (merge?.redirectType === "REDIRECT_301" && merge.newUrl) {
        permanentRedirect(merge.newUrl);
      }
      notFound();
    }
    const scenario = await getLegalScenario(serviceSlug);
    const [actions, faqs] = await Promise.all([
      getNextBestActions("SITUATION"),
      getServiceOrGeneralFaqs(scenario?.serviceId)
    ]);
    return (
      <InformationalTopic
        sectionSlug={citySlug}
        topicSlug={serviceSlug}
        sectionTitle={sectionTitle}
        scenario={scenario}
        actions={actions}
        faqs={faqs}
      />
    );
  }

  const [seo, cityFaqs, serviceFaqs, lawyers, articles, questions, documents] = await Promise.all([
    getSeoPage("CITY_SERVICE", `${city.slug}/${service.slug}`),
    getFaqs("CITY_SERVICE", `${city.id}:${service.id}`),
    getFaqs("SERVICE", service.id),
    getLawyers({ citySlug: city.slug, serviceSlug: service.slug }),
    getArticles(service.id),
    getQuestions(service.id, city.id),
    getDocuments(service.id)
  ]);
  const faqs = cityFaqs.length >= 3 ? cityFaqs : serviceFaqs;
  const fallbackPage = {
    id: `fallback-city-service-${city.slug}-${service.slug}`,
    type: "CITY_SERVICE" as const,
    slug: `${city.slug}/${service.slug}`,
    cityId: city.id,
    serviceId: service.id,
    title: `${service.name} в ${city.namePrepositional} — юристы и консультация`,
    description: `Подберите юриста по направлению «${service.name}» в ${city.namePrepositional}.`,
    h1: `Юристы по направлению «${service.name}» в ${city.namePrepositional}`,
    seoText: `${service.fullDescription}\n\n${city.seoText}`,
    canonical: `/${city.slug}/${service.slug}/`,
    isIndexable: false,
    seoScore: 0,
    seoMaturity: "COLLECTING_DATA" as const
  };
  const page = seo ? sanitizeLandingSeoPage(seo, fallbackPage) : fallbackPage;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: city.name, path: `/${city.slug}/` },
    { name: service.name, path: `/${city.slug}/${service.slug}/` }
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          legalServiceJsonLd({
            path: `/${city.slug}/${service.slug}/`,
            name: page.h1,
            description: page.description,
            city,
            service,
            lawyers
          }),
          faqJsonLd(faqs)
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="bg-zinc-50">
        <div className="mx-auto grid min-w-0 max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-zinc-700">
              <ShieldCheck className="h-4 w-4 text-trust" aria-hidden="true" />
              Релевантные юристы: {lawyers.length}
            </div>
            <h1 className="mt-6 break-words text-4xl font-semibold text-ink">{page.h1}</h1>
            <p className="mt-4 max-w-3xl break-words text-lg leading-8 text-zinc-700">{page.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-700">
              <span className="max-w-full break-words rounded-md bg-white px-3 py-2">Средняя консультация: {averagePrice(lawyers).toLocaleString("ru-RU")} ₽</span>
              <span className="max-w-full break-words rounded-md bg-white px-3 py-2">Проверенных: {lawyers.filter((lawyer) => lawyer.isVerified).length}</span>
              <span className="max-w-full break-words rounded-md bg-white px-3 py-2">Профили проходят проверку</span>
            </div>
          </div>
          <div id="question" className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Задать вопрос юристу</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Опишите ситуацию в разделе вопросов. Вопрос пройдет модерацию перед публикацией.
            </p>
            <div className="mt-4">
              <QuestionCtaLink
                sourcePage={`/${city.slug}/${service.slug}/`}
                defaultCityId={city.id}
                defaultServiceId={service.id}
                label="Задать вопрос юристу"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Filters cities={cities} services={services} basePath={`/${city.slug}/${service.slug}/`} />
        <div className="mt-8 min-w-0">
          {lawyers.length ? (
            <ExpandableLawyerGrid lawyers={lawyers} filterBySelectedRegion={false} />
          ) : (
            <p className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-600">
              Профили юристов по этой теме временно недоступны. Вы можете задать вопрос через платформу.
            </p>
          )}
        </div>
      </section>
      <Checklist
        title="Какие вопросы решают юристы"
        items={[
          `Оценка перспектив по теме «${service.name}» с учетом документов и сроков.`,
          "Подготовка претензии, заявления, иска, жалобы или правовой позиции.",
          "Переговоры со второй стороной, органом, работодателем, банком или страховой.",
          "Представительство в суде и сопровождение исполнения решения."
        ]}
      />
      <Checklist
        title="Когда обращаться срочно"
        items={[
          "Истекает срок подачи заявления, жалобы или апелляции.",
          "Есть риск потери денег, имущества, работы или процессуальной позиции.",
          "Получили повестку, претензию, иск, постановление или отказ.",
          "Нужно подписать документ, последствия которого непонятны."
        ]}
      />
      <Checklist
        title="Частые ошибки и риски самостоятельного решения"
        items={[
          "Использовать шаблон без проверки подсудности, сроков и доказательств.",
          "Заявить неверное требование и потерять время на исправление.",
          "Не приложить ключевые документы или раскрыть лишнюю информацию.",
          "Оценивать юриста только по общей цене, без опыта по теме и городу."
        ]}
      />
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Документы и маршрут решения</h2>
        <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-3">
          {[
            ...documents.slice(0, 3).map((item) => ({ title: item.title, href: `/documents/${item.slug}/`, text: item.description })),
            { title: "Инструменты", href: "/tools/", text: "Проверьте сроки, риски и подготовьте данные перед обращением." },
            { title: "Правовой навигатор", href: "/problems/", text: "Найдите жизненную ситуацию и получите понятный маршрут действий." }
          ].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg border border-line bg-white p-5 hover:border-trust">
              <FileText className="h-5 w-5 text-trust" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
      <SeoText title="Как выбрать специалиста" text={page.seoText} />
      <QuestionList questions={questions} />
      <ArticleList articles={articles} />
      <FaqBlock items={faqs} />
      <StickyCta href="#question" label="Задать вопрос юристу" source={`/${city.slug}/${service.slug}/`} />
    </>
  );
}

function InformationalTopic({
  sectionSlug,
  topicSlug,
  sectionTitle,
  scenario,
  actions,
  faqs
}: {
  sectionSlug: string;
  topicSlug: string;
  sectionTitle: string;
  scenario: Awaited<ReturnType<typeof getLegalScenario>>;
  actions: Awaited<ReturnType<typeof getNextBestActions>>;
  faqs: Awaited<ReturnType<typeof getFaqs>>;
}) {
  const h1 = scenario ? `${sectionTitle}: ${scenario.title}` : `${sectionTitle}: ${humanizeSlug(topicSlug)}`;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: sectionTitle, path: `/${sectionSlug}/` },
    { name: scenario?.title ?? humanizeSlug(topicSlug), path: `/${sectionSlug}/${topicSlug}/` }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), faqJsonLd(faqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {scenario ? "Материал собран по проверенному юридическому сценарию" : "Раздел дополняется практическими материалами и примерами"}
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-ink">{h1}</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-700">
          {scenario
            ? scenario.problem
            : "Маршрут решения: понять проблему, проверить сроки, собрать документы, оценить риски, узнать ориентир по цене и найти юриста под задачу. Если ситуация срочная, оставьте вопрос, и мы поможем выбрать следующий шаг."}
        </p>
        {scenario ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-2xl font-semibold text-ink">Что это значит</h2>
              <p className="mt-3 leading-7 text-zinc-700">{scenario.explanation}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-2xl font-semibold text-ink">Сроки</h2>
              <p className="mt-3 leading-7 text-zinc-700">{scenario.deadlines}</p>
            </div>
          </div>
        ) : null}
        <Checklist
          title={scenario ? "Документы" : "Что сделать прямо сейчас"}
          items={
            scenario?.documents ?? [
              "Зафиксируйте даты, документы и переписку.",
              "Не подписывайте новые документы, если не понимаете последствия.",
              "Оцените сроки обращения и риск пропуска процессуального срока.",
              "Опишите ситуацию юристу и приложите ключевые материалы."
            ]
          }
        />
        {scenario ? <Checklist title="Риски" items={scenario.risks} /> : null}
        {actions.length ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-5">
            <h2 className="text-2xl font-semibold text-ink">Следующий шаг</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {actions.slice(0, 4).map((action) => (
                <Link key={action.id} href={action.url} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust hover:text-trust">
                  {action.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <div className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-2xl font-semibold text-ink">Проверить ситуацию</h2>
          <div className="mt-5">
            <QuestionCtaLink sourcePage={`/${sectionSlug}/${topicSlug}/`} defaultServiceId={scenario?.serviceId ?? undefined} label="Задать вопрос юристу" />
          </div>
        </div>
      </section>
      <FaqBlock items={faqs} />
    </>
  );
}

function averagePrice(lawyers: Array<{ consultationPrice?: number | null }>) {
  const prices = lawyers.map((lawyer) => lawyer.consultationPrice).filter((price): price is number => Boolean(price));
  if (prices.length === 0) return 0;
  return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
}

async function getServiceOrGeneralFaqs(serviceId?: string | null) {
  const serviceFaqs = serviceId ? await getFaqs("SERVICE", serviceId) : [];
  return serviceFaqs.length >= 3 ? serviceFaqs : getFaqs("GENERAL", "home");
}

function humanizeSlug(slug: string) {
  return slug.replace(/-/g, " ");
}

function sanitizeLandingSeoPage<T extends SeoPage>(
  page: T,
  fallback: Pick<SeoPage, "title" | "description" | "seoText">
): T {
  return {
    ...page,
    title: safeLandingSeoCopy(page.title, fallback.title),
    description: safeLandingSeoCopy(page.description, fallback.description),
    seoText: safeLandingSeoCopy(page.seoText, fallback.seoText)
  };
}

function safeLandingSeoCopy(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return /\b(reviewCount|ratingValue|AggregateRating)\b|отзыв|рейтинг|звезд|лучши|топ/i.test(value) ? fallback : value;
}
