import { RelatedQuestionsExpandable } from "@/components/questions/QuestionsList";
import type { NavigatorDocument } from "@/data/documents";
import { getLaborDocumentScenario } from "@/data/labor-documents";
import { getCategoryForProblem, legalProblems, type LegalProblem } from "@/data/legal-problems";
import { isSafeLaborQuestionForRoute } from "@/lib/labor-question-relevance";
import { getRelatedQuestionsForContext } from "@/lib/navigator-relations";
import { normalizeText, type RelatedQuestionsContextType } from "@/lib/related-questions";
import type { Question } from "@/lib/types";

const QUESTION_CATEGORIES_BY_LEGAL_CATEGORY: Record<string, string[]> = {
  "semya-i-deti": [
    "Семейные дела",
    "Алименты",
    "Заключение и расторжение брака",
    "Раздел имущества",
    "Усыновление, опека, попечительство"
  ],
  "trudovoe-pravo": ["Трудовое право"]
};

type QuestionContext = {
  contextType: RelatedQuestionsContextType;
  problem: LegalProblem;
  topics: string[];
  exclusions: string[];
};

export async function ProblemRelatedQuestions({ problem }: { problem: LegalProblem }) {
  const questions = await loadRelatedQuestions({
    contextType: "problem",
    problem,
    topics: problem.relatedQuestionTopics,
    exclusions: problem.relatedQuestionExclusions ?? []
  });

  return renderQuestionsSection(
    questions,
    `Посмотрите, как пользователи описывали похожие ситуации по теме «${problem.title}». Ответы помогают сориентироваться, но не заменяют проверку закона для ваших обстоятельств.`,
    "problem-related-questions-title"
  );
}

export async function DocumentRelatedQuestions({ document }: { document: NavigatorDocument }) {
  const problem = legalProblems.find((item) => document.relatedProblemSlugs.includes(item.slug));
  if (!problem) return null;

  const laborDocument = getLaborDocumentScenario(document.slug);
  const scenarioTopics = laborDocument?.scenario.relatedQuestionTopics ?? [];
  const topics = scenarioTopics.length ? scenarioTopics : [...document.userQueries, ...document.keywords];
  const exclusions = laborDocument?.route.exclusions ?? problem.relatedQuestionExclusions ?? [];
  const questions = await loadRelatedQuestions({ contextType: "document", problem, topics, exclusions });

  return renderQuestionsSection(
    questions,
    `Вопросы пользователей, связанные с подготовкой документа «${document.title}». Ответы помогают сориентироваться, но не заменяют проверку закона и документов.`,
    "document-related-questions-title"
  );
}

async function loadRelatedQuestions({ contextType, problem, topics, exclusions }: QuestionContext) {
  if (!topics.length) return [];

  const categoryTitle = getCategoryForProblem(problem)?.title ?? problem.categorySlug;
  const allowedCategoryNames = QUESTION_CATEGORIES_BY_LEGAL_CATEGORY[problem.categorySlug] ?? [categoryTitle];
  const candidates = await getRelatedQuestionsForContext(
    {
      contextType,
      categoryName: allowedCategoryNames[0],
      allowedCategoryNames,
      primaryTags: topics,
      searchPhrases: topics,
      excludedTopics: exclusions
    },
    { limit: 12, minScore: 40, minResults: 1 }
  );

  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  return candidates.filter((question) => {
    if (hasContactPii(question)) return false;
    if (problem.categorySlug === "trudovoe-pravo" && !isSafeLaborQuestionForRoute(question, topics, exclusions)) return false;

    const title = normalizeText(question.title);
    if (seenIds.has(question.id) || seenTitles.has(title)) return false;
    seenIds.add(question.id);
    seenTitles.add(title);
    return true;
  }).slice(0, 6);
}

function hasContactPii(question: Question) {
  const content = [question.title, question.text, question.summary ?? "", ...question.answers.map((answer) => answer.text)].join(" ");
  return /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(content)
    || /(?:\+7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/.test(content)
    || /(?:whats\s?app|telegram|телеграм|ватсап|напишите\s+(?:мне\s+)?(?:в|на)\s+(?:чат|личн))/i.test(content);
}

function renderQuestionsSection(questions: Question[], description: string, titleId: string) {
  if (!questions.length) return null;

  return (
    <section className="mx-auto max-w-5xl border-t border-line px-4 py-8 sm:px-6 lg:px-8" aria-labelledby={titleId}>
      <h2 id={titleId} className="text-2xl font-semibold text-ink sm:text-3xl">Похожие вопросы</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">{description}</p>
      <div className="mt-5">
        <RelatedQuestionsExpandable questions={questions} initialCount={3} step={3} />
      </div>
    </section>
  );
}
