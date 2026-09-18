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
import { PaternityEstablishmentScenarioOverview } from "@/components/documents/PaternityEstablishmentScenarioOverview";
import { PaternityContestScenarioOverview } from "@/components/documents/PaternityContestScenarioOverview";
import { AdoptionScenarioOverview } from "@/components/documents/AdoptionScenarioOverview";
import { ChildTravelScenarioOverview } from "@/components/documents/ChildTravelScenarioOverview";
import { ChildNameScenarioOverview } from "@/components/documents/ChildNameScenarioOverview";
import { ParentalRightsRestorationScenarioOverview } from "@/components/documents/ParentalRightsRestorationScenarioOverview";
import { ParentalRightsRestrictionCancellationScenarioOverview } from "@/components/documents/ParentalRightsRestrictionCancellationScenarioOverview";
import { ParentalDisagreementsScenarioOverview } from "@/components/documents/ParentalDisagreementsScenarioOverview";
import { AdditionalChildExpensesScenarioOverview } from "@/components/documents/AdditionalChildExpensesScenarioOverview";
import { SpousalSupportScenarioOverview } from "@/components/documents/SpousalSupportScenarioOverview";
import { PrenuptialAgreementScenarioOverview } from "@/components/documents/PrenuptialAgreementScenarioOverview";
import { InvalidMarriageScenarioOverview } from "@/components/documents/InvalidMarriageScenarioOverview";
import { ComplexMaritalPropertyScenarioOverview } from "@/components/documents/ComplexMaritalPropertyScenarioOverview";
import { SURROGACY_ORIGIN_REVIEWED_AT, getSurrogacyOriginRules } from "@/data/surrogacy-origin-legal-review";
import { SURROGACY_ORIGIN_ROUTE, SURROGACY_ORIGIN_KEYS, SURROGACY_ORIGIN_SCENARIOS, getSurrogacyOriginScenario } from "@/data/surrogacy-origin-route";
import { INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT, getInternationalFamilyDisputesRules } from "@/data/international-family-disputes-legal-review";
import { INTERNATIONAL_FAMILY_DISPUTES_ROUTE, INTERNATIONAL_FAMILY_DISPUTES_KEYS, INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS, getInternationalFamilyDisputesScenario } from "@/data/international-family-disputes-route";
import { RELATIVE_CHILD_CONTACT_REVIEWED_AT, getRelativeChildContactRules } from "@/data/relative-child-contact-legal-review";
import { RELATIVE_CHILD_CONTACT_ROUTE, RELATIVE_CHILD_CONTACT_KEYS, RELATIVE_CHILD_CONTACT_SCENARIOS, getRelativeChildContactScenario } from "@/data/relative-child-contact-route";
import { EMANCIPATION_REVIEWED_AT, getEmancipationRules } from "@/data/emancipation-legal-review";
import { EMANCIPATION_ROUTE, EMANCIPATION_KEYS, EMANCIPATION_SCENARIOS, getEmancipationScenario } from "@/data/emancipation-route";
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
import { getPaternityEstablishmentRules, PATERNITY_ESTABLISHMENT_REVIEWED_AT } from "@/data/paternity-establishment-legal-review";
import { getPaternityEstablishmentScenario, PATERNITY_ESTABLISHMENT_ROUTE, PATERNITY_ESTABLISHMENT_SCENARIO_CHOICES } from "@/data/paternity-establishment-route";
import type { PaternityEstablishmentScenario } from "@/data/paternity-establishment-route";
import { getPaternityContestRules, PATERNITY_CONTEST_REVIEWED_AT } from "@/data/paternity-contest-legal-review";
import { getPaternityContestScenario, PATERNITY_CONTEST_ROUTE, PATERNITY_CONTEST_SCENARIO_CHOICES } from "@/data/paternity-contest-route";
import type { PaternityContestScenario } from "@/data/paternity-contest-route";
import { ADOPTION_REVIEWED_AT, getAdoptionRules } from "@/data/adoption-legal-review";
import { ADOPTION_ROUTE, ADOPTION_SCENARIO_CHOICES, getAdoptionScenario } from "@/data/adoption-route";
import type { AdoptionScenario } from "@/data/adoption-route";
import { CHILD_TRAVEL_REVIEWED_AT, getChildTravelRules } from "@/data/child-travel-legal-review";
import { CHILD_TRAVEL_ROUTE, CHILD_TRAVEL_SCENARIO_CHOICES, getChildTravelScenario } from "@/data/child-travel-route";
import type { ChildTravelScenario } from "@/data/child-travel-route";
import { CHILD_NAME_REVIEWED_AT, getChildNameRules } from "@/data/child-name-legal-review";
import { CHILD_NAME_ROUTE, CHILD_NAME_SCENARIO_CHOICES, getChildNameScenario } from "@/data/child-name-route";
import type { ChildNameScenario } from "@/data/child-name-route";
import { PARENTAL_RIGHTS_RESTORATION_REVIEWED_AT, getParentalRightsRestorationRules } from "@/data/parental-rights-restoration-legal-review";
import { PARENTAL_RIGHTS_RESTORATION_ROUTE, PARENTAL_RIGHTS_RESTORATION_SCENARIO_CHOICES, getParentalRightsRestorationScenario } from "@/data/parental-rights-restoration-route";
import type { ParentalRightsRestorationScenario } from "@/data/parental-rights-restoration-route";
import { PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_REVIEWED_AT, getParentalRightsRestrictionCancellationRules } from "@/data/parental-rights-restriction-cancellation-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_ROUTE, PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_SCENARIO_CHOICES, getParentalRightsRestrictionCancellationScenario } from "@/data/parental-rights-restriction-cancellation-route";
import type { ParentalRightsRestrictionCancellationScenario } from "@/data/parental-rights-restriction-cancellation-route";
import { PARENTAL_DISAGREEMENTS_REVIEWED_AT, getParentalDisagreementsRules } from "@/data/parental-disagreements-legal-review";
import { PARENTAL_DISAGREEMENTS_ROUTE, PARENTAL_DISAGREEMENTS_SCENARIO_CHOICES, getParentalDisagreementsScenario } from "@/data/parental-disagreements-route";
import type { ParentalDisagreementsScenario } from "@/data/parental-disagreements-route";
import { ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT, getAdditionalChildExpensesRules } from "@/data/additional-child-expenses-legal-review";
import { ADDITIONAL_CHILD_EXPENSES_ROUTE, ADDITIONAL_CHILD_EXPENSES_SCENARIO_CHOICES, getAdditionalChildExpensesScenario } from "@/data/additional-child-expenses-route";
import type { AdditionalChildExpensesScenario } from "@/data/additional-child-expenses-route";
import { SPOUSAL_SUPPORT_REVIEWED_AT, getSpousalSupportRules } from "@/data/spousal-support-legal-review";
import { SPOUSAL_SUPPORT_ROUTE, SPOUSAL_SUPPORT_SCENARIO_CHOICES, getSpousalSupportScenario } from "@/data/spousal-support-route";
import type { SpousalSupportScenario } from "@/data/spousal-support-route";
import { PRENUPTIAL_AGREEMENT_REVIEWED_AT, getPrenuptialAgreementRules } from "@/data/prenuptial-agreement-legal-review";
import { PRENUPTIAL_AGREEMENT_ROUTE, PRENUPTIAL_AGREEMENT_SCENARIO_CHOICES, getPrenuptialAgreementScenario } from "@/data/prenuptial-agreement-route";
import type { PrenuptialAgreementScenario } from "@/data/prenuptial-agreement-route";
import { INVALID_MARRIAGE_REVIEWED_AT, getInvalidMarriageRules } from "@/data/invalid-marriage-legal-review";
import { INVALID_MARRIAGE_ROUTE, INVALID_MARRIAGE_SCENARIO_CHOICES, getInvalidMarriageScenario } from "@/data/invalid-marriage-route";
import type { InvalidMarriageScenario } from "@/data/invalid-marriage-route";
import { COMPLEX_MARITAL_PROPERTY_REVIEWED_AT, getComplexMaritalPropertyRules } from "@/data/complex-marital-property-legal-review";
import { COMPLEX_MARITAL_PROPERTY_ROUTE, COMPLEX_MARITAL_PROPERTY_SCENARIO_CHOICES, getComplexMaritalPropertyScenario } from "@/data/complex-marital-property-route";
import type { ComplexMaritalPropertyScenario } from "@/data/complex-marital-property-route";
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
  if (problem.slug === PATERNITY_ESTABLISHMENT_ROUTE.problemSlug) {
    return <PaternityEstablishmentProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PATERNITY_CONTEST_ROUTE.problemSlug) {
    return <PaternityContestProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === ADOPTION_ROUTE.problemSlug) {
    return <AdoptionProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === CHILD_TRAVEL_ROUTE.problemSlug) {
    return <ChildTravelProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === CHILD_NAME_ROUTE.problemSlug) {
    return <ChildNameProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PARENTAL_RIGHTS_RESTORATION_ROUTE.problemSlug) {
    return <ParentalRightsRestorationProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_ROUTE.problemSlug) {
    return <ParentalRightsRestrictionCancellationProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PARENTAL_DISAGREEMENTS_ROUTE.problemSlug) {
    return <ParentalDisagreementsProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === ADDITIONAL_CHILD_EXPENSES_ROUTE.problemSlug) {
    return <AdditionalChildExpensesProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === SPOUSAL_SUPPORT_ROUTE.problemSlug) {
    return <SpousalSupportProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === PRENUPTIAL_AGREEMENT_ROUTE.problemSlug) {
    return <PrenuptialAgreementProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === INVALID_MARRIAGE_ROUTE.problemSlug) {
    return <InvalidMarriageProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === COMPLEX_MARITAL_PROPERTY_ROUTE.problemSlug) {
    return <ComplexMaritalPropertyProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === SURROGACY_ORIGIN_ROUTE.problemSlug) {
    return <SurrogacyOriginProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === INTERNATIONAL_FAMILY_DISPUTES_ROUTE.problemSlug) {
    return <InternationalFamilyDisputesProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === RELATIVE_CHILD_CONTACT_ROUTE.problemSlug) {
    return <RelativeChildContactProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
  }
  if (problem.slug === EMANCIPATION_ROUTE.problemSlug) {
    return <EmancipationProblemPage categoryTitle={category.title} problem={problem} searchParams={resolvedSearchParams} />;
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

function AdoptionProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getAdoptionScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }];
  return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Усыновление ребёнка</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите ситуацию, проверьте статус кандидата, ребёнка и необходимые согласия.</p></header>{scenario ? <AdoptionScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии усыновления">{ADOPTION_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><AdoptionScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(ADOPTION_REVIEWED_AT)}. Чек-лист не является заявлением и не подтверждает готовность к подаче.</p></article></>;
}
function AdoptionScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: AdoptionScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Усыновление ребёнка</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить чек-лист</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getAdoptionRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function ChildTravelProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getChildTravelScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Выезд ребёнка за границу</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Сначала определите сопровождающего и несогласие, затем отдельно проверьте российский выезд и иностранный въезд.</p></header>{scenario ? <ChildTravelScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии выезда ребёнка">{CHILD_TRAVEL_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ChildTravelScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(CHILD_TRAVEL_REVIEWED_AT)}. Требования иностранного государства всегда проверяются отдельно.</p></article></>; }
function ChildTravelScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ChildTravelScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Выезд ребёнка за границу</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить поездку</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getChildTravelRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function ChildNameProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getChildNameScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Имя, фамилия и отчество ребёнка</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Сначала определите возраст и элемент имени, затем проверьте согласия и компетентный орган.</p></header>{scenario ? <ChildNameScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии изменения имени ребёнка">{CHILD_NAME_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ChildNameScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(CHILD_NAME_REVIEWED_AT)}. Официальная форма №20 приблизительно не воспроизводится.</p></article></>; }
function ChildNameScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ChildNameScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Имя ребёнка</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить процедуру</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getChildNameRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function ParentalRightsRestorationProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getParentalRightsRestorationScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Восстановление в родительских правах</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Проверьте решение о лишении, изменения обстоятельств, возраст, согласие и статус ребёнка.</p></header>{scenario ? <ParentalRightsRestorationScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии восстановления родительских прав">{PARENTAL_RIGHTS_RESTORATION_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ParentalRightsRestorationScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PARENTAL_RIGHTS_RESTORATION_REVIEWED_AT)}. Судебный результат всегда требует юридической проверки.</p></article></>; }
function ParentalRightsRestorationScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ParentalRightsRestorationScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Восстановление прав</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить условия</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getParentalRightsRestorationRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function ParentalRightsRestrictionCancellationProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getParentalRightsRestrictionCancellationScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Отмена ограничения родительских прав</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Проверьте решение об ограничении, отпадение его оснований, новые риски и интересы ребёнка.</p></header>{scenario ? <ParentalRightsRestrictionCancellationScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии отмены ограничения родительских прав">{PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ParentalRightsRestrictionCancellationScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PARENTAL_RIGHTS_RESTRICTION_CANCELLATION_REVIEWED_AT)}. Судебный результат всегда требует юридической проверки.</p></article></>; }
function ParentalRightsRestrictionCancellationScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ParentalRightsRestrictionCancellationScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Отмена ограничения</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить условия</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getParentalRightsRestrictionCancellationRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function ParentalDisagreementsProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getParentalDisagreementsScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Разногласия родителей по воспитанию и образованию</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите конкретный предмет разногласия и допустимый механизм его разрешения.</p></header>{scenario ? <ParentalDisagreementsScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Пути разрешения разногласий родителей">{PARENTAL_DISAGREEMENTS_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ParentalDisagreementsScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PARENTAL_DISAGREEMENTS_REVIEWED_AT)}. Место жительства и порядок общения вынесены в отдельный маршрут.</p></article></>; }
function ParentalDisagreementsScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ParentalDisagreementsScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Воспитание и образование</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить путь</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getParentalDisagreementsRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function AdditionalChildExpensesProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getAdditionalChildExpensesScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Дополнительные расходы на ребёнка</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Отделите исключительные расходы от обычных трат и выберите безопасный следующий шаг.</p></header>{scenario ? <AdditionalChildExpensesScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Пути по дополнительным расходам на ребёнка">{ADDITIONAL_CHILD_EXPENSES_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><AdditionalChildExpensesScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(ADDITIONAL_CHILD_EXPENSES_REVIEWED_AT)}. Обычные алименты вынесены в отдельный маршрут.</p></article></>; }
function AdditionalChildExpensesScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: AdditionalChildExpensesScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Дополнительные расходы</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить путь</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getAdditionalChildExpensesRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function SpousalSupportProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getSpousalSupportScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Содержание супруга и бывшего супруга</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Отделите содержание супруга от алиментов на ребёнка и проверьте основание для действующего или расторгнутого брака.</p></header>{scenario ? <SpousalSupportScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Пути содержания супруга">{SPOUSAL_SUPPORT_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><SpousalSupportScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(SPOUSAL_SUPPORT_REVIEWED_AT)}. Алименты на ребёнка вынесены в отдельный маршрут.</p></article></>; }
function SpousalSupportScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: SpousalSupportScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Содержание супруга</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить путь</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getSpousalSupportRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function PrenuptialAgreementProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getPrenuptialAgreementScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Брачный договор</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Подготовьте допустимые имущественные условия для нотариуса или проверьте безопасный путь при изменении, расторжении и споре.</p></header>{scenario ? <PrenuptialAgreementScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Пути по брачному договору">{PRENUPTIAL_AGREEMENT_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><PrenuptialAgreementScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PRENUPTIAL_AGREEMENT_REVIEWED_AT)}. Помощник не заменяет нотариуса и юридическую проверку судебного спора.</p></article></>; }
function PrenuptialAgreementScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: PrenuptialAgreementScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Брачный договор</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить проект</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getPrenuptialAgreementRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function InvalidMarriageProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getInvalidMarriageScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl [overflow-wrap:anywhere] text-3xl font-semibold leading-tight text-ink sm:text-5xl">Признание брака недействительным</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Отделите недействительность брака от обычного развода и проверьте точное основание и право заявителя.</p></header>{scenario ? <InvalidMarriageScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Основания недействительности брака">{INVALID_MARRIAGE_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><InvalidMarriageScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(INVALID_MARRIAGE_REVIEWED_AT)}. Недействительность устанавливает только суд.</p></article></>; }
function InvalidMarriageScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: InvalidMarriageScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Недействительность брака</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить судебный черновик</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getInvalidMarriageRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function ComplexMaritalPropertyProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) { const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`; const scenario = getComplexMaritalPropertyScenario(searchParams.scenario); const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }]; return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} /><article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Сложные имущественные споры супругов</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите сложный элемент: долги, ипотеку, бизнес, права третьих лиц или банкротство. Обычный раздел имущества остаётся в отдельном маршруте.</p></header>{scenario ? <ComplexMaritalPropertyScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сложные имущественные споры супругов">{COMPLEX_MARITAL_PROPERTY_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><ComplexMaritalPropertyScenarioOverview basePath={problemPath} /></>}<p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(COMPLEX_MARITAL_PROPERTY_REVIEWED_AT)}. Каждый результат требует индивидуальной юридической проверки.</p></article></>; }
function ComplexMaritalPropertyScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: ComplexMaritalPropertyScenario }) { return <section className="mt-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Сложный имущественный спор</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div><div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div><div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div><div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div><Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить материал для проверки</Link><section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getComplexMaritalPropertyRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.officialSource}</a></li>)}</ul></section></section>; }

function SurrogacyOriginProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const path = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const selected = getSurrogacyOriginScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path }];
  return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{problem.h1}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите вопрос. Маршрут готовит сведения для проверки, но не определяет права родителей и не создаёт готовый к подаче документ.</p></header>
      <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Вопросы о суррогатном материнстве">{SURROGACY_ORIGIN_KEYS.map((key) => <Link key={key} href={`${path}?scenario=${key}`} className="min-h-11 rounded-md border border-line bg-white p-5 outline-none hover:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{SURROGACY_ORIGIN_SCENARIOS[key].title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{SURROGACY_ORIGIN_SCENARIOS[key].summary}</span></Link>)}</section>
      {selected ? <section className="mt-7 border-t border-line pt-6"><h2 className="text-2xl font-semibold text-ink">{selected.title}</h2><p className="mt-3 text-zinc-700">{selected.summary}</p><h3 className="mt-5 text-lg font-semibold text-ink">Что собрать</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{selected.evidence.map((item) => <li key={item}>- {item}</li>)}</ul><p className="mt-5 text-sm font-semibold text-amber-900">Готовность к подаче: нет. Юридическая проверка обязательна.</p><Link href={`/documents/${SURROGACY_ORIGIN_ROUTE.documentSlug}/?variant=${selected.key}#fill-online`} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white">Подготовить лист сведений</Link><h3 className="mt-7 text-lg font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getSurrogacyOriginRules(selected.key).map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-trust underline focus:ring-2 focus:ring-trust/20">{rule.norm}</a><span className="block text-zinc-600">{rule.scope} {rule.limitations}</span></li>)}</ul></section> : null}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(SURROGACY_ORIGIN_REVIEWED_AT)}. Все результаты требуют индивидуальной юридической проверки.</p>
    </article></>;
}

function InternationalFamilyDisputesProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const path = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const selected = getInternationalFamilyDisputesScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path }];
  return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{problem.h1}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите предмет вопроса. Маршрут собирает факты, но не определяет применимое право, компетентный суд или действие международного договора.</p></header>
      <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Международные семейные вопросы">{INTERNATIONAL_FAMILY_DISPUTES_KEYS.map((key) => <Link key={key} href={`${path}?scenario=${key}`} className="min-h-11 rounded-md border border-line bg-white p-5 outline-none hover:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[key].title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[key].summary}</span></Link>)}</section>
      {selected ? <section className="mt-7 border-t border-line pt-6"><h2 className="text-2xl font-semibold text-ink">{selected.title}</h2><p className="mt-3 text-zinc-700">{selected.summary}</p><h3 className="mt-5 text-lg font-semibold text-ink">Что собрать</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{selected.evidence.map((item) => <li key={item}>- {item}</li>)}</ul><p className="mt-5 text-sm font-semibold text-amber-900">Готовность к подаче: нет. Международная юридическая проверка обязательна.</p><Link href={`/documents/${INTERNATIONAL_FAMILY_DISPUTES_ROUTE.documentSlug}/?variant=${selected.key}#fill-online`} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white">Подготовить лист сведений</Link><h3 className="mt-7 text-lg font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getInternationalFamilyDisputesRules(selected.key).map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-trust underline focus:ring-2 focus:ring-trust/20">{rule.norm}</a><span className="block text-zinc-600">{rule.scope} {rule.limitations}</span></li>)}</ul></section> : null}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT)}. Все результаты требуют индивидуальной юридической проверки.</p>
    </article></>;
}

function RelativeChildContactProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const path = `/problems/${problem.categorySlug}/${problem.slug}/`; const selected = getRelativeChildContactScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path }];
  return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{problem.h1}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Выберите текущую стадию. Этот маршрут предназначен для бабушек, дедушек, братьев, сестёр и других родственников, но не для родителей.</p></header>
      <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Стадии общения родственников с ребёнком">{RELATIVE_CHILD_CONTACT_KEYS.map((key) => <Link key={key} href={`${path}?scenario=${key}`} className="min-h-11 rounded-md border border-line bg-white p-5 outline-none hover:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{RELATIVE_CHILD_CONTACT_SCENARIOS[key].title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{RELATIVE_CHILD_CONTACT_SCENARIOS[key].summary}</span></Link>)}</section>
      {selected ? <section className="mt-7 border-t border-line pt-6"><h2 className="text-2xl font-semibold text-ink">{selected.title}</h2><p className="mt-3 text-zinc-700">{selected.summary}</p><h3 className="mt-5 text-lg font-semibold text-ink">Что собрать</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{selected.evidence.map((item) => <li key={item}>- {item}</li>)}</ul><Link href={`/documents/${RELATIVE_CHILD_CONTACT_ROUTE.documentSlug}/?variant=${selected.key}#fill-online`} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white">Подготовить материал</Link><h3 className="mt-7 text-lg font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getRelativeChildContactRules(selected.key).map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-trust underline">{rule.norm}</a><span className="block text-zinc-600">{rule.scope} {rule.limitations}</span></li>)}</ul></section> : null}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(RELATIVE_CHILD_CONTACT_REVIEWED_AT)}.</p>
    </article></>;
}

function EmancipationProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const path = `/problems/${problem.categorySlug}/${problem.slug}/`; const selected = getEmancipationScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path }];
  return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} /><Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl [overflow-wrap:anywhere] text-3xl font-semibold leading-tight text-ink sm:text-5xl">{problem.h1}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Проверьте условия и выберите административный или судебный путь. Возраст 16 лет сам по себе не означает полную дееспособность.</p></header>
      <section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Стадии эмансипации">{EMANCIPATION_KEYS.map((key) => <Link key={key} href={`${path}?scenario=${key}`} className="min-h-11 rounded-md border border-line bg-white p-5 outline-none hover:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{EMANCIPATION_SCENARIOS[key].title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{EMANCIPATION_SCENARIOS[key].summary}</span></Link>)}</section>
      {selected ? <section className="mt-7 border-t border-line pt-6"><h2 className="text-2xl font-semibold text-ink">{selected.title}</h2><p className="mt-3 text-zinc-700">{selected.summary}</p><h3 className="mt-5 text-lg font-semibold text-ink">Что собрать</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{selected.evidence.map((item) => <li key={item}>- {item}</li>)}</ul><Link href={`/documents/${EMANCIPATION_ROUTE.documentSlug}/?variant=${selected.key}#fill-online`} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white">Подготовить материал</Link><h3 className="mt-7 text-lg font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getEmancipationRules(selected.key).map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-trust underline">{rule.norm}</a><span className="block text-zinc-600">{rule.scope} {rule.limitations}</span></li>)}</ul></section> : null}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(EMANCIPATION_REVIEWED_AT)}.</p>
    </article></>;
}

function PaternityContestProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getPaternityContestScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }];
  return <>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} />
    <Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Оспаривание отцовства</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Сначала определите заявителя и основание записи, затем проверьте ограничения и судебный путь.</p></header>
      {scenario ? <PaternityContestScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии оспаривания отцовства">{PATERNITY_CONTEST_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><PaternityContestScenarioOverview basePath={problemPath} /></>}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PATERNITY_CONTEST_REVIEWED_AT)}. Любой результат является судебным черновиком и требует проверки.</p>
    </article>
  </>;
}

function PaternityContestScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: PaternityContestScenario }) {
  return <section className="mt-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Судебный спор о записи</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div>
    <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div>
    <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
    <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить ситуацию</Link>
    <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getPaternityContestRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Проверенный источник</a></li>)}</ul></section>
  </section>;
}

function PaternityEstablishmentProblemPage({ categoryTitle, problem, searchParams }: { categoryTitle: string; problem: LegalProblem; searchParams: { scenario?: string } }) {
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const scenario = getPaternityEstablishmentScenario(searchParams.scenario);
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Правовой навигатор", path: "/problems/" }, { name: categoryTitle, path: `/problems/${problem.categorySlug}/` }, { name: problem.title, path: problemPath }];
  return <>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] }), articleJsonLd(problem, categoryTitle)]} />
    <Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">Установление отцовства</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">Сначала проверьте запись о рождении, затем выберите добровольный, судебный или посмертный путь.</p></header>
      {scenario ? <PaternityEstablishmentScenarioDetails problemPath={problemPath} scenario={scenario} /> : <><section className="mt-7 grid gap-4 md:grid-cols-2" aria-label="Сценарии установления отцовства">{PATERNITY_ESTABLISHMENT_SCENARIO_CHOICES.map((choice) => <Link key={choice.key} href={`${problemPath}?scenario=${choice.key}`} className="min-h-11 rounded-lg border border-line bg-white p-5 shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"><span className="text-lg font-semibold text-ink">{choice.title}</span><span className="mt-2 block text-sm leading-6 text-zinc-600">{choice.description}</span></Link>)}</section><PaternityEstablishmentScenarioOverview basePath={problemPath} /></>}
      <p className="mt-7 text-xs leading-5 text-zinc-500">Последняя документированная правовая сверка: {formatReviewDate(PATERNITY_ESTABLISHMENT_REVIEWED_AT)}. Лист данных не заменяет форму ЗАГС; любой судебный черновик требует проверки.</p>
    </article>
  </>;
}

