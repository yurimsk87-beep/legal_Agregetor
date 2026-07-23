import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { LegalReferencesBlock } from "@/components/legal/LegalReferencesBlock";
import { DocumentCard, ProblemCard, RelatedLawyersBlock, RelatedQuestionsBlock, SectionHeading } from "@/components/navigator/NavigatorBlocks";
import { DutyLawyerWidget } from "@/components/qna/DutyLawyerWidget";
import { getDocumentCardCtaLabel, getDocumentOnlineFillCtaLabel } from "@/lib/document-seo";
import { breadcrumbJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { getRelatedLawyersBySpecializations, getRelatedQuestionsForContext } from "@/lib/navigator-relations";
import { buildProblemQuestionContext } from "@/data/related-questions-context";
import { getLegalCategory } from "@/data/legal-categories";
import { getLegalReferences } from "@/data/legal-references";
import type { LegalProblem, LegalProblemFaq, LegalProblemRiskLevel, LegalProblemUrgency } from "@/data/legal-problems";
import { getLegalProblem, getProblemsByCategory, legalProblems } from "@/data/legal-problems";
import type { NavigatorDocument } from "@/data/documents";
import { navigatorDocuments } from "@/data/documents";
import type { NavigatorTool } from "@/data/tools";
import { navigatorTools } from "@/data/tools";
import {
  getZagsScenario,
  ZAGS_PROBLEM_ROUTE,
  ZAGS_SCENARIO_CHOICES
} from "@/data/zags-route";
import type { ZagsScenarioKey } from "@/data/zags-route";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
  searchParams?: Promise<{ scenario?: string }>;
};

function renderNoteText(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) return <Link key={i} href={m[2]} className="font-medium underline underline-offset-2 hover:opacity-75">{m[1]}</Link>;
    return part;
  });
}

const FIRST_ACTIONS_FALLBACK = [
  "Сохраните все документы и переписку.",
  "Проверьте даты и сроки.",
  "Не подписывайте новые документы без понимания последствий.",
  "Подготовьте письменное обращение или претензию.",
  "Обратитесь к юристу, если есть суд, крупная сумма или риск потери имущества."
];

const DEADLINES_FALLBACK = [
  "Точный срок зависит от вида требования, даты нарушения и того, куда нужно обращаться. До подачи заявления или жалобы проверьте дату события и срок обжалования."
];

const DOCUMENTS_FALLBACK =
  "Точный список документов зависит от ситуации. Обычно нужны документы, подтверждающие факт нарушения, даты, суммы, переписку и ваши обращения.";

const MISTAKES_FALLBACK = [
  "ждать устных обещаний и ничего не фиксировать письменно;",
  "пропустить срок обращения или обжалования;",
  "отправить документ без подтверждения подачи;",
  "не сохранить копии заявлений, чеков, уведомлений и переписки;",
  "подписать соглашение, не понимая последствий."
];

const SELF_HELP_CONDITIONS = [
  "ситуация простая и есть документы, подтверждающие ваши слова;",
  "нет суда, уголовных рисков и угрозы потери жилья, работы или имущества;",
  "сумма спора небольшая, а порядок обращения стандартный;",
  "сроки не пропущены, и можно направить обычную претензию, заявление или жалобу."
];

const LAWYER_CONDITIONS = [
  "срок уже пропущен или до его окончания осталось мало времени;",
  "есть суд, повестка, исполнительное производство или официальный отказ;",
  "спор связан с крупной суммой, жильем, работой, детьми или выплатами;",
  "есть риск уголовной ответственности;",
  "нужно оценить договор, судебный акт, отказ, переписку или другой документ;",
  "ситуация отличается от типового сценария, а факты требуют проверки."
];

// Все валидные ситуации перечислены ниже → неизвестные slug дают настоящий 404
// (не soft-404 с кодом 200). revalidate делает страницу ISR → кэшируемый ответ
// (s-maxage) вместо no-store.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return legalProblems.map((problem) => ({ category: problem.categorySlug, slug: problem.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
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
    // Индексируем только ситуации раздела «Семья и дети»; остальные закрыты.
    isIndexable: problem.categorySlug === "semya-i-deti",
    searchParams: resolvedSearchParams
  });
}

