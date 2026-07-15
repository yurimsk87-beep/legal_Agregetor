"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LegalCategory } from "@/data/legal-categories";
import type { LegalProblem, LegalProblemRiskLevel, LegalProblemUrgency } from "@/data/legal-problems";
import type { NavigatorDocument } from "@/data/documents";
import { getDocumentCardCtaLabel, getDocumentOnlineFillCtaLabel } from "@/lib/document-seo";

type CheckWizardProps = {
  categories: LegalCategory[];
  problems: LegalProblem[];
  documents: NavigatorDocument[];
  initialCategorySlug?: string;
  initialProblemSlug?: string;
};

type ChoiceOption = {
  id: string;
  title: string;
  description: string;
};

type Step = 0 | 1 | 2 | 3 | 4;

const urgencyOptions = [
  {
    id: "deadline",
    title: "Есть документ с датой или сроком",
    description: "Нужно проверить, не пропущен ли срок для жалобы, возражения или обращения."
  },
  {
    id: "court",
    title: "Уже есть суд или повестка",
    description: "Есть процессуальный срок, заседание, иск, приказ или официальный вызов."
  },
  {
    id: "money",
    title: "Уже списали деньги или заблокировали счет",
    description: "Важно быстро понять основание списания и порядок возврата или жалобы."
  },
  {
    id: "research",
    title: "Пока хочу разобраться",
    description: "Нужно понять риски, документы и безопасный первый шаг."
  },
  {
    id: "unknown",
    title: "Не знаю",
    description: "Покажем универсальный маршрут и даты, которые стоит проверить."
  }
];

const goalOptions = [
  {
    id: "instruction",
    title: "Пошаговую инструкцию",
    description: "Открыть страницу ситуации со сроками, рисками и порядком действий."
  },
  {
    id: "document",
    title: "Документ или шаблон",
    description: "Подобрать заявление, жалобу, претензию, возражение или иск."
  },
  {
    id: "answer",
    title: "Ответ юриста",
    description: "Перейти к форме вопроса без телефона на первом шаге."
  },
  {
    id: "lawyer",
    title: "Подобрать юриста",
    description: "Посмотреть специалистов по близкой теме."
  },
  {
    id: "risks",
    title: "Просто понять риски",
    description: "Получить краткую оценку срочности, сроков и документов."
  }
];

const lawyerHelpReasons = [
  "срок уже пропущен или до его окончания осталось мало времени;",
  "есть суд, повестка, исполнительное производство или официальный отказ;",
  "спор связан с крупной суммой, жильем, работой, детьми или выплатами;",
  "есть риск уголовной ответственности;",
  "есть документы, договоры или переписка, которые нужно оценить;",
  "ситуация отличается от типового сценария или факты противоречивы."
];