function PaternityEstablishmentScenarioDetails({ problemPath, scenario }: { problemPath: string; scenario: PaternityEstablishmentScenario }) {
  return <section className="mt-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-trust">Происхождение ребёнка</p><h2 className="mt-2 text-3xl font-semibold text-ink">{scenario.title}</h2></div><Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/20">Назад к выбору</Link></div>
    <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="border-t-4 border-trust bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Основные шаги</h3><ol className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.steps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section><section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="text-xl font-semibold text-ink">Что подготовить</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.documents.map((item) => <li key={item}>- {item}</li>)}</ul></section></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2"><InfoBox title="Основной результат" text={scenario.mainDocument} /><InfoBox title="Куда обращаться" text={scenario.filing} /><InfoBox title="Срок" text={scenario.term} /><InfoBox title="Расходы" text={scenario.fee} /></div>
    <div className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
    <Link href={`/documents/${scenario.documentSlug}/#fill-online`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30">Проверить ситуацию</Link>
    <section className="mt-7 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{getPaternityEstablishmentRules(scenario.key).map((rule) => <li key={rule.id} className="border-l-2 border-line pl-3"><p className="font-medium text-ink">{rule.statement}</p><p className="text-zinc-600">{rule.norm}. {rule.scope}</p><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Проверенный источник</a></li>)}</ul></section>
  </section>;
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
