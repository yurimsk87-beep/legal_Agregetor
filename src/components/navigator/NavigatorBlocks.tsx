import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Route, Search } from "lucide-react";
import { ExpandableLawyerGrid } from "@/components/lawyers/ExpandableLawyerGrid";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { RelatedQuestionsExpandable } from "@/components/questions/QuestionsList";
import type { Lawyer, Question } from "@/lib/types";
import type { LegalCategory } from "@/data/legal-categories";
import type { LegalProblem } from "@/data/legal-problems";
import type { NavigatorDocument } from "@/data/documents";
import type { NavigatorTool } from "@/data/tools";
import { getDocumentOnlineFillCtaLabel } from "@/lib/document-seo";
import { SiteSearchBox } from "@/components/search/SiteSearchBox";

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-trust">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-base leading-7 text-zinc-600">{description}</p> : null}
    </div>
  );
}

export function NavigatorHero({ aiNavigatorEnabled = false }: { aiNavigatorEnabled?: boolean } = {}) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:px-8">
        <div className="flex min-w-0 flex-col justify-center">
          <SiteSearchBox
            compact
            headingLevel="h1"
            aiNavigatorPage={aiNavigatorEnabled ? "home" : undefined}
            title="Опишите юридическую проблему — мы покажем, что делать дальше"
            description="Разберём ситуацию, покажем сроки и риски, подготовим документы и подскажем, когда стоит подключить юриста."
          />

          <p className="mt-4 text-sm leading-6 text-zinc-600">Можно писать обычными словами — юридические термины знать не нужно.</p>
        </div>
        <div className="self-center border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Маршрут решения</p>
          <div className="mt-4 grid gap-4">
            {[
              "Опишите проблему",
              "Получите разбор и документы",
              "Передайте юристу, если нужна проверка"
            ].map((step) => (
              <div key={step} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
                <span className="text-sm font-semibold leading-6 text-ink">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SituationSearch() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Search className="mt-1 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-ink">Найдите ситуацию, документ или инструмент</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              Введите несколько слов: например, судебный приказ, приставы, зарплата, алименты или возврат денег.
            </p>
            <form action="/questions/" className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                name="q"
                placeholder="Например: судебный приказ"
                className="min-h-11 flex-1 rounded-md border border-line px-4 text-base text-ink outline-none focus:border-trust"
              />
              <button type="submit" className="min-h-11 rounded-md bg-ink px-5 text-sm font-semibold text-white hover:bg-trust">
                Найти
              </button>
              <Link href="/problems/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-semibold text-ink hover:border-trust">
                Смотреть ситуации
              </Link>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LegalCategoryGrid({ categories }: { categories: LegalCategory[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.slug} href={`/problems/${category.slug}/`} className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
          <h3 className="text-lg font-semibold text-ink">{category.title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{category.description}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-trust">
            Смотреть ситуации
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </p>
        </Link>
      ))}
    </div>
  );
}

export function ProblemCard({ problem }: { problem: LegalProblem }) {
  const href = `/problems/${problem.categorySlug}/${problem.slug}/`;

  return (
    <MaterialCard
      title={problem.title}
      description={problem.shortAnswer}
      href={href}
      trustLabels={getProblemTrustLabels(problem)}
      actions={[{ href, label: "Понять, что делать", variant: "secondary" }]}
    />
  );
}

export function DocumentCard({ document, variantKey }: { document: NavigatorDocument; variantKey?: string }) {
  const documentHref = `/documents/${document.slug}/`;
  // Генератор живёт на странице документа (#fill-online). variantKey предвыбирает
  // вариант под конкретную ситуацию (например, судебный приказ → ?variant=credit-loan).
  const generatorHref = document.templateSlug
    ? `/documents/${document.slug}/${variantKey ? `?variant=${variantKey}` : ""}#fill-online`
    : null;

  return (
    <MaterialCard
      title={document.title}
      description={document.shortDescription || document.description}
      href={documentHref}
      actions={[
        // Одна кнопка на карточке: «Сформировать документ». С генератором ведёт на
        // генератор (с вариантом, если задан), без генератора — на страницу документа.
        { href: generatorHref ?? documentHref, label: getDocumentOnlineFillCtaLabel(document), variant: "primary" as const }
      ]}
    />
  );
}

function getProblemTrustLabels(problem: LegalProblem) {
  return [
    problem.urgency === "today" || problem.riskLevel === "high" ? "Есть важные сроки" : ""
  ].filter(Boolean);
}

export function ToolCard({ tool }: { tool: NavigatorTool }) {
  if (tool.status !== "available") return null;

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <Route className="h-5 w-5 text-trust" aria-hidden="true" />
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">Доступно</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-ink">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{tool.description}</p>
      {tool.status === "available" ? <span className="mt-4 inline-flex text-sm font-semibold text-trust">Открыть инструмент</span> : null}
    </>
  );

  return (
    <Link href={`/tools/${tool.slug}/`} className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
      {content}
    </Link>
  );
}

export function HowItWorks() {
  const steps = [
    ["Определяем ситуацию", "Вы выбираете жизненную ситуацию или описываете вопрос без лишнего сбора контактов."],
    ["Показываем сроки и риски", "Вы видите, какие даты, документы и последствия нужно проверить до заявления, жалобы или суда."],
    ["Подбираем документы", "Сервис дает шаблон и список данных, которые понадобятся для безопасного первого шага."],
    ["Показываем, когда нужен юрист", "Если риск высокий, есть спор или нужны документы для оценки, направляем к Q&A и профилям специалистов."]
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {steps.map(([title, description], index) => (
        <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
          <h3 className="mt-4 font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
        </article>
      ))}
    </div>
  );
}

export function ProblemSteps({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 rounded-lg border border-line bg-white p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
          <p className="leading-7 text-zinc-700">{item}</p>
        </li>
      ))}
    </ol>
  );
}

export function DeadlineRiskBlock({ deadlines, risks }: { deadlines: string[]; risks: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <Clock className="h-5 w-5 text-trust" aria-hidden="true" />
          Сроки
        </h2>
        <List items={deadlines} />
      </div>
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
          Риски
        </h2>
        <List items={risks} />
      </div>
    </div>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-trust" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function RelatedQuestionsBlock({ questions }: { questions: Question[] }) {
  if (!questions.length) return null;

  return <RelatedQuestionsExpandable questions={questions} />;
}

export function RelatedLawyersBlock({ lawyers }: { lawyers: Lawyer[] }) {
  if (!lawyers.length) return null;

  return <ExpandableLawyerGrid lawyers={lawyers} />;
}
