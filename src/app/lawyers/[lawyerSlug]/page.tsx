import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileQuestion, ShieldCheck, Star } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LinkGrid, QuestionList } from "@/components/ContentBlocks";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { LawyerCard } from "@/components/LawyerCard";
import { LawyerProfileViewTracker } from "@/components/LawyerProfileViewTracker";
import { LeadForm } from "@/components/LeadForm";
import { LawyerReviews } from "@/components/LawyerReviews";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { breadcrumbJsonLd, faqJsonLd, lawyerPersonJsonLd, legalServiceJsonLd, localBusinessJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata, canIndexLawyerListingPage, canIndexLawyerProfilePage, descriptionForLawyer, titleForLawyer } from "@/lib/seo";
import { redactForbiddenContacts } from "@/lib/contact-safety";
import { getFullName, getStatusLabel } from "@/lib/sample-data";
import { getArticles, getCity, getDocuments, getFaqs, getLawyer, getLawyers, getPublicServiceLinks, getQuestions, getServices } from "@/lib/repositories";
import type { City, Lawyer, Question, Service } from "@/lib/types";

type PageProps = {
  params: Promise<{ lawyerSlug: string }>;
};

type CityServiceStat = {
  service: Service;
  lawyerCount: number;
  questionCount: number;
};

const INITIAL_PUBLIC_REVIEW_LIMIT = 3;

export const revalidate = 900;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lawyerSlug } = await params;
  const city = await getCity(lawyerSlug);
  if (city) {
    const [lawyers, questions, cityFaqs, generalFaqs] = await Promise.all([
      getLawyers({ citySlug: city.slug }),
      getQuestions(undefined, city.id, { take: 60 }),
      getFaqs("CITY", city.id),
      getFaqs("GENERAL", "home")
    ]);
    const visibleFaqs = cityFaqs.length >= 3 ? cityFaqs : generalFaqs;
    const cityQuestions = questions.filter((question) => question.answers.length > 0);
    const pageTitle = `Юристы в ${city.namePrepositional} - консультация онлайн и проверенные профили`;
    const pageDescription = `Найдите юриста в ${city.namePrepositional}: проверенные профили, специализации, стаж, ответы на вопросы, FAQ и удобное обращение через ПравоПоиск.`;
    const metadata = buildMetadata({
      title: pageTitle,
      description: pageDescription,
      path: `/lawyers/${city.slug}/`,
      isIndexable: canIndexLawyerListingPage({
        city,
        lawyerCount: lawyers.length,
        verifiedLawyerCount: lawyers.filter((lawyer) => lawyer.isVerified).length,
        faqCount: visibleFaqs.length,
        hasRelatedContent: cityQuestions.length > 0,
        hasInternalLinks: true
      })
    });

    return {
      ...metadata,
      keywords: [
        `юристы ${city.name}`,
        `юрист ${city.name}`,
        `адвокат ${city.name}`,
        `юридическая консультация ${city.name}`,
        `юридическая помощь ${city.name}`,
        city.region
      ]
    };
  }

  const lawyer = await getLawyer(lawyerSlug);
  if (!lawyer) {
    return buildMetadata({
      title: "Юрист не найден",
      description: "Профиль юриста не найден.",
      path: `/lawyers/${lawyerSlug}/`,
      isIndexable: false
    });
  }

  const fullName = getFullName(lawyer);
  const cityName = lawyer.cities[0]?.name ?? "Россия";

  return buildMetadata({
    title: titleForLawyer(fullName, getStatusLabel(lawyer.status), cityName),
    description: descriptionForLawyer(fullName, cityName, lawyer.services.map((service) => service.name), lawyer.isVerified),
    path: `/lawyers/${lawyer.slug}/`,
    isIndexable: canIndexLawyerProfilePage(lawyer)
  });
}

