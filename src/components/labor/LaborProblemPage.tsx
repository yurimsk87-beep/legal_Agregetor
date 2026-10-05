import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LaborScenarioFlow } from "@/components/labor/LaborScenarioFlow";
import { RelatedQuestionsExpandable } from "@/components/questions/QuestionsList";
import { getLaborRulesForArea } from "@/data/labor-legal-sources";
import { getLaborRoute } from "@/data/labor-routes";
import type { LegalProblem } from "@/data/legal-problems";
import { breadcrumbJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { getRelatedQuestionsForContext } from "@/lib/navigator-relations";
import { isSafeLaborQuestionForRoute } from "@/lib/labor-question-relevance";
import { normalizeText } from "@/lib/related-questions";

export async function LaborProblemPage({ categoryTitle, problem, scenario }: { categoryTitle: string; problem: LegalProblem; scenario?: string }) {
  const route = getLaborRoute(problem.slug);
  if (!route) return null;
  const problemPath = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const relatedQuestions = await loadSafeLaborQuestions(problem, route.relatedQuestionTopics, route.exclusions);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: problem.title, path: problemPath }
  ];

  return <>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs), legalServiceJsonLd({ path: problemPath, name: problem.title, description: problem.shortAnswer, lawyers: [] })]} />
    <Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7"><p className="text-sm font-semibold uppercase text-trust">{categoryTitle}</p><h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{problem.h1}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{problem.shortAnswer}</p></header>
      <LaborScenarioFlow route={route} initialScenario={scenario} rules={getLaborRulesForArea(route.areaId)} />
      <section className="mt-10 border-t border-line pt-7"><h2 className="text-2xl font-semibold text-ink">Что важно знать</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">{route.whatToKnow.map((item) => <li key={item}>- {item}</li>)}</ul></section>
      {relatedQuestions.length ? <section className="mt-10 border-t border-line pt-7"><h2 className="text-2xl font-semibold text-ink">Похожие вопросы</h2><p className="mt-2 text-sm leading-6 text-zinc-600">Посмотрите, как пользователи описывали похожие трудовые ситуации. Ответы помогают сориентироваться, но не заменяют проверку закона для ваших обстоятельств.</p><div className="mt-5"><RelatedQuestionsExpandable questions={relatedQuestions} initialCount={3} step={3} /></div></section> : null}
      <p className="mt-8 text-xs leading-5 text-zinc-500">Последняя правовая сверка: {problem.lastReviewedAt?.split("-").reverse().join(".")}.</p>
    </article>
  </>;
}
async function loadSafeLaborQuestions(problem: LegalProblem, topics: string[], exclusions: string[]) {
  const candidates = await getRelatedQuestionsForContext({ contextType: "problem", categoryName: "Трудовое право", primaryTags: problem.relatedQuestionTopics, searchPhrases: problem.relatedQuestionTopics, excludedTopics: exclusions }, { limit: 12, minScore: 40, minResults: 1 });
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  return candidates.filter((question) => {
    if (!isSafeLaborQuestionForRoute(question, topics, exclusions)) return false;
    const title = normalizeText(question.title);
    if (seenIds.has(question.id) || seenTitles.has(title)) return false;
    seenIds.add(question.id);
    seenTitles.add(title);
    return true;
  }).slice(0, 6);
}