export function CheckWizard({ categories, problems, documents, initialCategorySlug, initialProblemSlug }: CheckWizardProps) {
  const initialCategory = categories.some((category) => category.slug === initialCategorySlug) ? initialCategorySlug : undefined;
  const initialProblem = problems.some((problem) => problem.slug === initialProblemSlug && problem.categorySlug === initialCategory) ? initialProblemSlug : undefined;
  const [step, setStep] = useState<Step>(initialProblem ? 2 : initialCategory ? 1 : 0);
  const [categorySlug, setCategorySlug] = useState(initialCategory ?? "");
  const [problemSlug, setProblemSlug] = useState(initialProblem ?? "");
  const [urgencyId, setUrgencyId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [query, setQuery] = useState("");

  const selectedCategory = categories.find((category) => category.slug === categorySlug) ?? null;
  const categoryProblems = useMemo(() => problems.filter((problem) => problem.categorySlug === categorySlug), [categorySlug, problems]);
  const visibleProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? categoryProblems.filter((problem) =>
          [problem.title, problem.shortTitle, problem.shortAnswer].some((value) => value.toLowerCase().includes(normalizedQuery))
        )
      : categoryProblems;

    return filtered.slice(0, 14);
  }, [categoryProblems, query]);
  const selectedProblem = categoryProblems.find((problem) => problem.slug === problemSlug) ?? null;
  const recommendations = useMemo(
    () => rankProblems(categoryProblems, urgencyId, goalId, problemSlug).slice(0, selectedProblem ? 1 : 5),
    [categoryProblems, goalId, problemSlug, selectedProblem, urgencyId]
  );
  const primaryProblem = selectedProblem ?? recommendations[0] ?? null;
  const relatedDocuments = useMemo(() => {
    if (!primaryProblem) return [];
    const bySlug = new Map(documents.map((document) => [document.slug, document]));
    const direct = primaryProblem.relatedDocumentSlugs.map((slug) => bySlug.get(slug)).filter((document): document is NavigatorDocument => Boolean(document));
    if (direct.length) return direct.slice(0, 4);

    return documents.filter((document) => document.relatedProblemSlugs.includes(primaryProblem.slug)).slice(0, 4);
  }, [documents, primaryProblem]);

  function chooseCategory(slug: string) {
    setCategorySlug(slug);
    setProblemSlug("");
    setQuery("");
    setStep(1);
  }

  function reset() {
    setStep(0);
    setCategorySlug("");
    setProblemSlug("");
    setUrgencyId("");
    setGoalId("");
    setQuery("");
  }

  return (
    <div className="rounded-lg border border-line bg-white shadow-sm">
      <div className="border-b border-line p-4 sm:p-6">
        <CheckStepIndicator currentStep={step} />
      </div>

      <div className="p-4 sm:p-6">
        {step === 0 ? (
          <CategoryStep categories={categories} onSelect={chooseCategory} />
        ) : null}

        {step === 1 && selectedCategory ? (
          <ProblemStep
            category={selectedCategory}
            query={query}
            problems={visibleProblems}
            selectedProblemSlug={problemSlug}
            totalCount={categoryProblems.length}
            onBack={() => setStep(0)}
            onContinue={() => setStep(2)}
            onQueryChange={setQuery}
            onSelectProblem={setProblemSlug}
          />
        ) : null}

        {step === 2 ? (
          <ChoiceStep
            title="Есть ли срочность?"
            description="Этот выбор не меняет саму ситуацию, но влияет на подсказку по рискам и первому действию."
            options={urgencyOptions}
            selectedId={urgencyId}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
            onSelect={setUrgencyId}
          />
        ) : null}

        {step === 3 ? (
          <ChoiceStep
            title="Что нужно получить?"
            description="Выберите основной результат. После этого покажем маршрут: инструкция, документы, Q&A и юристы."
            options={goalOptions}
            selectedId={goalId}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
            onSelect={setGoalId}
          />
        ) : null}

        {step === 4 && selectedCategory && primaryProblem ? (
          <CheckResult
            category={selectedCategory}
            documents={relatedDocuments}
            goalId={goalId}
            onBack={() => setStep(3)}
            onReset={reset}
            problem={primaryProblem}
            recommendations={recommendations}
            urgencyId={urgencyId}
          />
        ) : null}
      </div>
    </div>
  );
}

