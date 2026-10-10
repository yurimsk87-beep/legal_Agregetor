import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getFamilyAdditiveLegalRules } from "@/data/family-additive-legal-review";
import { getFamilyAdditiveScenario, type FamilyAdditiveRoute } from "@/data/family-additive-routes";
import type { LegalProblem } from "@/data/legal-problems";
import { breadcrumbJsonLd, legalServiceJsonLd } from "@/lib/jsonld";

export function FamilyAdditiveProblemPage({
  categoryTitle,
  problem,
  route,
  scenarioKey
}: {
  categoryTitle: string;
  problem: LegalProblem;
  route: FamilyAdditiveRoute;
  scenarioKey?: string;
}) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getFamilyAdditiveScenario(route.problemSlug, scenarioKey);
  const rules = getFamilyAdditiveLegalRules(route.problemSlug);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] })]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase text-trust">{categoryTitle}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{route.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{route.intro}</p>
        </header>

        {scenario ? (
          <>
            <section className="mt-7 border-t-4 border-trust bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase text-trust">Выбранный путь</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">{scenario.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">{scenario.choiceDescription}</p>
                </div>
                <Link href={problemPath} className="inline-flex min-h-11 items-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link>
              </div>
            </section>
            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <Fact title="Основные шаги" items={scenario.steps} numbered />
              <Fact title="Что подготовить" items={scenario.documents} />
              <Fact title="Куда обращаться" items={[scenario.filing]} />
              <Fact title="Срок и расходы" items={[scenario.term, scenario.fee]} />
            </section>
            <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
            <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить документ</Link>
          </>
        ) : (
          <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Варианты решения">
            {Object.values(route.scenarios).map((item) => (
              <Link key={item.key} href={`${problemPath}?scenario=${item.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20">
                <span className="text-lg font-semibold text-ink">{item.title}</span>
                <span className="mt-2 block text-sm leading-6 text-zinc-600">{item.choiceDescription}</span>
              </Link>
            ))}
          </section>
        )}

        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-2xl font-semibold text-ink">Правовые основания</h2>
          <ul className="mt-4 grid gap-4 text-sm leading-6">
            {rules.map((rule) => (
              <li key={rule.id} className="border-l-2 border-line pl-3">
                <p className="font-medium text-ink">{rule.statement}</p>
                <p className="text-zinc-600">{rule.act}, {rule.article}. Граница применения: {rule.scope}</p>
                <p className="text-zinc-600">Ограничение: {rule.limitation}</p>
                <a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {route.legalReviewDate.split("-").reverse().join(".")}.</p>
        </section>
      </article>
    </>
  );
}

function Fact({ items, numbered, title }: { items: string[]; numbered?: boolean; title: string }) {
  const List = numbered ? "ol" : "ul";
  return <section className="border-t-4 border-zinc-300 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-ink">{title}</h2><List className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{items.map((item, index) => <li key={item}>{numbered ? `${index + 1}. ` : "- "}{item}</li>)}</List></section>;
}
