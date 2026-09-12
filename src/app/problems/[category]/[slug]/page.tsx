import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { DivorcePropertyScenarioOverview } from "@/components/documents/DivorcePropertyScenarioOverview";
import { GuardianshipScenarioOverview } from "@/components/documents/GuardianshipScenarioOverview";
import { ParentsChildScenarioOverview } from "@/components/documents/ParentsChildScenarioOverview";
import { ChildSupportScenarioOverview } from "@/components/documents/ChildSupportScenarioOverview";
import { ParentalRightsDeprivationScenarioOverview } from "@/components/documents/ParentalRightsDeprivationScenarioOverview";
import { ParentalRightsRestrictionScenarioOverview } from "@/components/documents/ParentalRightsRestrictionScenarioOverview";
import { ZagsScenarioOverview } from "@/components/documents/ZagsScenarioOverview";
import {
  DIVORCE_PROPERTY_GOALS,
  DIVORCE_PROPERTY_ROUTE,
  DIVORCE_PROPERTY_SCENARIO_CHOICES,
  getDivorcePropertyGoal,
  getDivorcePropertyScenario
} from "@/data/divorce-property-route";
import type { DivorcePropertyScenario } from "@/data/divorce-property-route";
import {
  GUARDIANSHIP_ROUTE,
  GUARDIANSHIP_SCENARIO_CHOICES,
  getGuardianshipScenario
} from "@/data/guardianship-route";
import type { GuardianshipScenario } from "@/data/guardianship-route";
import {
  getParentsChildScenario,
  PARENTS_CHILD_ROUTE,
  PARENTS_CHILD_SCENARIO_CHOICES
} from "@/data/parents-child-route";
import type { ParentsChildScenario } from "@/data/parents-child-route";
import {
  CHILD_SUPPORT_ROUTE,
  CHILD_SUPPORT_SCENARIO_CHOICES,
  getChildSupportScenario
} from "@/data/child-support-route";
import type { ChildSupportScenario } from "@/data/child-support-route";
import { CHILD_SUPPORT_REVIEWED_AT, getChildSupportRules } from "@/data/child-support-legal-review";
import { getParentalRightsDeprivationRules, PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT } from "@/data/parental-rights-deprivation-legal-review";
import {
  getParentalRightsDeprivationScenario,
  PARENTAL_RIGHTS_DEPRIVATION_ROUTE,
  PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_CHOICES
} from "@/data/parental-rights-deprivation-route";
import type { ParentalRightsDeprivationScenario } from "@/data/parental-rights-deprivation-route";
import { getParentalRightsRestrictionRules, PARENTAL_RIGHTS_RESTRICTION_REVIEWED_AT } from "@/data/parental-rights-restriction-legal-review";
import { getParentalRightsRestrictionScenario, PARENTAL_RIGHTS_RESTRICTION_ROUTE, PARENTAL_RIGHTS_RESTRICTION_SCENARIO_CHOICES } from "@/data/parental-rights-restriction-route";
import type { ParentalRightsRestrictionScenario } from "@/data/parental-rights-restriction-route";
import { getParentsChildRules, PARENTS_CHILD_REVIEWED_AT } from "@/data/parents-child-legal-review";
import {
  getGuardianshipLegalReviewDate,
  isGuardianshipLegalReviewFullyPrimaryVerified
} from "@/data/guardianship-legal-review";
import {
  getDivorcePropertyLegalReviewDate,
  isDivorcePropertyLegalReviewFullyPrimaryVerified
} from "@/data/divorce-property-legal-review";
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
  searchParams?: Promise<{ goal?: string; scenario?: string }>;
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return legalProblems.map((problem) => ({ category: problem.categorySlug, slug: problem.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const problem = getLegalProblem(categorySlug, slug);
  if (!problem) {
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
  if (!category || !problem) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  if (problem.slug === DIVORCE_PROPERTY_ROUTE.problemSlug) {
    return <DivorcePropertyProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === GUARDIANSHIP_ROUTE.problemSlug) {
    return <GuardianshipProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PARENTS_CHILD_ROUTE.problemSlug) {
    return <ParentsChildProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === CHILD_SUPPORT_ROUTE.problemSlug) {
    return <ChildSupportProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PARENTAL_RIGHTS_DEPRIVATION_ROUTE.problemSlug) {
    return <ParentalRightsDeprivationProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PARENTAL_RIGHTS_RESTRICTION_ROUTE.problemSlug) {
    return <ParentalRightsRestrictionProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug !== ZAGS_PROBLEM_ROUTE.problemSlug) notFound();
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

function ParentalRightsRestrictionProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getParentalRightsRestrictionScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }];
  return <>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} />
    <Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Ограничение родительских прав</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Определите источник опасности для ребёнка. При непосредственной угрозе маршрут остановит обычную подготовку и покажет срочные действия.</p></header>
      {scenario ? <ParentalRightsRestrictionScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии ограничения родительских прав">{PARENTAL_RIGHTS_RESTRICTION_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ParentalRightsRestrictionScenarioOverview basePath={problemPath} /></>}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PARENTAL_RIGHTS_RESTRICTION_REVIEWED_AT)}. Любой судебный черновик требует юридической проверки.</p>
    </article>
  </>;
}

function ParentalRightsRestrictionScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ParentalRightsRestrictionScenario }) {
  return <section className="mt-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Защита прав ребёнка</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div>
    <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div>
    <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
    <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить ситуацию</Link>
    <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getParentalRightsRestrictionRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Проверенный источник</a></li>)}</ul></section>
  </section>;
}

function ParentalRightsDeprivationProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getParentalRightsDeprivationScenario(searchParams.scenario);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Лишение родительских прав</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Проверьте предполагаемое основание, статус ребёнка и заявителя. При угрозе ребёнку маршрут сразу покажет срочные действия.</p>
        </header>
        {scenario ? <ParentalRightsDeprivationScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии лишения родительских прав">{PARENTAL_RIGHTS_DEPRIVATION_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ParentalRightsDeprivationScenarioOverview basePath={problemPath} /></>}
        <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PARENTAL_RIGHTS_DEPRIVATION_REVIEWED_AT)}. Любой судебный черновик требует юридической проверки.</p>
      </article>
    </>
  );
}

function ParentalRightsDeprivationScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ParentalRightsDeprivationScenario }) {
  return (
    <section className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Защита прав ребёнка</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div>
      <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div>
      <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
      <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить ситуацию</Link>
      <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getParentalRightsDeprivationRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Проверенный источник</a></li>)}</ul></section>
    </section>
  );
}

function ChildSupportProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getChildSupportScenario(searchParams.scenario);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Алименты на ребёнка</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите задачу. Покажем применимый порядок, безопасный тип результата и следующий подтверждённый шаг.</p>
        </header>
        {scenario ? <ChildSupportScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии алиментов на ребёнка">{CHILD_SUPPORT_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ChildSupportScenarioOverview basePath={problemPath} /></>}
        <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(CHILD_SUPPORT_REVIEWED_AT)}. Конкретный суд, нотариус и подразделение ФССП автоматически не определяются.</p>
      </article>
    </>
  );
}

function ChildSupportScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ChildSupportScenario }) {
  return (
    <section className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Алименты на несовершеннолетнего ребёнка</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div>
      <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div>
      <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
      <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить документ</Link>
      <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getChildSupportRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Проверенный источник</a></li>)}</ul></section>
    </section>
  );
}

function ParentsChildProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getParentsChildScenario(searchParams.scenario);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Родители и ребёнок после развода</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">ПравоПоиск поможет определить порядок действий, если после развода возник вопрос о месте жительства ребёнка, общении со вторым родителем или исполнении уже принятого решения.</p>
        </header>
        {scenario ? <ParentsChildScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии родителей и ребёнка после развода">{PARENTS_CHILD_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ParentsChildScenarioOverview basePath={problemPath} /></>}
        <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PARENTS_CHILD_REVIEWED_AT)}. Конкретный суд и территориальная компетенция автоматически не определяются.</p>
      </article>
    </>
  );
}

function ParentsChildScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ParentsChildScenario }) {
  return (
    <section className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Спор или соглашение о ребёнке</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div>
      <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div>
      <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
      <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить документ</Link>
      <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getParentsChildRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Проверенный источник</a></li>)}</ul></section>
    </section>
  );
}

function GuardianshipProblemPage({
  categoryTitle,
  problem,
  searchParams
}: {
  categoryTitle: string;
  problem: LegalProblem;
  searchParams: { scenario?: string };
}) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getGuardianshipScenario(searchParams.scenario);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd(breadcrumbs),
        legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }),
        articleJsonLd(problem, categoryTitle)
      ]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Опека и попечительство над ребёнком</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите задачу. Покажем применимый порядок, персональный перечень и один основной документ.</p>
        </header>

        {scenario ? (
          <GuardianshipScenarioDetails problemPath={problemPath} scenario={scenario} />
        ) : (
          <>
            <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии опеки над ребёнком">
              {GUARDIANSHIP_SCENARIO_CHOICES.map((choice) => (
                <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20">
                  <span className="text-lg font-semibold text-ink">{choice.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span>
                </Link>
              ))}
            </section>
            <GuardianshipScenarioOverview basePath={problemPath} />
          </>
        )}

        <p className="mt-7 text-xs leading-5 text-zinc-500">
          Последняя документированная сверка: {formatReviewDate(getGuardianshipLegalReviewDate(scenario?.key))}.
          {isGuardianshipLegalReviewFullyPrimaryVerified(scenario?.key)
            ? " Все используемые первичные источники проверены."
            : " Недоступные первичные источники и региональные ограничения отмечены в правовом реестре документа."}
        </p>
      </article>
    </>
  );
}

function GuardianshipScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: GuardianshipScenario }) {
  return (
    <section className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Опека над несовершеннолетним</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div>
        <Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link>
      </div>
      <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section>
        <section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной документ" text={scenario.mainDocument} /><InfoBox title="Пошлина и расходы" text={scenario.fee} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Куда и как подать" text={scenario.filing} /></div>
      {scenario.warning ? <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div> : null}
      <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить документ</Link>
      <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-2 text-sm leading-6">{scenario.legalSources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{source.title}</a></li>)}</ul></section>
    </section>
  );
}

function DivorcePropertyProblemPage({
  categoryTitle,
  problem,
  searchParams
}: {
  categoryTitle: string;
  problem: LegalProblem;
  searchParams: { goal?: string; scenario?: string };
}) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getDivorcePropertyScenario(searchParams.scenario);
  const goal = scenario?.goal ?? getDivorcePropertyGoal(searchParams.goal);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd(breadcrumbs),
        legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }),
        articleJsonLd(problem, categoryTitle)
      ]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-5xl">Развод и раздел имущества</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            Сначала выберите цель. Затем покажем два подходящих порядка и один основной документ.
          </p>
        </header>

        {scenario ? (
          <DivorceScenarioDetails problemPath={problemPath} scenario={scenario} />
        ) : goal ? (
          <section className="mt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-trust">{goal === "divorce" ? "Развестись" : "Разделить имущество"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Выберите порядок</h2>
              </div>
              <Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">
                Назад к целям
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {DIVORCE_PROPERTY_SCENARIO_CHOICES.filter((choice) => choice.goal === goal).map((choice) => (
                <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20">
                  <span className="text-lg font-semibold text-ink">{choice.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Цель маршрута">
              {DIVORCE_PROPERTY_GOALS.map((item) => (
                <Link key={item.key} href={`${problemPath}?goal=${item.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20">
                  <span className="text-xl font-semibold text-ink">{item.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{item.description}</span>
                </Link>
              ))}
            </section>
            <DivorcePropertyScenarioOverview basePath={problemPath} />
          </>
        )}

        <p className="mt-7 text-xs leading-5 text-zinc-500">
          Последняя документированная сверка: {formatReviewDate(getDivorcePropertyLegalReviewDate(scenario?.key))}.
          {isDivorcePropertyLegalReviewFullyPrimaryVerified(scenario?.key)
            ? " Все используемые первичные официальные источники проверены."
            : " Статус недоступных первичных и контрольных источников раскрыт на странице документа."}
        </p>
      </article>
    </>
  );
}

function DivorceScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: DivorcePropertyScenario }) {
  return (
    <section className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{scenario.goal === "divorce" ? "Расторжение брака" : "Раздел имущества"}</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2>
        </div>
        <Link href={`${problemPath}?goal=${scenario.goal}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">
          Назад к выбору
        </Link>
      </div>

      <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">
        {scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="border-t-4 border-trust bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Основные шаги</h3>
          <ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">
            {scenario.steps.slice(0, 5).map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}
          </ol>
        </section>
        <section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Приложения</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
            {scenario.documents.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </section>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoBox title="Основной документ" text={scenario.mainDocument} />
        <InfoBox title="Платёж" text={scenario.fee} />
        <InfoBox title="Срок" text={scenario.term} />
        <InfoBox title="Куда и как подать" text={scenario.filing} />
      </div>

      {scenario.warning ? <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div> : null}

      <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
        Подготовить документ
      </Link>

      {scenario.goal === "divorce" ? (
        <Link href="/problems/semya-i-deti/roditeli-i-rebenok-posle-razvoda/" className="mt-4 flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">
          Решить вопросы о ребёнке после развода
        </Link>
      ) : null}

      <section className="mt-7 border-t border-line pt-5">
        <h3 className="text-xl font-semibold text-ink">Правовые основания</h3>
        <ul className="mt-3 grid gap-2 text-sm leading-6">
          {scenario.legalSources.map((source) => (
            <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">{source.title}</a></li>
          ))}
        </ul>
      </section>
    </section>
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
          Подготовить документ
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
