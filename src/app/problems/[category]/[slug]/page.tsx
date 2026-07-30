import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ZagsScenarioOverview } from "@/components/documents/ZagsScenarioOverview";
import { getLegalCategory } from "@/data/legal-categories";
import { getLegalProblem, legalProblems } from "@/data/legal-problems";
import type { LegalProblem } from "@/data/legal-problems";
import {
  getZagsScenario,
  ZAGS_PROBLEM_ROUTE,
  ZAGS_SCENARIO_CHOICES
} from "@/data/zags-route";
import type { ZagsScenario } from "@/data/zags-route";
import { breadcrumbJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
  searchParams?: Promise<{ scenario?: string }>;
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return legalProblems.map((problem) => ({ category: problem.categorySlug, slug: problem.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const problem = getLegalProblem(categorySlug, slug);
  if (!problem || categorySlug !== ZAGS_PROBLEM_ROUTE.categorySlug || slug !== ZAGS_PROBLEM_ROUTE.problemSlug) {
    return buildMetadata({
      title: "Ситуация не найдена",
      description: "Ситуация правового навигатора не найдена.",
      path: `/problems/${categorySlug}/${slug}/`,
      isIndexable: false
    });
  }

  return buildMetadata({
    title: problem.seoTitle,
    description: problem.seoDescription,
    path: `/problems/${problem.categorySlug}/${problem.slug}/`,
    isIndexable: true,
    searchParams: searchParams ? await searchParams : {}
  });
}

export default async function ProblemPage({ params, searchParams }: PageProps) {
  const { category: categorySlug, slug } = await params;
  const category = getLegalCategory(categorySlug);
  const problem = getLegalProblem(categorySlug, slug);
  if (
    !category
    || !problem
    || category.slug !== ZAGS_PROBLEM_ROUTE.categorySlug
    || problem.slug !== ZAGS_PROBLEM_ROUTE.problemSlug
  ) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const scenario = getZagsScenario(resolvedSearchParams.scenario);
  const problemPath = `/problems/${category.slug}/${problem.slug}/`;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: category.title, path: `/problems/${category.slug}/` },
    { name: "Брак и ЗАГС", path: problemPath }
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd(breadcrumbs),
        legalServiceJsonLd({ path: problemPath, name: "Брак и ЗАГС", description: problem.shortAnswer, lawyers: [] }),
        articleJsonLd(problem, category.title)
      ]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{category.title}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-5xl">Брак и ЗАГС</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            Выберите, что вам нужно сделать. Покажем только подходящие шаги и документы.
          </p>
        </header>

        {scenario ? (
          <ScenarioDetails problemPath={problemPath} scenario={scenario} />
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Сценарии маршрута Брак и ЗАГС">
              {ZAGS_SCENARIO_CHOICES.map((choice) => (
                <Link
                  key={choice.key}
                  href={`${problemPath}?scenario=${choice.key}`}
                  className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"
                >
                  <span className="text-lg font-semibold text-ink">{choice.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span>
                </Link>
              ))}
            </section>
            <ZagsScenarioOverview basePath={problemPath} queryKey="scenario" linkLabel="Открыть пошаговый маршрут" />
          </>
        )}

        {problem.lastReviewedAt ? (
          <p className="mt-6 text-xs leading-5 text-zinc-500">Юридическая проверка: {formatReviewDate(problem.lastReviewedAt)}.</p>
        ) : null}
      </article>
    </>
  );
}

function ScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ZagsScenario }) {
  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{scenario.shortTitle}</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2>
        </div>
        <Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">
          Назад к выбору
        </Link>
      </div>

      <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">
        {scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-line bg-zinc-50 p-4">
          <h3 className="text-xl font-semibold text-ink">Шаги</h3>
          <ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
            {scenario.steps.slice(0, 5).map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-trust text-xs font-bold text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-line bg-zinc-50 p-4">
          <h3 className="text-xl font-semibold text-ink">Документы</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
            {scenario.documents.map((document) => <li key={document}>- {document}</li>)}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-4">
        <InfoBox title="Основной документ" text={scenario.mainDocument} />
        <InfoBox title="Куда и как подать" text={scenario.filing} />
        <InfoBox title="Срок" text={scenario.term} />
        <InfoBox title="Госпошлина" text={scenario.fee} />
      </div>

      {scenario.warning ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
      ) : null}

      <div className="mt-6">
        <Link href={`/documents/${ZAGS_PROBLEM_ROUTE.documentSlug}/?variant=${scenario.key}#fill-online`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
          Перейти к подготовке данных
        </Link>
      </div>

      <section className="mt-6 border-t border-line pt-5">
        <h3 className="text-xl font-semibold text-ink">Правовые основания и формы</h3>
        <ul className="mt-3 grid gap-2 text-sm leading-6">
          {scenario.legalSources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="text-xl font-semibold text-ink">Частые вопросы</h3>
        <div className="mt-3 grid gap-3">
          {scenario.faq.slice(0, 4).map((item) => (
            <details key={item.question} className="rounded-lg border border-line bg-zinc-50 px-4">
              <summary className="flex min-h-11 cursor-pointer items-center py-3 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">{item.question}</summary>
              <p className="pb-4 text-sm leading-6 text-zinc-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </section>
  );
}

function InfoBox({ text, title }: { text: string; title: string }) {
  return (
    <section className="rounded-lg border border-line bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </section>
  );
}

function formatReviewDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function articleJsonLd(problem: LegalProblem, categoryName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: problem.h1,
    description: problem.description,
    articleSection: categoryName,
    dateModified: problem.lastReviewedAt,
    mainEntityOfPage: absoluteUrl(`/problems/${problem.categorySlug}/${problem.slug}/`)
  };
}
