import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ZagsApplicationHelper } from "@/components/documents/ZagsApplicationHelper";
import { ZagsScenarioOverview } from "@/components/documents/ZagsScenarioOverview";
import { getNavigatorDocument, navigatorDocuments } from "@/data/documents";
import {
  getZagsScenario,
  ZAGS_PROBLEM_ROUTE,
  ZAGS_SCENARIO_CHOICES
} from "@/data/zags-route";
import type { ZagsScenario, ZagsScenarioKey } from "@/data/zags-route";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ documentSlug: string }>;
  searchParams?: Promise<{ variant?: string }>;
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return navigatorDocuments.map((document) => ({ documentSlug: document.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { documentSlug } = await params;
  const document = getNavigatorDocument(documentSlug);
  if (!document || document.slug !== ZAGS_PROBLEM_ROUTE.documentSlug) notFound();

  return buildMetadata({
    title: "Заявление в ЗАГС: формы и порядок заполнения",
    description: "Выберите процедуру ЗАГС, проверьте форму, документы, пошлину и льготы, затем подготовьте сведения для официального заявления.",
    path: `/documents/${document.slug}/`,
    isIndexable: true,
    searchParams: searchParams ? await searchParams : {}
  });
}

export default async function DocumentPage({ params, searchParams }: PageProps) {
  const { documentSlug } = await params;
  const document = getNavigatorDocument(documentSlug);
  if (!document || document.slug !== ZAGS_PROBLEM_ROUTE.documentSlug) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const scenario = getZagsScenario(resolvedSearchParams.variant);
  const documentPath = `/documents/${document.slug}/`;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" },
    { name: "Заявление в ЗАГС", path: documentPath }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentWebPageJsonLd(documentPath)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Документы ЗАГС</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">
            {scenario ? `Заявление в ЗАГС: ${scenario.shortTitle.toLowerCase()}` : "Заявление в ЗАГС: выберите процедуру"}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            {scenario
              ? scenario.description[0]
              : "Для разных обращений применяются разные утверждённые формы. Выберите цель, чтобы увидеть подходящий бланк, порядок подачи и помощник по подготовке данных."}
          </p>
          {scenario ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#fill-online" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                Подготовить данные для заявления
              </Link>
              <Link href={documentPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">
                Выбрать другую процедуру
              </Link>
            </div>
          ) : null}
        </header>

        {scenario ? (
          <ZagsScenarioDetails scenario={scenario} />
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Варианты заявления в ЗАГС">
              {ZAGS_SCENARIO_CHOICES.map((choice) => (
                <Link
                  key={choice.key}
                  href={`${documentPath}?variant=${choice.key}`}
                  className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"
                >
                  <span className="text-lg font-semibold text-ink">{choice.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span>
                </Link>
              ))}
            </section>
            <ZagsScenarioOverview basePath={documentPath} queryKey="variant" linkLabel="Открыть подготовку данных" />
          </>
        )}
      </article>
    </>
  );
}

function ZagsScenarioDetails({ scenario }: { scenario: ZagsScenario }) {
  return (
    <>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <ZagsDocumentFact title="Официальная форма" text={scenario.forms.map((form) => `Форма N ${form.number}: ${form.purpose}.`).join(" ")} />
        <ZagsDocumentFact title="Куда и как подать" text={scenario.filing} />
        <ZagsDocumentFact title="Срок" text={scenario.term} />
        <ZagsDocumentFact title="Госпошлина" text={scenario.fee} />
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-ink">Что подготовить</h2>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-700">
          {scenario.documents.map((item) => <li key={item}>- {item}</li>)}
        </ul>
        {scenario.warning ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
        ) : null}
      </section>

      <div className="mt-6">
        <ZagsApplicationHelper scenarioKey={scenario.key as ZagsScenarioKey} />
      </div>

      <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold text-ink">Правовые основания</h2>
        <ul className="mt-4 grid gap-2 text-sm leading-6">
          {scenario.legalSources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <FaqBlock faq={scenario.faq} />
    </>
  );
}

function ZagsDocumentFact({ text, title }: { text: string; title: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-700">{text}</p>
    </section>
  );
}

function FaqBlock({ faq }: { faq: Array<{ question: string; answer: string }> }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-ink">Частые вопросы</h2>
      <div className="mt-5 grid gap-3">
        {faq.map((item) => (
          <details key={item.question} className="group rounded-lg border border-line bg-white px-5 shadow-sm">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span aria-hidden="true" className="text-zinc-400 transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <p className="pb-4 text-sm leading-6 text-zinc-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function documentWebPageJsonLd(path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Заявление в ЗАГС: формы и порядок заполнения",
    description: "Формы, документы, пошлины, льготы и порядок подготовки сведений для обращения в ЗАГС.",
    url: absoluteUrl(path)
  };
}