export default async function LawyerOrCityPage({ params }: PageProps) {
  const { lawyerSlug } = await params;
  const city = await getCity(lawyerSlug);
  if (city) return <LawyersCityPage citySlug={city.slug} />;

  const lawyer = await getLawyer(lawyerSlug);
  if (!lawyer) notFound();

  const [lawyerFaqs, serviceFaqs, generalFaqs, questions, similar] = await Promise.all([
    getFaqs("LAWYER", lawyer.id),
    getFaqs("SERVICE", lawyer.services[0]?.id),
    getFaqs("GENERAL", "home"),
    getQuestions(lawyer.services[0]?.id),
    getLawyers({ citySlug: lawyer.citySlugs[0], serviceSlug: lawyer.serviceSlugs[0] })
  ]);
  const faqs = lawyerFaqs.length >= 3 ? lawyerFaqs : serviceFaqs.length >= 3 ? serviceFaqs : generalFaqs;
  const fullName = getFullName(lawyer);
  const cityName = lawyer.cities[0]?.name ?? "Россия";
  const ratingLabel = lawyer.reviewCount && lawyer.reviewCount > 0 ? formatProfileRating(lawyer.rating) : null;
  const prefetchedReviews = lawyer.reviews ?? [];
  const approvedReviews = prefetchedReviews.slice(0, INITIAL_PUBLIC_REVIEW_LIMIT).map((review) => ({
    ...review,
    userName: redactForbiddenContacts(review.userName),
    text: redactForbiddenContacts(review.text)
  }));
  const approvedReviewCount = lawyer.reviewCount && lawyer.reviewCount > 0 ? lawyer.reviewCount : undefined;
  const hasMoreReviews =
    prefetchedReviews.length > approvedReviews.length ||
    Boolean(approvedReviewCount && approvedReviewCount > approvedReviews.length);
  const profileAbout = distinctProfileText(lawyer.profile?.about, lawyer.description);
  const specializationLines = splitProfileLines(lawyer.profile?.specializationText);
  const servicePriceLines = splitProfileLines(lawyer.profile?.servicesAndPricesText);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юристы", path: "/lawyers/" },
    { name: fullName, path: `/lawyers/${lawyer.slug}/` }
  ];

  return (
    <>
      <LawyerProfileViewTracker
        lawyerId={lawyer.id}
        lawyerSlug={lawyer.slug}
        cityId={lawyer.cities[0]?.id}
        serviceId={lawyer.services[0]?.id}
      />
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), lawyerPersonJsonLd(lawyer), faqJsonLd(faqs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="min-w-0 rounded-lg border border-line bg-white p-6 shadow-sm">
              <div className="flex min-w-0 flex-col gap-6 sm:flex-row">
                {lawyer.photoUrl ? (
                  <Image src={lawyer.photoUrl} alt={`Фото профиля ${fullName}`} width={112} height={112} className="h-28 w-28 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-wheat text-3xl font-semibold text-ink">
                    {lawyer.firstName[0]}
                    {lawyer.lastName[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-3xl font-semibold text-ink">{fullName}</h1>
                    {lawyer.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-sm font-medium text-trust">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Профиль проверен
                      </span>
                    ) : null}
                    {ratingLabel ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-700">
                        <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                        Рейтинг {ratingLabel}/10
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 break-words text-zinc-600">
                    {getStatusLabel(lawyer.status)} · {lawyer.experienceYears} лет опыта · {cityName}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                    Публичные контакты специалиста не показываются. В профиле доступны специализации, опыт, вопросы по теме, материалы по специализации и подтвержденные сведения.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lawyer.services.map((service) => (
                      <Link key={service.slug} href={`/lawyers/${lawyer.cities[0]?.slug ?? "rossiya"}/${service.slug}/`} className="max-w-full break-words rounded-md border border-line px-3 py-1.5 text-sm text-zinc-700 hover:border-trust">
                        {service.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-700">
                    <span>Отзывы проходят модерацию</span>
                    <span>{questions.length} вопросов по теме</span>
                  </div>
                  <div className="mt-6 flex min-w-0 flex-wrap gap-2">
                    <QuestionCtaLink
                      sourcePage={`/lawyers/${lawyer.slug}/`}
                      defaultCityId={lawyer.cities[0]?.id}
                      defaultServiceId={lawyer.services[0]?.id}
                      lawyerId={lawyer.id}
                      variant="primary"
                    />
                    <Link href="#contact-lawyer" className="inline-flex max-w-full min-w-0 items-center rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-trust">
                      Обратиться к юристу
                    </Link>
                    <Link href="#topic-questions" className="inline-flex max-w-full min-w-0 items-center gap-2 break-words rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-trust">
                      <FileQuestion className="h-4 w-4" aria-hidden="true" />
                      Вопросы по специализации
                    </Link>
                    <Link href="/problems/" className="inline-flex max-w-full min-w-0 break-words rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-trust">
                      Правовой навигатор
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <section className="mt-8 rounded-lg border border-line bg-white p-6">
              <h2 className="text-2xl font-semibold text-ink">Описание и опыт</h2>
              <p className="mt-4 break-words leading-8 text-zinc-700">{redactForbiddenContacts(lawyer.description)}</p>
              {profileAbout ? <p className="mt-4 break-words leading-8 text-zinc-700">{redactForbiddenContacts(profileAbout)}</p> : null}
              <h3 className="mt-6 font-semibold text-ink">Образование</h3>
              <p className="mt-2 break-words text-zinc-700">{redactForbiddenContacts(lawyer.education)}</p>
              {specializationLines.length ? (
                <>
                  <h3 className="mt-6 font-semibold text-ink">Специализация</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {specializationLines.map((item) => (
                      <span key={item} className="max-w-full break-words rounded-md border border-line px-3 py-1.5 text-sm text-zinc-700">
                        {redactForbiddenContacts(item)}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
            <section className="mt-8 rounded-lg border border-line bg-white p-6">
              <h2 className="text-2xl font-semibold text-ink">Услуги и стоимость</h2>
              {servicePriceLines.length ? (
                <div className="mt-5 grid min-w-0 gap-3">
                  {servicePriceLines.map((line, index) => {
                    const { title, price } = splitPriceLine(line);

                    return (
                      <div key={`${title}-${index}`} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-line pb-3 text-sm">
                        <span className="min-w-0 break-words font-medium text-ink">{redactForbiddenContacts(title)}</span>
                        {price ? <span className="break-words text-zinc-700">{redactForbiddenContacts(price)}</span> : null}
                      </div>
                    );
                  })}
                </div>
              ) : lawyer.priceItems?.length ? (
                <div className="mt-5 grid min-w-0 gap-3">
                  {lawyer.priceItems.map((item) => (
                    <div key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-line pb-3 text-sm">
                      <span className="min-w-0 break-words font-medium text-ink">{item.title}</span>
                      <span className="text-zinc-700">от {item.priceFrom.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-zinc-600">Стоимость услуг уточняется после описания задачи.</p>
              )}
            </section>
            <LawyerReviews
              lawyerId={lawyer.id}
              initialReviews={approvedReviews}
              initialHasMore={hasMoreReviews}
              totalCount={approvedReviewCount}
            />
            <section className="mt-8 rounded-lg border border-line bg-white p-6">
              <h2 className="text-2xl font-semibold text-ink">Формат работы</h2>
              <p className="mt-4 text-sm leading-6 text-zinc-600">Доступный формат работы уточняется после описания задачи.</p>
            </section>
          </div>
          <div className="grid min-w-0 h-fit gap-4">
            <aside className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-ink">Задать вопрос</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Вопрос будет создан как публичный материал и пройдет модерацию перед публикацией.
              </p>
              <div className="mt-4">
                <QuestionCtaLink
                  sourcePage={`/lawyers/${lawyer.slug}/`}
                  defaultCityId={lawyer.cities[0]?.id}
                  defaultServiceId={lawyer.services[0]?.id}
                  lawyerId={lawyer.id}
                  variant="secondary"
                />
              </div>
            </aside>
            <aside id="contact-lawyer" className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-ink">Обратиться к юристу</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Это приватное обращение к выбранному юристу. Заявку сначала проверит администратор платформы, а контакты не передаются юристу автоматически.
              </p>
              <details className="mt-4 min-w-0">
                <summary className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-trust">
                  Обратиться к юристу
                </summary>
                <div className="mt-4 min-w-0">
                  <LeadForm
                    cities={lawyer.cities}
                    services={lawyer.services}
                    sourcePage={`/lawyers/${lawyer.slug}/`}
                    sourceType="LAWYER_PROFILE"
                    lawyerId={lawyer.id}
                    defaultCityId={lawyer.cities[0]?.id}
                    defaultServiceId={lawyer.services[0]?.id}
                    showPlatformNotice
                    compact
                  />
                </div>
              </details>
            </aside>
          </div>
        </div>
      </section>
      <section id="topic-questions">
        <QuestionList questions={questions} />
      </section>
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Похожие юристы</h2>
        <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-2">
          {similar
            .filter((item) => item.id !== lawyer.id)
            .slice(0, 4)
            .map((item) => (
              <LawyerCard key={item.id} lawyer={item} compact />
            ))}
        </div>
      </section>
      <FaqBlock items={faqs} />
    </>
  );
}

async function LawyersCityPage({ citySlug }: { citySlug: string }) {
  const city = await getCity(citySlug);
  if (!city) notFound();

  const [lawyers, services, questions, faqs] = await Promise.all([
    getLawyers({ citySlug: city.slug }),
    getServices(),
    getQuestions(undefined, city.id, { take: 60 }),
    getFaqs("CITY", city.id)
  ]);
  const visibleFaqs = faqs.length >= 3 ? faqs : await getFaqs("GENERAL", "home");
  const publicServiceLinks = getPublicServiceLinks(services);
  const indexableServiceLinks = await getIndexableLawyerCityServiceLinks({
    city,
    services: publicServiceLinks,
    lawyers,
    questions
  });
  const serviceStats = buildCityServiceStats(lawyers, publicServiceLinks, questions);
  const topServiceLinks = indexableServiceLinks.length ? indexableServiceLinks : serviceStats.map((item) => item.service);
  const verifiedLawyerCount = lawyers.filter((lawyer) => lawyer.isVerified).length;
  const seoText = buildCityLawyerSeoText({ city, lawyers, serviceStats, questions });
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юристы", path: "/lawyers/" },
    { name: city.name, path: `/lawyers/${city.slug}/` }
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          legalServiceJsonLd({
            path: `/lawyers/${city.slug}/`,
            name: `Юристы в ${city.namePrepositional}`,
            description: `Проверенные профили юристов и адвокатов в ${city.namePrepositional}: специализации, стаж, вопросы, FAQ и обращение через платформу.`,
            city,
            lawyers
          }),
          localBusinessJsonLd(city, lawyers, `/lawyers/${city.slug}/`),
          lawyerCityItemListJsonLd(city, lawyers),
          faqJsonLd(visibleFaqs)
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="bg-white">
        <div className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">
            {city.region}
            {city.federalDistrict ? ` · ${city.federalDistrict}` : ""}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Юристы в {city.namePrepositional}
          </h1>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-zinc-700">
            Найдите юриста или адвоката в {city.namePrepositional}: сравните специализации, стаж, проверенные профили,
            вопросы с ответами и удобный формат обращения через ПравоПоиск.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <QuestionCtaLink sourcePage={`/lawyers/${city.slug}/`} defaultCityId={city.id} label={`Задать вопрос юристу в ${city.namePrepositional}`} />
            <Link href="#city-lawyers" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Смотреть профили
            </Link>
            <Link href="#city-specializations" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Выбрать специализацию
            </Link>
          </div>
          <div className="mt-8 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CitySeoStat value={lawyers.length.toLocaleString("ru-RU")} label={formatPlural(lawyers.length, "профиль юриста", "профиля юристов", "профилей юристов")} />
            <CitySeoStat value={verifiedLawyerCount.toLocaleString("ru-RU")} label={formatPlural(verifiedLawyerCount, "проверенный профиль", "проверенных профиля", "проверенных профилей")} />
            <CitySeoStat value={serviceStats.length.toLocaleString("ru-RU")} label={formatPlural(serviceStats.length, "направление практики", "направления практики", "направлений практики")} />
            <CitySeoStat value={questions.length.toLocaleString("ru-RU")} label={formatPlural(questions.length, "публичный вопрос", "публичных вопроса", "публичных вопросов")} />
          </div>
        </div>
      </section>
      <section id="city-lawyers" className="mx-auto min-w-0 max-w-7xl scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-ink">Профили юристов в {city.namePrepositional}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            В карточках видны город, специализации, стаж, статус проверки и формат обращения. Публичные контакты не выводятся:
            сначала можно описать ситуацию, получить первичный разбор и затем перейти к профилю подходящего специалиста.
          </p>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {lawyers.length ? (
            lawyers.map((lawyer) => <LawyerCard key={lawyer.id} lawyer={lawyer} compact />)
          ) : (
            <p className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-600">
              Профили юристов по этому городу временно недоступны. Вы можете задать вопрос через платформу.
            </p>
          )}
        </div>
      </section>
      {topServiceLinks.length ? (
        <div id="city-specializations" className="scroll-mt-28">
          <LinkGrid title={`Специализации юристов в ${city.namePrepositional}`} items={topServiceLinks.slice(0, 12)} makeHref={(service) => `/lawyers/${city.slug}/${service.slug}/`} />
        </div>
      ) : null}
      <CityLawyerSelectionSection city={city} />
      <CityLegalScenariosSection city={city} serviceStats={serviceStats} />
      <CityConsultationPrepSection city={city} />
      <QuestionList questions={questions} />
      <section data-seo-block="seo-text" className="bg-zinc-50">
        <div className="mx-auto min-w-0 max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Локальная юридическая помощь</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Юридическая консультация в {city.namePrepositional}: что важно проверить</h2>
          <div className="mt-4 space-y-4 text-base leading-8 text-zinc-700">
            {seoText.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph} className="break-words">{paragraph}</p>
            ))}
          </div>
        </div>
      </section>
      <FaqBlock items={visibleFaqs} />
    </>
  );
}

function CitySeoStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-zinc-50 p-4">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{label}</p>
    </div>
  );
}

function CityLawyerSelectionSection({ city }: { city: City }) {
  const factors = [
    {
      title: "Совпадение специализации",
      text: `Выбирайте юриста в ${city.namePrepositional} по теме задачи: семья, наследство, недвижимость, трудовой спор, долги, бизнес или суд. Узкая практика обычно важнее общей формулировки «юрист по всем вопросам».`
    },
    {
      title: "Проверенные сведения профиля",
      text: "Смотрите статус проверки, образование, стаж, описание опыта и закреплённые направления практики. Это помогает быстрее понять, подходит ли специалист под вашу ситуацию."
    },
    {
      title: "Ответы и публичная экспертиза",
      text: "Вопросы и ответы показывают стиль работы: насколько юрист объясняет сроки, риски, документы и варианты действий без лишних обещаний."
    },
    {
      title: "Понятный следующий шаг",
      text: "Хороший первичный ответ помогает решить, достаточно ли общей консультации, нужен ли анализ документов или стоит готовить претензию, жалобу, иск или переговорную позицию."
    }
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Как выбрать юриста в {city.namePrepositional}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Для локальной страницы важны не только фамилии специалистов, но и признаки качества: профильная практика,
          понятный опыт, ответы на вопросы и отсутствие публичного сбора контактов.
        </p>
        <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {factors.map((factor) => (
            <article key={factor.title} className="rounded-lg border border-line bg-zinc-50 p-5">
              <h3 className="font-semibold text-ink">{factor.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{factor.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CityLegalScenariosSection({ city, serviceStats }: { city: City; serviceStats: CityServiceStat[] }) {
  const popularServices = serviceStats.slice(0, 6);
  const scenarios = popularServices.length
    ? popularServices.map((item) => ({
        title: item.service.name,
        text:
          item.lawyerCount > 0
            ? `В разделе ${item.lawyerCount} ${formatPlural(item.lawyerCount, "специалист", "специалиста", "специалистов")} по направлению. Можно сравнить профили, задать вопрос и перейти к детальному разбору.`
            : "По направлению есть опубликованные вопросы и первичные разборы. Можно задать свой вопрос и уточнить подходящий формат помощи."
      }))
    : [
        { title: "Семейные и наследственные вопросы", text: "Развод, дети, алименты, имущество супругов, вступление в наследство и споры между наследниками." },
        { title: "Недвижимость и жильё", text: "Сделки, доли, аренда, управляющие компании, заливы, качество услуг и право пользования жильём." },
        { title: "Долги, кредиты и банкротство", text: "Взыскание задолженности, судебные приказы, приставы, реструктуризация и оценка рисков банкротства." },
        { title: "Работа, бизнес и суд", text: "Увольнение, выплаты, договоры, претензии, арбитраж, исполнительное производство и представительство в суде." }
      ];

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-ink">С какими вопросами обращаются в {city.namePrepositional}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
        Раздел помогает найти юриста под конкретную правовую ситуацию, а не просто просмотреть общий список специалистов по городу.
      </p>
      <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <article key={scenario.title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-ink">{scenario.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{scenario.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CityConsultationPrepSection({ city }: { city: City }) {
  const items = [
    {
      title: "Кратко опишите ситуацию",
      text: "Что произошло, кто участвует в споре, какой результат нужен и есть ли уже переписка, претензия, суд или исполнительное производство."
    },
    {
      title: "Соберите даты и суммы",
      text: "Сроки часто влияют на перспективу дела: дата договора, увольнения, ДТП, получения решения, приказа, претензии или ответа госоргана."
    },
    {
      title: "Подготовьте документы",
      text: "Договоры, расписки, чеки, переписка, судебные акты, постановления приставов, выписки, фото и другие подтверждения фактов ускоряют разбор."
    },
    {
      title: "Укажите город и регион",
      text: `Для задач, связанных с регионом ${city.region}, важны подсудность, местные органы, суды, нотариусы, МФЦ и порядок обращения в конкретной ситуации.`
    }
  ];

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink">Что подготовить перед консультацией</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Чем точнее вводные, тем быстрее юрист сможет оценить сроки, риски, документы и ближайший безопасный шаг.
        </p>
        <div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.title} className="rounded-lg border border-line bg-white p-5">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

async function getIndexableLawyerCityServiceLinks(input: {
  city: City;
  services: Service[];
  lawyers: Lawyer[];
  questions: Question[];
}) {
  const links = await Promise.all(
    input.services.map(async (service) => {
      const serviceLawyers = input.lawyers.filter((lawyer) => lawyer.serviceSlugs.includes(service.slug));
      const serviceQuestions = input.questions.filter((question) => question.serviceId === service.id && question.answers.length > 0);
      const [serviceFaqs, generalFaqs, articles, documents] = await Promise.all([
        getFaqs("SERVICE", service.id),
        getFaqs("GENERAL", "home"),
        getArticles(service.id),
        getDocuments(service.id)
      ]);
      const faqCount = serviceFaqs.length >= 3 ? serviceFaqs.length : generalFaqs.length;

      return canIndexLawyerListingPage({
        city: input.city,
        service,
        lawyerCount: serviceLawyers.length,
        verifiedLawyerCount: serviceLawyers.filter((lawyer) => lawyer.isVerified).length,
        faqCount,
        hasRelatedContent: serviceQuestions.length > 0 || articles.length > 0 || documents.length > 0,
        hasInternalLinks: true
      })
        ? service
        : null;
    })
  );

  return links.filter((service): service is Service => Boolean(service));
}

function buildCityServiceStats(lawyers: Lawyer[], services: Service[], questions: Question[]): CityServiceStat[] {
  const serviceBySlug = new Map(services.map((service) => [service.slug, service]));
  const lawyerCountBySlug = new Map<string, number>();
  const questionCountByServiceId = new Map<string, number>();

  lawyers.forEach((lawyer) => {
    lawyer.serviceSlugs.forEach((slug) => {
      if (!serviceBySlug.has(slug)) return;
      lawyerCountBySlug.set(slug, (lawyerCountBySlug.get(slug) ?? 0) + 1);
    });
  });

  questions.forEach((question) => {
    if (!question.serviceId) return;
    questionCountByServiceId.set(question.serviceId, (questionCountByServiceId.get(question.serviceId) ?? 0) + 1);
  });

  return services
    .map((service) => ({
      service,
      lawyerCount: lawyerCountBySlug.get(service.slug) ?? 0,
      questionCount: questionCountByServiceId.get(service.id) ?? 0
    }))
    .filter((item) => item.lawyerCount > 0 || item.questionCount > 0)
    .sort((itemA, itemB) => itemB.lawyerCount - itemA.lawyerCount || itemB.questionCount - itemA.questionCount || itemA.service.name.localeCompare(itemB.service.name, "ru"));
}

function buildCityLawyerSeoText({
  city,
  lawyers,
  serviceStats,
  questions
}: {
  city: City;
  lawyers: Lawyer[];
  serviceStats: CityServiceStat[];
  questions: Question[];
}) {
  const verifiedLawyerCount = lawyers.filter((lawyer) => lawyer.isVerified).length;
  const popularServices = serviceStats.slice(0, 8).map((item) => item.service.name);
  const popularServiceText = popularServices.length ? popularServices.join(", ") : "семейные споры, наследство, недвижимость, трудовые вопросы, долги и судебные дела";

  return [
    normalizeCitySeoText(city.seoText),
    `Каталог юристов в ${city.namePrepositional} помогает начать с сути проблемы: выбрать специализацию, посмотреть профили, оценить стаж и задать вопрос через платформу. На странице учитываются город ${city.name}, регион ${city.region}${city.federalDistrict ? ` и ${city.federalDistrict}` : ""}, чтобы пользователь быстрее нашёл локально релевантного специалиста.`,
    `Сейчас в разделе ${lawyers.length} ${formatPlural(lawyers.length, "профиль", "профиля", "профилей")}, из них ${verifiedLawyerCount} ${formatPlural(verifiedLawyerCount, "проверенный", "проверенных", "проверенных")}. Для выбора полезно смотреть не только общий стаж, но и совпадение практики с задачей: ${popularServiceText}.`,
    `Если ситуация неочевидная, лучше сначала задать вопрос юристу в ${city.namePrepositional}. В вопросе стоит указать даты, суммы, документы, город, желаемый результат и уже предпринятые действия. Такой формат помогает получить первичный разбор: какие права есть, какие сроки важны, какие риски возможны и какие документы понадобятся.`,
    `Для сложных дел в регионе ${city.region} может потребоваться детальная консультация, анализ документов или сопровождение в суде. Публичный ответ помогает сориентироваться, а профиль юриста позволяет перейти к приватному обращению, если нужен полноценный разбор, подготовка претензии, иска, жалобы, договора или позиции для переговоров.`,
    questions.length
      ? `В городе уже есть опубликованные вопросы по правовым ситуациям: они показывают реальные формулировки проблем, типовые риски и подход юристов к первичному ответу. Перед отправкой обращения полезно посмотреть похожие кейсы и выбрать профильного специалиста.`
      : `Если похожих публичных вопросов пока мало, можно создать новый вопрос: после модерации он поможет получить первичный ориентир и пополнит базу полезных локальных разборов для жителей города.`
  ].join("\n\n");
}

function normalizeCitySeoText(text: string) {
  return text
    .replace(/Q&A-маршрут/gi, "маршрут вопрос-ответ")
    .replace(/fake-rating/gi, "искусственных рейтинговых");
}

function lawyerCityItemListJsonLd(city: City, lawyers: Lawyer[]) {
  if (!lawyers.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Юристы в ${city.namePrepositional}`,
    itemListElement: lawyers.slice(0, 12).map((lawyer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/lawyers/${lawyer.slug}/`),
      item: {
        "@type": "Person",
        name: getFullName(lawyer),
        jobTitle: getStatusLabel(lawyer.status),
        url: absoluteUrl(`/lawyers/${lawyer.slug}/`),
        areaServed: city.name,
        knowsAbout: lawyer.services.map((service) => service.name)
      }
    }))
  };
}

function formatPlural(value: number, one: string, few: string, many: string) {
  const mod10 = Math.abs(value) % 10;
  const mod100 = Math.abs(value) % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function formatProfileRating(value?: number | null) {
  if (!value || value <= 0) return null;

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Math.min(value, 10));
}

function splitProfileLines(value?: string | null) {
  if (!value) return [];

  return value
    .split(/\n+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitPriceLine(value: string) {
  const normalized = value.replace(/\s+[—–]\s+/g, " - ");
  const [title, ...priceParts] = normalized.split(/\s+-\s+/);
  const price = priceParts.join(" - ").trim();

  return {
    title: (title || value).trim(),
    price
  };
}

function distinctProfileText(value?: string | null, compareWith?: string | null) {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, " ").trim();
  const comparison = compareWith?.replace(/\s+/g, " ").trim();
  return normalized && normalized !== comparison ? value : null;
}
