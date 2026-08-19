import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { DivorcePropertyDocumentHelper } from "@/components/documents/DivorcePropertyDocumentHelper";
import { GuardianshipDocumentHelper } from "@/components/documents/GuardianshipDocumentHelper";
import { ZagsApplicationHelper } from "@/components/documents/ZagsApplicationHelper";
import { ZagsScenarioOverview } from "@/components/documents/ZagsScenarioOverview";
import { getNavigatorDocument, navigatorDocuments } from "@/data/documents";
import {
  DIVORCE_PROPERTY_LEGAL_RULES,
  getDivorcePropertyLegalReviewDate,
  isDivorcePropertyLegalReviewFullyPrimaryVerified
} from "@/data/divorce-property-legal-review";
import { getDivorceScenarioByDocumentSlug } from "@/data/divorce-property-route";
import type { DivorcePropertyScenario } from "@/data/divorce-property-route";
import {
  GUARDIANSHIP_LEGAL_RULES,
  getGuardianshipLegalReviewDate,
  isGuardianshipLegalReviewFullyPrimaryVerified
} from "@/data/guardianship-legal-review";
import { getGuardianshipScenarioByDocumentSlug } from "@/data/guardianship-route";
import type { GuardianshipScenario } from "@/data/guardianship-route";
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
  if (!document) notFound();
  const isZagsReference = document.slug === ZAGS_PROBLEM_ROUTE.documentSlug;

  return buildMetadata({
    title: isZagsReference ? "Заявление в ЗАГС: формы и порядок заполнения" : document.seoTitle ?? document.title,
    description: isZagsReference
      ? "Выберите процедуру ЗАГС, проверьте форму, документы, пошлину и льготы, затем подготовьте сведения для официального заявления."
      : document.seoDescription ?? document.shortDescription,
    path: `/documents/${document.slug}/`,
    isIndexable: true,
    searchParams: searchParams ? await searchParams : {}
  });
}