function CheckStepIndicator({ currentStep }: { currentStep: Step }) {
  const labels = ["Тема", "Ситуация", "Срочность", "Цель", "Результат"];

  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {labels.map((label, index) => {
        const isActive = currentStep === index;
        const isDone = currentStep > index;

        return (
          <li key={label} className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                isActive || isDone ? "bg-trust text-white" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {index + 1}
            </span>
            <span className={`min-w-0 text-sm font-semibold ${isActive ? "text-ink" : "text-zinc-500"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function CategoryStep({ categories, onSelect }: { categories: LegalCategory[]; onSelect: (slug: string) => void }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">Выберите тему</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
        Начните с общей области. На следующем шаге можно будет выбрать конкретную жизненную ситуацию или посмотреть несколько подходящих вариантов.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => onSelect(category.slug)}
            className="min-w-0 rounded-lg border border-line bg-white p-4 text-left shadow-sm transition hover:border-trust hover:bg-zinc-50"
          >
            <span className="block text-base font-semibold text-ink">{category.title}</span>
            <span className="mt-2 line-clamp-3 block text-sm leading-6 text-zinc-600">{category.userProblem || category.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProblemStep({
  category,
  onBack,
  onContinue,
  onQueryChange,
  onSelectProblem,
  problems,
  query,
  selectedProblemSlug,
  totalCount
}: {
  category: LegalCategory;
  onBack: () => void;
  onContinue: () => void;
  onQueryChange: (value: string) => void;
  onSelectProblem: (slug: string) => void;
  problems: LegalProblem[];
  query: string;
  selectedProblemSlug: string;
  totalCount: number;
}) {
  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{category.title}</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Что случилось?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">Выберите наиболее похожую ситуацию или оставьте выбор пустым, чтобы получить несколько вариантов.</p>
        </div>
        <button type="button" onClick={onBack} className="w-fit rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
          Назад
        </button>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-ink">Поиск внутри темы</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Например: судебный приказ, увольнение, алименты"
          className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-trust"
        />
      </label>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {problems.map((problem) => (
          <button
            key={problem.slug}
            type="button"
            onClick={() => onSelectProblem(problem.slug)}
            className={`min-w-0 rounded-lg border p-4 text-left shadow-sm transition ${
              selectedProblemSlug === problem.slug ? "border-trust bg-emerald-50" : "border-line bg-white hover:border-trust"
            }`}
          >
            <span className="block text-base font-semibold text-ink">{problem.shortTitle}</span>
            <span className="mt-2 line-clamp-3 block text-sm leading-6 text-zinc-600">{problem.shortAnswer}</span>
          </button>
        ))}
      </div>

      {!problems.length ? <p className="mt-5 rounded-lg border border-line bg-zinc-50 p-4 text-sm text-zinc-600">По этому запросу ситуаций не найдено. Очистите поиск или продолжите без точного выбора.</p> : null}
      {totalCount > problems.length ? <p className="mt-3 text-sm text-zinc-500">Показаны ближайшие варианты. Уточните поиск, если нужно сузить список.</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onContinue} className="rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          Продолжить
        </button>
        {selectedProblemSlug ? (
          <button type="button" onClick={() => onSelectProblem("")} className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            Сбросить ситуацию
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ChoiceStep({
  description,
  onBack,
  onContinue,
  onSelect,
  options,
  selectedId,
  title
}: {
  description: string;
  onBack: () => void;
  onContinue: () => void;
  onSelect: (id: string) => void;
  options: ChoiceOption[];
  selectedId: string;
  title: string;
}) {
  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        <button type="button" onClick={onBack} className="w-fit rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
          Назад
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`rounded-lg border p-4 text-left shadow-sm transition ${
              selectedId === option.id ? "border-trust bg-emerald-50" : "border-line bg-white hover:border-trust"
            }`}
          >
            <span className="block text-base font-semibold text-ink">{option.title}</span>
            <span className="mt-2 block text-sm leading-6 text-zinc-600">{option.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onContinue} disabled={!selectedId} className="rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:bg-zinc-300">
          Продолжить
        </button>
      </div>
    </section>
  );
}

function CheckResult({
  category,
  documents,
  goalId,
  onBack,
  onReset,
  problem,
  recommendations,
  urgencyId
}: {
  category: LegalCategory;
  documents: NavigatorDocument[];
  goalId: string;
  onBack: () => void;
  onReset: () => void;
  problem: LegalProblem;
  recommendations: LegalProblem[];
  urgencyId: string;
}) {
  const problemHref = `/problems/${problem.categorySlug}/${problem.slug}/`;
  const firstDocument = documents[0];
  const documentHref = firstDocument
    ? `/documents/${firstDocument.slug}/${firstDocument.templateSlug ? "#fill-online" : ""}`
    : "/documents/";
  const documentCtaLabel = firstDocument?.templateSlug
    ? getDocumentOnlineFillCtaLabel(firstDocument)
    : firstDocument
      ? getDocumentCardCtaLabel(firstDocument)
      : "Подобрать документ";

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Результат диагностики</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Рекомендуемая ситуация: {problem.shortTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            Это предварительная навигация по теме «{category.title}». Она не заменяет консультацию, но помогает перейти к правильной инструкции, документу или вопросу юристу.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBack} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Назад
          </button>
          <button type="button" onClick={onReset} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Начать заново
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-line bg-zinc-50 p-5">
          <h3 className="text-xl font-semibold text-ink">Краткий ответ</h3>
          <p className="mt-3 text-base leading-7 text-zinc-700">{problem.shortAnswer}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoPanel label="Риск" value={riskLabel(problem.riskLevel)} tone={problem.riskLevel} />
            <InfoPanel label="Срочность" value={urgencyLabel(problem.urgency)} tone={urgencyTone(problem.urgency)} />
          </div>
          <p className="mt-4 rounded-lg bg-white p-4 text-sm leading-6 text-zinc-700">{urgencyAdvice(urgencyId)}</p>
        </div>

        <aside className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-ink">Что вы выбрали</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-zinc-500">Тема</dt>
              <dd className="mt-1 text-ink">{category.title}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-500">Цель</dt>
              <dd className="mt-1 text-ink">{goalOptions.find((option) => option.id === goalId)?.title ?? "Не выбрана"}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ResultList title="Какие сроки проверить" items={problem.deadlines.length ? problem.deadlines : ["Дата получения документа, дата нарушения и срок обращения или обжалования."]} />
        <ResultList title="Какие документы могут понадобиться" items={problem.documents.length ? problem.documents : ["Договоры, переписка, чеки, выписки, заявления, ответы ведомств или судебные документы."]} />
      </div>

      <div className="mt-6">
        <ResultList title="Когда лучше обратиться к юристу" items={lawyerHelpReasons} />
      </div>

      {documents.length ? (
        <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Подходящие документы</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {documents.map((document) => (
              <Link
                key={document.slug}
                href={`/documents/${document.slug}/${document.templateSlug ? "#fill-online" : ""}`}
                className="rounded-md border border-line p-4 hover:border-trust"
              >
                <span className="block font-semibold text-ink">{document.title}</span>
                <span className="mt-2 line-clamp-2 block text-sm leading-6 text-zinc-600">{document.description}</span>
                <span className="mt-3 inline-flex text-sm font-semibold text-trust">
                  {document.templateSlug ? getDocumentOnlineFillCtaLabel(document) : getDocumentCardCtaLabel(document)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Похожие Q&A</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Ищите вопросы по этим темам: {problem.relatedQuestionTopics.slice(0, 4).join(", ") || category.questionTopics.slice(0, 4).join(", ")}.</p>
          <Link href="/questions/" className="mt-4 inline-flex rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Смотреть вопросы
          </Link>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Юристы по теме</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Подходящие специализации: {problem.relatedLawyerSpecializations.slice(0, 4).join(", ") || category.lawyerSpecializations.slice(0, 4).join(", ")}.</p>
          <Link href="/lawyers/" className="mt-4 inline-flex rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            Посмотреть юристов
          </Link>
        </div>
      </section>

      {!recommendations.some((item) => item.slug === problem.slug) || recommendations.length <= 1 ? null : (
        <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-ink">Еще возможные ситуации</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendations
              .filter((item) => item.slug !== problem.slug)
              .map((item) => (
                <Link key={item.slug} href={`/problems/${item.categorySlug}/${item.slug}/`} className="rounded-md border border-line p-4 hover:border-trust">
                  <span className="font-semibold text-ink">{item.shortTitle}</span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-6 text-zinc-600">{item.shortAnswer}</span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {problem.slug === "sudebnyy-prikaz" ? (
          <Link href="/tools/sudebnyy-prikaz-deadline/" className="rounded-md bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700">
            Рассчитать срок отмены приказа
          </Link>
        ) : null}
        <Link href={problemHref} className="rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          Открыть инструкцию
        </Link>
        <Link href={documentHref} className="rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          {documentCtaLabel}
        </Link>
        <Link href="/questions/#question" className="rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Задать вопрос по ситуации
        </Link>
        <Link href="/lawyers/" className="rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Посмотреть юристов
        </Link>
      </div>
    </section>
  );
}

function ResultList({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <ul className="mt-4 grid gap-3">
        {items.slice(0, 5).map((item) => (
          <li key={item} className="flex min-w-0 gap-2 text-sm leading-6 text-zinc-700">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-trust" aria-hidden="true" />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InfoPanel({ label, tone, value }: { label: string; tone: LegalProblemRiskLevel; value: string }) {
  const className =
    tone === "high"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function rankProblems(problems: LegalProblem[], urgencyId: string, goalId: string, selectedProblemSlug: string) {
  return [...problems].sort((a, b) => {
    if (a.slug === selectedProblemSlug) return -1;
    if (b.slug === selectedProblemSlug) return 1;

    const scoreA = scoreProblem(a, urgencyId, goalId);
    const scoreB = scoreProblem(b, urgencyId, goalId);
    return scoreB - scoreA || a.shortTitle.localeCompare(b.shortTitle, "ru");
  });
}

function scoreProblem(problem: LegalProblem, urgencyId: string, goalId: string) {
  let score = 0;
  if (problem.riskLevel === "high") score += urgencyId === "research" ? 1 : 4;
  if (problem.riskLevel === "medium") score += 2;
  if (problem.urgency === "today") score += urgencyId === "deadline" || urgencyId === "court" || urgencyId === "money" ? 5 : 1;
  if (problem.urgency === "few_days") score += 2;
  if (goalId === "document" && problem.relatedDocumentSlugs.length) score += 4;
  if (goalId === "lawyer" && problem.relatedLawyerSpecializations.length) score += 3;
  if (goalId === "answer" && problem.relatedQuestionTopics.length) score += 3;
  return score;
}

function riskLabel(value: LegalProblemRiskLevel) {
  if (value === "high") return "высокий";
  if (value === "medium") return "средний";
  return "низкий";
}

function urgencyLabel(value: LegalProblemUrgency) {
  if (value === "today") return "сегодня";
  if (value === "few_days") return "несколько дней";
  return "обычная";
}

function urgencyTone(value: LegalProblemUrgency): LegalProblemRiskLevel {
  if (value === "today") return "high";
  if (value === "few_days") return "medium";
  return "low";
}

function urgencyAdvice(urgencyId: string) {
  if (urgencyId === "deadline") return "Сначала найдите дату получения документа и срок, который в нем указан. От этой даты зависит, можно ли подать возражение, жалобу или заявление без восстановления срока.";
  if (urgencyId === "court") return "Если уже есть суд, повестка, иск или приказ, безопаснее сразу проверить процессуальный срок и подготовить письменную позицию.";
  if (urgencyId === "money") return "Если деньги уже списаны или счет заблокирован, запросите основание списания и сохраните выписку. Дальше обычно нужна жалоба, заявление или возражение.";
  if (urgencyId === "research") return "Если срочности пока нет, начните с инструкции и списка документов. Это поможет не делать лишних действий и понять, нужен ли юрист.";
  return "Если вы не уверены в срочности, считайте, что сначала нужно проверить даты, документы и наличие официальных требований.";
}
