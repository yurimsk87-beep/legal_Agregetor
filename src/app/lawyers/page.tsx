import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filters } from "@/components/Filters";
import { FaqBlock } from "@/components/FaqBlock";
import { JsonLd } from "@/components/JsonLd";
import { LawyerCard } from "@/components/LawyerCard";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { breadcrumbJsonLd, faqJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { buildMetadata, hasIndexBlockingParams, type SearchParams } from "@/lib/seo";
import { canIndexRootListingPage, getCities, getFaqs, getLawyers, getLawyerSpecializationServices } from "@/lib/repositories";

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export const revalidate = 900;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const hasLawyers = await canIndexRootListingPage("lawyers");

  return buildMetadata({
    title: "Найти юриста — каталог проверенных профилей",
    description: "Поиск юристов и адвокатов по городу, специализации, статусу, стажу, ответам, публикациям и проверенным сведениям профиля.",
    path: "/lawyers/",
    isIndexable: hasLawyers && !hasIndexBlockingParams(params),
    searchParams: params
  });
}

export default async function LawyersCatalogPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const [cities, services, faqs] = await Promise.all([getCities(), getLawyerSpecializationServices(), getFaqs("GENERAL", "home")]);
  const lawyers = await getLawyers({
    status: typeof params.status === "string" ? params.status : undefined,
    price: typeof params.price === "string" ? params.price : undefined
  });

  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юристы", path: "/lawyers/" }
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          lawyers.length
            ? legalServiceJsonLd({
                path: "/lawyers/",
                name: "Найти юриста",
                description: "Проверенные публичные профили юристов без личных контактов.",
                lawyers
              })
            : null,
          faqJsonLd(faqs)
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto min-w-0 max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-4xl font-semibold text-ink">Найти юриста</h1>
          <p className="mt-4 text-lg leading-8 text-zinc-700">
            Сравните специалистов по городу, специализациям, статусу, стажу, ответам, публикациям и проверенным сведениям профиля. Публичные контакты юристов не показываются.
          </p>
        </div>
        <div className="mt-8 min-w-0">
          <Filters cities={cities} services={services} basePath="/lawyers/" />
        </div>
        <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid min-w-0 gap-4">
            {lawyers.length ? (
              lawyers.map((lawyer) => <LawyerCard key={lawyer.id} lawyer={lawyer} compact />)
            ) : (
              <p className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-600">
                Пока нет юристов с точной специализацией. Вы можете задать вопрос, чтобы получить ответ после модерации.
              </p>
            )}
          </div>
          <aside className="min-w-0 h-fit rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Не нашли похожую ситуацию?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Задайте вопрос: после модерации его смогут увидеть зарегистрированные юристы.
            </p>
            <div className="mt-4">
              <QuestionCtaLink sourcePage="/lawyers/" variant="secondary" />
            </div>
          </aside>
        </div>
      </section>
      <FaqBlock items={faqs} />
    </>
  );
}