export default async function ProblemPage({ params, searchParams }: PageProps) {
  const { category: categorySlug, slug } = await params;
  const category = getLegalCategory(categorySlug);
  const problem = getLegalProblem(categorySlug, slug);
  if (!category || !problem) notFound();

  const problemPath = `/problems/${category.slug}/${problem.slug}/`;
  if (category.slug === ZAGS_PROBLEM_ROUTE.categorySlug && problem.slug === ZAGS_PROBLEM_ROUTE.problemSlug) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const scenario = normalizeZagsScenario(resolvedSearchParams.scenario);
    return <ZagsProblemPage categoryTitle={category.title} problem={problem} problemPath={problemPath} scenario={scenario} />;
  }

  const [relatedQuestions, relatedLawyers] = await Promise.all([
    getRelatedQuestionsForContext(
      buildProblemQuestionContext({ slug: problem.slug, categoryTitle: category.title, primaryTags: problem.relatedQuestionTopics }),
      { limit: 12 }
    ),
    getRelatedLawyersBySpecializations(problem.relatedLawyerSpecializations)
  ]);
  const relatedDocuments = navigatorDocuments.filter((document) => problem.relatedDocumentSlugs.includes(document.slug));
  const relatedTools = navigatorTools.filter((tool) => tool.status === "available" && tool.relatedProblemSlugs.includes(problem.slug));
  const relatedProblems = getProblemsByCategory(category.slug).filter((item) => item.slug !== problem.slug);
  const legalReferences = getLegalReferences(problem.legalReferenceKeys);
  const checkHref = "/questions/";
  const checkCtaLabel = "Задать вопрос юристу";
  const firstDocument = relatedDocuments[0];
  const firstDocumentHref = firstDocument
    ? `/documents/${firstDocument.slug}/${firstDocument.templateSlug ? "#fill-online" : ""}`
    : "/documents/";
  const firstDocumentCtaLabel =
    firstDocument?.templateSlug
      ? getDocumentOnlineFillCtaLabel(firstDocument)
      : firstDocument
        ? getDocumentCardCtaLabel(firstDocument)
        : "Подобрать документ";
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: category.title, path: `/problems/${category.slug}/` },
    { name: problem.shortTitle, path: problemPath }
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          legalServiceJsonLd({
            path: problemPath,
            name: problem.h1,
            description: problem.description,
            lawyers: relatedLawyers
          }),
          articleJsonLd(problem, category.title),
          faqPageJsonLd(problem.faq)
        ]}
      />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <SituationHero
          categoryTitle={category.title}
          checkCtaLabel={checkCtaLabel}
          checkHref={checkHref}
          documentCtaLabel={firstDocumentCtaLabel}
          documentHref={firstDocumentHref}
          problem={problem}
          showLawyerCta
        />

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <FirstActionsBlock steps={problem.steps} />
          <WhatToKnowBlock items={problem.whatToKnow} />
        </section>

        <section className="mt-8">
          <DeadlineRiskSummaryBlock problem={problem} />
        </section>

        {legalReferences.length ? (
          <div className="mt-8">
            <LegalReferencesBlock references={legalReferences} />
          </div>
        ) : null}

        <section className="mt-8">
          <SelfHelpOrLawyerBlock problem={problem} />
        </section>

        <section className="mt-8">
          <RequiredDocumentsBlock documents={relatedDocuments} fallbackItems={problem.documents} />
        </section>

        {relatedTools.length ? (
          <section className="mt-8">
            <RelatedToolsBlock tools={relatedTools} />
          </section>
        ) : null}

        <section className="mt-8">
          <StepPlanBlock steps={problem.steps} />
        </section>

        <section className="mt-8">
          <CommonMistakesBlock mistakes={problem.mistakes} />
        </section>

        <FaqBlock faq={problem.faq} />
      </article>

      {relatedProblems.length ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeading title="Связанные ситуации" description="Похожие сценарии из этой же категории навигатора." />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedProblems.slice(0, 3).map((item) => (
                <ProblemCard key={item.slug} problem={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="Похожие вопросы по этой ситуации" description="Подобрали вопросы пользователей с похожим контекстом." />
        <div className="mt-6">
          {relatedQuestions.length ? (
            <RelatedQuestionsBlock questions={relatedQuestions} />
          ) : (
            <RelatedEmptyState
              actionHref="/questions/#question"
              actionLabel="Задать вопрос по вашей ситуации"
              text="Пока нет подходящих вопросов по этой теме. Вы можете описать свою ситуацию, и вопрос пройдет модерацию перед публикацией."
            />
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Юристы по этой теме" description="Если ситуация сложная, выберите специалиста по подходящей специализации." />
          <div className="mt-6">
            {relatedLawyers.length ? (
              <RelatedLawyersBlock lawyers={relatedLawyers} />
            ) : (
              <RelatedEmptyState
                actionHref="/lawyers/"
                actionLabel="Открыть каталог юристов"
                text="Пока нет юристов с точной специализацией. Посмотрите общий каталог юристов или задайте вопрос через платформу."
              />
            )}
          </div>
        </div>
      </section>

      <SituationFinalCta checkHref={checkHref} documentHref={firstDocumentHref} problemPath={problemPath} />
      <DutyLawyerWidget source="problem-situation" />
    </>
  );
}

function normalizeZagsScenario(value: string | undefined): ZagsScenarioKey | null {
  return getZagsScenario(value)?.key ?? null;
}

function ZagsProblemPage({
  categoryTitle,
  problem,
  problemPath,
  scenario
}: {
  categoryTitle: string;
  problem: LegalProblem;
  problemPath: string;
  scenario: ZagsScenarioKey | null;
}) {
  const selectedScenario = getZagsScenario(scenario);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: categoryTitle, path: `/problems/${problem.categorySlug}/` },
    { name: "Брак и ЗАГС", path: problemPath }
  ];
  const visibleFaq = selectedScenario?.faq ?? [];

  return (
    <>
      <JsonLd
        data={
          selectedScenario
            ? breadcrumbJsonLd(breadcrumbs)
            : [
                breadcrumbJsonLd(breadcrumbs),
                legalServiceJsonLd({ path: problemPath, name: "Брак и ЗАГС", description: problem.shortAnswer, lawyers: [] }),
                articleJsonLd(problem, categoryTitle)
              ]
        }
      />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-5xl">Брак и ЗАГС</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            Выберите, что вам нужно сделать. Покажем только подходящие шаги и документы.
          </p>
        </header>

        {!selectedScenario ? (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-2">
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
            <section className="mt-6 border-t border-line pt-5">
              <h2 className="text-xl font-semibold text-ink">Как выбрать маршрут</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">
                Регистрация брака, отдельная перемена имени, получение повторного документа и исправление актовой записи — разные процедуры. После выбора останутся только относящиеся к ней форма, документы, срок и госпошлина.
              </p>
            </section>
          </>
        ) : (
          <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-trust">{selectedScenario.shortTitle}</p>
                <h2 className="mt-2 text-3xl font-semibold text-ink">{selectedScenario.title}</h2>
              </div>
              <Link href={problemPath} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">
                Назад к выбору
              </Link>
            </div>

            <div className="mt-5 grid gap-3 text-base leading-7 text-zinc-700">
              {selectedScenario.description.slice(0, 2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <section className="rounded-lg border border-line bg-zinc-50 p-4">
                <h3 className="text-xl font-semibold text-ink">Шаги</h3>
                <ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
                  {selectedScenario.steps.slice(0, 5).map((step, index) => (
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
                  {selectedScenario.documents.map((document) => (
                    <li key={document}>- {document}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="mt-5 grid gap-4">
              <InfoBox title="Основной документ" text={selectedScenario.mainDocument} />
              <InfoBox title="Куда и как подать" text={selectedScenario.filing} />
              <InfoBox title="Срок" text={selectedScenario.term} />
              <InfoBox title="Госпошлина" text={selectedScenario.fee} />
            </div>

            {selectedScenario.warning ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                {selectedScenario.warning}
              </div>
            ) : null}

            <div className="mt-6">
              <Link href={`/documents/${ZAGS_PROBLEM_ROUTE.documentSlug}/?variant=${selectedScenario.key}#fill-online`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                Заполнить заявление
              </Link>
            </div>

            <section className="mt-6 border-t border-line pt-5">
              <h3 className="text-xl font-semibold text-ink">Правовые основания и формы</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6">
                {selectedScenario.legalSources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noreferrer" className="font-medium text-trust underline underline-offset-4 hover:text-ink">
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {visibleFaq.length ? (
              <section className="mt-6">
                <h3 className="text-xl font-semibold text-ink">Частые вопросы</h3>
                <div className="mt-3 grid gap-3">
                  {visibleFaq.slice(0, 4).map((item) => (
                    <details key={item.question} className="rounded-lg border border-line bg-zinc-50 p-4">
                      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">{item.question}</summary>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        )}

        {problem.lastReviewedAt ? (
          <p className="mt-5 text-xs leading-5 text-zinc-500">Юридическая проверка: {formatReviewDate(problem.lastReviewedAt)}.</p>
        ) : null}
      </article>
    </>
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
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

function SituationHero({
  categoryTitle,
  checkCtaLabel,
  checkHref,
  documentCtaLabel,
  documentHref,
  problem,
  showLawyerCta
}: {
  categoryTitle: string;
  checkCtaLabel: string;
  checkHref: string;
  documentCtaLabel: string;
  documentHref: string;
  problem: LegalProblem;
  showLawyerCta: boolean;
}) {
  return (
    <header className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{categoryTitle}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{problem.h1}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{problem.shortAnswer}</p>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">{problem.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={checkHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              {checkCtaLabel}
            </Link>
            <Link href={documentHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              {documentCtaLabel}
            </Link>
            {showLawyerCta ? (
              <Link href="/lawyers/" className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
                Посмотреть юристов
              </Link>
            ) : null}
          </div>
        </div>
        <aside className="border-t border-line bg-zinc-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="grid gap-3">
            <InfoBadge label="Риск" value={riskLabel(problem.riskLevel)} tone={riskTone(problem.riskLevel)} />
            {problem.urgencyNote ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Срочность</p>
                <p className="mt-1 text-sm leading-5 text-zinc-700">{problem.urgencyNote}</p>
              </div>
            ) : (
              <InfoBadge label="Срочность" value={urgencyLabel(problem.urgency)} tone={urgencyTone(problem.urgency)} />
            )}
          </div>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">{problem.heroNote?.title ?? "Важно: не пропустите срок."}</p>
            <p className="mt-1">{renderNoteText(problem.heroNote?.text ?? "Перед обращением проверьте дату нарушения, дату получения документа и срок обжалования.")}</p>
          </div>
        </aside>
      </div>
    </header>
  );
}

function FirstActionsBlock({ steps }: { steps: string[] }) {
  const items = steps.length ? steps.slice(0, 5) : FIRST_ACTIONS_FALLBACK;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Что сделать в первую очередь</h2>
      <ol className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex min-w-0 gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
            <span className="min-w-0 text-sm leading-6 text-zinc-700">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WhatToKnowBlock({ items }: { items: string[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Что важно знать</h2>
      <TextList items={items.length ? items : FIRST_ACTIONS_FALLBACK.slice(0, 4)} />
    </section>
  );
}

function DeadlineRiskSummaryBlock({ problem }: { problem: LegalProblem }) {
  const deadlines = problem.deadlines.length ? problem.deadlines : DEADLINES_FALLBACK;
  const risks = problem.risks.length ? problem.risks : ["Если не зафиксировать нарушение и пропустить срок обращения, защитить позицию будет сложнее."];

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Сроки и риски</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Сроки и риски</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Что может повлиять на результат и какие даты нужно проверить в первую очередь.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className={badgeClassName(riskTone(problem.riskLevel))}>Риск: {riskLabel(problem.riskLevel)}</span>
          <span className={badgeClassName(urgencyTone(problem.urgency))}>Срочность: {urgencyLabel(problem.urgency)}</span>
        </div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 p-4">
          <h3 className="font-semibold text-ink">Сроки</h3>
          <TextList items={deadlines} />
        </div>
        <div className="rounded-lg bg-zinc-50 p-4">
          <h3 className="font-semibold text-ink">Риски</h3>
          <TextList items={risks} />
        </div>
      </div>
    </div>
  );
}

function SelfHelpOrLawyerBlock({ problem }: { problem: LegalProblem }) {
  const note =
    problem.riskLevel === "high" || problem.urgency === "today"
      ? "По этой ситуации лучше не затягивать: проверьте сроки и документы до любых новых заявлений или подписей."
      : "Если факты понятны и документы на руках, часть действий можно начать самостоятельно.";

  const selfHelpItems = problem.selfHelpConditions ?? SELF_HELP_CONDITIONS;
  const lawyerItems = problem.lawyerConditions ?? LAWYER_CONDITIONS;

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Можно ли решить самостоятельно</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{note}</p>
        <TextList items={selfHelpItems} />
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-ink">Когда нужен юрист</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Навигатор показывает общий маршрут, но не оценивает все документы и доказательства. В этих случаях лучше получить индивидуальную правовую оценку.
        </p>
        <TextList items={lawyerItems} />
      </div>
    </section>
  );
}

function RequiredDocumentsBlock({
  documents,
  fallbackItems
}: {
  documents: NavigatorDocument[];
  fallbackItems: string[];
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-semibold text-ink">Какие документы понадобятся</h2>
      {documents.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard key={document.slug} document={document} />
          ))}
        </div>
      ) : (
        <>
          <p className="mt-3 text-base leading-7 text-zinc-700">{DOCUMENTS_FALLBACK}</p>
          <TextList items={fallbackItems.length ? fallbackItems : FIRST_ACTIONS_FALLBACK.slice(0, 4)} />
        </>
      )}
    </section>
  );
}

function RelatedToolsBlock({ tools }: { tools: NavigatorTool[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-semibold text-ink">Инструменты по этой ситуации</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">Проверьте сроки и риски до подачи документов.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}/`} className="rounded-lg border border-line bg-zinc-50 p-4 hover:border-trust">
            <h3 className="font-semibold text-ink">{tool.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{tool.description}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-trust">Открыть инструмент</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RelatedEmptyState({ actionHref, actionLabel, text }: { actionHref: string; actionLabel: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm leading-6 text-zinc-600">
      <p>{text}</p>
      <Link href={actionHref} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
        {actionLabel}
      </Link>
    </div>
  );
}

function StepPlanBlock({ steps }: { steps: string[] }) {
  const items = steps.length ? steps : FIRST_ACTIONS_FALLBACK;

  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">Пошаговый план</h2>
      <ol className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex min-w-0 gap-4 rounded-lg border border-line bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
            <p className="min-w-0 leading-7 text-zinc-700">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CommonMistakesBlock({ mistakes }: { mistakes: string[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Частые ошибки</h2>
      <TextList items={mistakes.length ? mistakes : MISTAKES_FALLBACK} />
    </section>
  );
}

function FaqBlock({ faq }: { faq: LegalProblemFaq[] }) {
  if (!faq.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-ink">FAQ</h2>
      <div className="mt-5 grid gap-3">
        {faq.map((item) => (
          <details key={item.question} className="group rounded-lg border border-line bg-white px-5 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-4 text-sm leading-6 text-zinc-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SituationFinalCta({ checkHref, documentHref, problemPath }: { checkHref: string; documentHref: string; problemPath: string }) {
  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold">Не уверены, что делать дальше?</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-200">
          Опишите ситуацию — мы подскажем, какие сроки проверить, какие документы подготовить и когда лучше подключить юриста.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={checkHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-zinc-100">
            Проверить ситуацию
          </Link>
          <QuestionCtaLink sourcePage={problemPath} label="Спросить юриста бесплатно" variant="secondary" />
          <Link href={documentHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Найти документ
          </Link>
          <Link href="/document-check/" className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Проверить документ
          </Link>
        </div>
      </div>
    </section>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex min-w-0 gap-2 text-sm leading-6 text-zinc-700">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-trust" aria-hidden="true" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBadge({ label, value, tone }: { label: string; value: string; tone: BadgeTone }) {
  return (
    <div className={`rounded-lg border p-4 ${badgePanelClassName(tone)}`}>
      <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function articleJsonLd(problem: { h1: string; description: string; categorySlug: string; slug: string }, categoryName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: problem.h1,
    description: problem.description,
    articleSection: categoryName,
    mainEntityOfPage: absoluteUrl(`/problems/${problem.categorySlug}/${problem.slug}/`)
  };
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

type BadgeTone = "green" | "amber" | "red";

function riskTone(value: LegalProblemRiskLevel): BadgeTone {
  if (value === "high") return "red";
  if (value === "medium") return "amber";
  return "green";
}

function urgencyTone(value: LegalProblemUrgency): BadgeTone {
  if (value === "today") return "red";
  if (value === "few_days") return "amber";
  return "green";
}

function badgeClassName(tone: BadgeTone) {
  if (tone === "red") return "rounded-full bg-red-50 px-3 py-1.5 text-red-700";
  if (tone === "amber") return "rounded-full bg-amber-50 px-3 py-1.5 text-amber-800";
  return "rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700";
}

function badgePanelClassName(tone: BadgeTone) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function faqPageJsonLd(faq: LegalProblemFaq[]) {
  if (faq.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}