export default async function DocumentPage({ params, searchParams }: PageProps) {
  const { documentSlug } = await params;
  const document = getNavigatorDocument(documentSlug);
  if (!document) notFound();

  const divorceScenario = getDivorceScenarioByDocumentSlug(document.slug);
  if (divorceScenario) {
    return <DivorcePropertyDocumentPage document={document} scenario={divorceScenario} />;
  }
  const guardianshipScenario = getGuardianshipScenarioByDocumentSlug(document.slug);
  if (guardianshipScenario) {
    return <GuardianshipDocumentPage document={document} scenario={guardianshipScenario} />;
  }
  if (document.slug !== ZAGS_PROBLEM_ROUTE.documentSlug) notFound();

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
                Подготовить документ
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

function GuardianshipDocumentPage({
  document,
  scenario
}: {
  document: NonNullable<ReturnType<typeof getNavigatorDocument>>;
  scenario: GuardianshipScenario;
}) {
  const documentPath = `/documents/${document.slug}/`;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" },
    { name: document.title, path: documentPath }
  ];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentWebPageJsonLd(documentPath, document.title, document.shortDescription)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{document.category}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{document.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{document.heroDescription}</p>
          <a href="#fill-online" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить документ</a>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-2">
          <DocumentFact title="Когда подходит" items={scenario.description} />
          <DocumentFact title="Что подготовить" items={scenario.documents} />
          <DocumentFact title="Пошлина и расходы" items={[scenario.fee]} />
          <DocumentFact title="Подача и срок" items={[scenario.filing, scenario.term]} />
        </section>
        {scenario.warning ? <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div> : null}
        <div className="mt-7"><GuardianshipDocumentHelper scenarioKey={scenario.key} /></div>

        <section className="mt-7 border-t border-line pt-6">
          <h2 className="text-2xl font-semibold text-ink">Правовой реестр</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">Для каждого правила указаны источник, предел применения и статус проверки. Региональные сведения не выдаются за федеральное правило.</p>
          <ul className="mt-4 grid gap-4 text-sm leading-6">
            {GUARDIANSHIP_LEGAL_RULES.filter((rule) => rule.scenarios.includes(scenario.key)).map((rule) => (
              <li key={rule.id} className="border-l-2 border-line pl-3">
                <p className="font-medium text-ink">{rule.statement}</p>
                <p className="text-zinc-600">{rule.act}, {rule.provision}. Тип: {guardianshipSourceLabel(rule.sourceType)}. Статус: {guardianshipStatusLabel(rule.status)}.</p>
                <p className="text-zinc-600">
                  {rule.edition ? `${rule.edition}. ` : ""}Проверено: {rule.reviewedAt.split("-").reverse().join(".")}.
                </p>
                <p className="text-zinc-600">Граница применения: {rule.scopeNote}</p>
                <a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Основной источник</a>
                {rule.supplementaryUrl ? <a href={rule.supplementaryUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Контрольная редакция</a> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Последняя документированная сверка: {getGuardianshipLegalReviewDate(scenario.key).split("-").reverse().join(".")}.
            {isGuardianshipLegalReviewFullyPrimaryVerified(scenario.key)
              ? " Все первичные официальные источники доступны."
              : " Недоступность первичного источника или необходимость региональной проверки раскрыта у соответствующего правила."}
          </p>
        </section>
      </article>
    </>
  );
}

function guardianshipSourceLabel(source: "official" | "official-court" | "consolidated-fallback") {
  if (source === "official") return "официальный";
  if (source === "official-court") return "официальная судебная практика";
  return "контрольная консолидированная редакция";
}

function guardianshipStatusLabel(status: "current" | "primary-unavailable" | "regional-check-required" | "not-found") {
  if (status === "current") return "актуально";
  if (status === "regional-check-required") return "нужна региональная проверка";
  if (status === "not-found") return "подтверждающая норма не найдена";
  return "первичный портал недоступен при проверке";
}

function DivorcePropertyDocumentPage({
  document,
  scenario
}: {
  document: NonNullable<ReturnType<typeof getNavigatorDocument>>;
  scenario: DivorcePropertyScenario;
}) {
  const documentPath = `/documents/${document.slug}/`;
  const problemPath = "/problems/semya-i-deti/razvod-i-razdel-imushchestva/";
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" },
    { name: document.title, path: documentPath }
  ];
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentWebPageJsonLd(documentPath, document.title, document.shortDescription)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-line pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{document.category}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{document.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{document.heroDescription}</p>
          <a href="#fill-online" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
            Подготовить документ
          </a>
        </header>

        <section className="mt-7 grid gap-4 md:grid-cols-2">
          <DocumentFact title="Когда подходит" items={scenario.description} />
          <DocumentFact title="Основные приложения" items={scenario.documents} />
          <DocumentFact title="Платёж" items={[scenario.fee]} />
          <DocumentFact title="Подача и срок" items={[scenario.filing, scenario.term]} />
        </section>

        {scenario.warning ? <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div> : null}

        <div className="mt-7">
          <DivorcePropertyDocumentHelper scenarioKey={scenario.key} />
        </div>

        <section className="mt-7 border-t border-line pt-6">
          <h2 className="text-2xl font-semibold text-ink">Правовые основания документа</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6">
            {DIVORCE_PROPERTY_LEGAL_RULES.filter((rule) => rule.scenarios.includes(scenario.key)).map((rule) => (
              <li key={rule.id} className="border-l-2 border-line pl-3">
                <p className="font-medium text-ink">{rule.statement}</p>
                <p className="text-zinc-600">{rule.norm}. Статус: {legalReviewStatusLabel(rule.status)}.</p>
                <p className="text-zinc-600">Автоматизация: {legalAutomationLabel(rule.automation)}. {rule.fallbackBehavior}</p>
                <a href={rule.officialUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Официальный источник</a>
                {rule.supplementaryUrl ? <a href={rule.supplementaryUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Контрольная редакция</a> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Последняя документированная сверка: {getDivorcePropertyLegalReviewDate(scenario.key).split("-").reverse().join(".")}.
            {isDivorcePropertyLegalReviewFullyPrimaryVerified(scenario.key)
              ? " Все используемые источники в этом сценарии открыты на первичных официальных ресурсах."
              : " Часть первичных официальных страниц была недоступна; контрольная сверка и статус каждого правила зафиксированы отдельно."}
          </p>
        </section>

        <Link href={`${problemPath}?scenario=${scenario.key}`} className="mt-6 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
          Вернуться к порядку действий
        </Link>
      </article>
    </>
  );
}

function DocumentFact({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="border-t-4 border-zinc-300 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </section>
  );
}

function legalReviewStatusLabel(status: "verified-primary" | "primary-unavailable-supplementary-checked" | "manual-regional-check") {
  if (status === "verified-primary") return "первичный официальный источник проверен";
  if (status === "manual-regional-check") return "региональные сведения требуют ручной проверки";
  return "первичный источник временно недоступен, выполнена контрольная сверка";
}

function legalAutomationLabel(automation: "allowed" | "manual-only" | "not-applicable") {
  if (automation === "allowed") return "допустима только в пределах описанного правила";
  if (automation === "manual-only") return "требуется ручная проверка";
  return "не применяется";
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

function documentWebPageJsonLd(
  path: string,
  name = "Заявление в ЗАГС: формы и порядок заполнения",
  description = "Формы, документы, пошлины, льготы и порядок подготовки сведений для обращения в ЗАГС."
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path)
  };
}
