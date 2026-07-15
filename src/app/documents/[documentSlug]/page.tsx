import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { LegalReferencesBlock } from "@/components/legal/LegalReferencesBlock";
import { RelatedLawyersBlock, RelatedQuestionsBlock, SectionHeading } from "@/components/navigator/NavigatorBlocks";
import { DutyLawyerWidget } from "@/components/qna/DutyLawyerWidget";
import {
  getDocumentH1,
  getDocumentInstructionCtaLabel,
  getDocumentMetaDescription,
  getDocumentOnlineFillCtaLabel,
  getDocumentPageTitle
} from "@/lib/document-seo";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { getRelatedLawyersBySpecializations, getRelatedQuestionsForContext } from "@/lib/navigator-relations";
import { buildDocumentQuestionContext, PROBLEM_EXCLUDED_TOPICS } from "@/data/related-questions-context";
import { DocumentGeneratorSection } from "@/components/documents/DocumentGeneratorSection";
import { getDocumentTemplate } from "@/data/document-templates";
import { getLegalReferences } from "@/data/legal-references";
import { getNavigatorDocument, navigatorDocuments } from "@/data/documents";
import type { NavigatorDocument } from "@/data/documents";
import type { LegalProblem } from "@/data/legal-problems";
import { legalProblems } from "@/data/legal-problems";
import type { NavigatorTool } from "@/data/tools";
import { navigatorTools } from "@/data/tools";

type PageProps = { params: Promise<{ documentSlug: string }> };
type DocumentFaq = { question: string; answer: string };

const DOCUMENT_SLUG_ALIASES: Record<string, string> = {
  "pretenziya-v-upravlyayushchuyu-kompaniyu": "pretenziya-v-upravlyayuschuyu-kompaniyu"
};

const WHEN_TO_USE_FALLBACK = [
  "Этот документ используют, когда нужно письменно зафиксировать требование, обращение, возражение или жалобу и получить подтверждение подачи."
];

const PREPARATION_FALLBACK = [
  "паспортные или контактные данные заявителя;",
  "данные второй стороны или организации;",
  "даты событий;",
  "суммы, если есть денежный спор;",
  "договоры, чеки, переписку и уведомления;",
  "доказательства подачи предыдущих обращений;",
  "реквизиты суда или госоргана, если документ подается туда."
];

const FILL_STEPS_FALLBACK = [
  "Укажите свои данные.",
  "Укажите адресата.",
  "Опишите ситуацию по датам.",
  "Сформулируйте требование.",
  "Перечислите приложения.",
  "Поставьте дату и подпись.",
  "Сохраните копию документа."
];

const SUBMISSION_OPTIONS = [
  "лично через канцелярию или приемную;",
  "почтой заказным письмом с описью вложения;",
  "через электронную приемную, если она есть у адресата;",
  "через суд, ГАС или Мой арбитр, если документ связан с судебным делом;",
  "через Госуслуги, если для этого документа доступна электронная подача;",
  "через представителя по доверенности."
];

const SUBMISSION_FALLBACK =
  "Способ подачи зависит от адресата. Важно сохранить подтверждение: отметку о принятии, почтовую квитанцию, трек-номер, электронное уведомление или расписку.";

const DEADLINES_FALLBACK =
  "Срок рассмотрения зависит от типа документа и адресата. Если ответа нет или он отрицательный, следующим шагом может быть жалоба, повторное обращение или обращение в суд.";

const AFTER_SUBMISSION_STEPS = [
  "Сохраните подтверждение подачи и копию документа.",
  "Отслеживайте входящий номер, трек-номер или уведомление в личном кабинете.",
  "Если ответа нет в установленный срок, направьте повторное обращение или жалобу.",
  "Если пришел отказ, проверьте срок и порядок обжалования."
];

const UNIVERSAL_MISTAKES = [
  "подать документ без подтверждения;",
  "не указать даты и суммы;",
  "не приложить доказательства;",
  "описывать эмоции вместо фактов;",
  "не сформулировать конкретное требование;",
  "пропустить срок;",
  "отправить документ не тому адресату;",
  "не сохранить копию."
];

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return navigatorDocuments.map((document) => ({ documentSlug: document.slug }));
}

// Индексируем только содержательные карточки документов. «Бедные» документы-заглушки
// (страница состоит из шаблонного fallback-текста, без генератора, правовых оснований,
// FAQ и собственного SEO) закрываем от индексации.
function isIndexableDocumentPage(document: NavigatorDocument | null): boolean {
  if (!document) return false;
  return (
    Boolean(document.templateSlug) ||
    document.legalReferenceKeys.length > 0 ||
    document.legalBasis.length > 0 ||
    document.faq.length >= 2 ||
    Boolean(document.seoTitle)
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { documentSlug } = await params;
  const document = getDocumentByParam(documentSlug);

  return buildMetadata({
    title: document ? getDocumentPageTitle(document) : "Документ не найден",
    description: document ? getDocumentMetaDescription(document) : "Документ не найден.",
    path: document ? `/documents/${document.slug}/` : `/documents/${documentSlug}/`,
    isIndexable: isIndexableDocumentPage(document)
  });
}

export default async function DocumentPage({ params }: PageProps) {
  const { documentSlug } = await params;
  const document = getDocumentByParam(documentSlug);
  if (!document) notFound();

  const relatedProblems = legalProblems.filter((problem) => document.relatedProblemSlugs.includes(problem.slug));
  const relatedSpecializations = new Set(relatedProblems.flatMap((problem) => problem.relatedLawyerSpecializations));
  const documentQuestionContext = buildDocumentQuestionContext({
    documentSlug: document.slug,
    relatedPrimaryTags: [...new Set(relatedProblems.flatMap((problem) => problem.relatedQuestionTopics))],
    relatedExcludedTopics: [...new Set(relatedProblems.flatMap((problem) => PROBLEM_EXCLUDED_TOPICS[problem.slug] ?? []))]
  });
  const documentTemplate = document.templateSlug ? getDocumentTemplate(document.templateSlug) : null;
  const [relatedQuestions, relatedLawyers] = await Promise.all([
    getRelatedQuestionsForContext(documentQuestionContext, { limit: 12 }),
    getRelatedLawyersBySpecializations(relatedSpecializations)
  ]);
  const faq = buildDocumentFaq(document);
  const legalReferences = getLegalReferences(document.legalReferenceKeys);
  const documentPath = `/documents/${document.slug}/`;
  const primaryProblem = relatedProblems[0];
  const primaryProblemHref = primaryProblem ? `/problems/${primaryProblem.categorySlug}/${primaryProblem.slug}/` : "/problems/";
  const checkHref = primaryProblemHref;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" },
    { name: document.title, path: documentPath }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentWebPageJsonLd(document), documentArticleJsonLd(document), faqPageJsonLd(faq)]} />
      <Breadcrumbs items={breadcrumbs} />
      <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <DocumentHero document={document} />

        <DocumentFactCards document={document} />

        {documentTemplate ? (
          <div className="mt-8">
            <DocumentGeneratorSection template={documentTemplate} instructionHref={primaryProblemHref} />
          </div>
        ) : null}

        {legalReferences.length ? (
          <div className="mt-8">
            <LegalReferencesBlock
              references={legalReferences}
              description="Нормы, на которые опирается документ. Перед подачей сверьте их с обстоятельствами конкретного дела."
            />
          </div>
        ) : null}

        <DocumentMistakesCards mistakes={document.commonMistakes.length ? document.commonMistakes : document.mistakes} />

        <FaqBlock faq={faq} />
      </article>

      {relatedQuestions.length ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Вопросы по заполнению и подаче документа"
            description="Ответы на частые вопросы о том, как подготовить, подать и использовать этот документ."
          />
          <div className="mt-6">
            <RelatedQuestionsBlock questions={relatedQuestions} />
          </div>
        </section>
      ) : null}

      {relatedLawyers.length ? (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionHeading
              title="Юристы, которые могут проверить документ"
              description="Специалисты подобраны по связанным ситуациям и специализациям."
            />
            <div className="mt-6">
              <RelatedLawyersBlock lawyers={relatedLawyers} />
            </div>
          </div>
        </section>
      ) : null}

      <DocumentFinalCta checkHref={checkHref} documentPath={documentPath} problemHref={primaryProblemHref} />
      <DutyLawyerWidget source="document" />
    </>
  );
}

function DocumentHero({ document }: { document: NavigatorDocument }) {
  // Генератор встроен в эту же страницу — кнопка ведёт якорем к форме ниже.
  const generatorHref = document.templateSlug ? "#fill-online" : null;

  return (
    <header className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">{document.documentType || document.category}</p>
      <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{getDocumentH1(document)}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{document.heroDescription || document.description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {generatorHref ? (
          <Link href={generatorHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
            Заполнить онлайн
          </Link>
        ) : (
          <QuestionCtaLink sourcePage={`/documents/${document.slug}/`} label="Задать вопрос юристу" />
        )}
      </div>
    </header>
  );
}

// Четыре компактные карточки фактов на первом экране: когда используется, срок,
// куда подавать, какие документы приложить. Пустые карточки скрываются.
function DocumentFactCards({ document }: { document: NavigatorDocument }) {
  const submitLines = document.filingProcedure.length ? document.filingProcedure : document.howToSubmit;
  const whereAndHow = [document.whereToSubmit || document.whereToFile, ...submitLines].filter(Boolean) as string[];
  const cards = [
    { title: "Когда используется", items: document.whenToUse },
    { title: "Срок подачи", items: document.deadlines },
    { title: "Куда и как подать", items: whereAndHow },
    { title: "Какие документы приложить", items: document.documentsToAttach }
  ].filter((card) => card.items.length);

  if (!cards.length) return null;

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <article key={card.title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">{card.title}</h2>
          <ul className="mt-3 grid gap-2">
            {card.items.slice(0, 6).map((item) => (
              <li key={item} className="flex min-w-0 gap-2 text-sm leading-6 text-zinc-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-trust" aria-hidden="true" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

// Частые ошибки: аккуратные карточки с меткой-крестиком (5-6 штук).
function DocumentMistakesCards({ mistakes }: { mistakes: string[] }) {
  const items = uniqueItems(mistakes.length ? mistakes : UNIVERSAL_MISTAKES).slice(0, 6);
  if (!items.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-ink">Частые ошибки</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 shadow-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
            <p className="text-sm leading-6 text-zinc-700">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DocumentPreparationBlock({ items }: { items: string[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Что подготовить перед заполнением</h2>
      <TextList items={items.length ? items : PREPARATION_FALLBACK} />
    </section>
  );
}

function DocumentOptionalListBlock({ items, title }: { items: string[]; title: string }) {
  if (!items.length) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <TextList items={items} />
    </section>
  );
}

function DocumentCostsBlock({ costs }: { costs: string[] }) {
  if (!costs.length) return null;

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Госпошлина и расходы</h2>
      <TextList items={costs} />
    </section>
  );
}

// Объединённый блок «образец, заполнение и подача»: короткое вступление с
// SEO-ключами (образец/бланк), шаги заполнения и чек-лист перед подачей —
// вместо двух прежних блоков с четырьмя повторяющимися карточками.
function DocumentHowToBlock({ document }: { document: NavigatorDocument }) {
  const steps = document.howToFill.length ? document.howToFill : FILL_STEPS_FALLBACK;

  return (
    <section id="how-to-fill" className="mt-8 scroll-mt-24 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Образец, бланк и заполнение</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Как составить и подать документ</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Отдельный обязательный бланк не требуется — используйте образец как черновик: укажите адресата и свои данные, опишите события по датам и сформулируйте конкретное требование.
          {document.templateSlug ? " Готовый текст можно сформировать онлайн в форме выше." : ""}
        </p>
      </div>
      <ol className="mt-5 grid gap-3">
        {steps.map((item, index) => (
          <li key={`${index}-${item}`} className="flex min-w-0 gap-4 rounded-lg border border-line bg-zinc-50 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
            <p className="min-w-0 leading-7 text-zinc-700">{item}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Перед подачей проверьте</p>
        <p className="mt-1">
          Срок подачи, адресата, номера дел и документов, доказательства и копии приложений. Если спор сложный, срок пропущен или цена ошибки высока — покажите документ юристу.
        </p>
      </div>
    </section>
  );
}

function DocumentSubmissionBlock({ howToSubmit, whereToSubmit }: { howToSubmit: string[]; whereToSubmit: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Куда подавать документ</h2>
      <p className="mt-3 text-base leading-7 text-zinc-700">{whereToSubmit || SUBMISSION_FALLBACK}</p>
      <h3 className="mt-5 font-semibold text-ink">Как подать документ</h3>
      <TextList items={howToSubmit.length ? howToSubmit : SUBMISSION_OPTIONS} />
    </section>
  );
}

function DocumentDeadlinesBlock({ afterFiling, deadlines }: { afterFiling: string[]; deadlines: string[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Сроки и что будет после подачи</h2>
      <TextList items={deadlines.length ? deadlines : [DEADLINES_FALLBACK]} />
      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
        <h3 className="font-semibold text-ink">Что происходит после подачи</h3>
        <TextList items={afterFiling.length ? afterFiling : AFTER_SUBMISSION_STEPS} />
      </div>
    </section>
  );
}

function DocumentMistakesBlock({ includeUniversal, mistakes }: { includeUniversal: boolean; mistakes: string[] }) {
  const items = includeUniversal ? uniqueItems([...mistakes, ...UNIVERSAL_MISTAKES]) : uniqueItems(mistakes);

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Частые ошибки</h2>
      <TextList items={items} />
    </section>
  );
}

function DocumentToolsBlock({ tools }: { tools: NavigatorTool[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Проверить срок перед подготовкой документа</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">Если документ связан со сроком подачи, сначала проверьте ориентировочную дату и риски пропуска.</p>
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

function FaqBlock({ faq }: { faq: DocumentFaq[] }) {
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

function DocumentRelatedDocumentsBlock({ documents }: { documents: NavigatorDocument["relatedDocuments"] }) {
  if (!documents.length) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Похожие документы</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {documents.map((document) =>
          document.slug ? (
            <Link
              key={`${document.slug}-${document.title}`}
              href={`/documents/${document.slug}/`}
              className="rounded-lg border border-line bg-zinc-50 p-4 text-sm font-semibold text-ink hover:border-trust"
            >
              {document.title}
            </Link>
          ) : (
            <article key={document.title} className="rounded-lg border border-line bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
              {document.title}
            </article>
          )
        )}
      </div>
    </section>
  );
}

function DocumentFinalCta({ checkHref, documentPath, problemHref }: { checkHref: string; documentPath: string; problemHref: string }) {
  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold">Не уверены, что документ составлен правильно?</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-200">
          Опишите ситуацию — мы подскажем, какой документ нужен, какие сроки проверить и стоит ли показать текст юристу перед подачей.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={checkHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-zinc-100">
            Проверить ситуацию
          </Link>
          <QuestionCtaLink sourcePage={documentPath} label="Получить первичную консультацию" variant="secondary" />
          <Link href={problemHref} className="inline-flex min-h-11 max-w-full min-w-0 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            Открыть инструкцию
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

function buildDocumentFaq(document: NavigatorDocument): DocumentFaq[] {
  if (document.faq.length) return document.faq;

  return [
    {
      question: `Где скачать образец: ${document.title}?`,
      answer: "На этой странице можно использовать готовый образец и перейти к онлайн-заполнению, если для документа доступна форма. Перед подачей проверьте адресата, срок, факты и приложения."
    },
    {
      question: `Как правильно составить документ: ${document.title}?`,
      answer: "Опишите события по датам, укажите документы и номера дел, сформулируйте конкретное требование и приложите доказательства."
    },
    {
      question: "Можно ли использовать этот образец без юриста?",
      answer: "Если есть спор о сроках, сумме, доказательствах или последствиях подачи, документ лучше проверить до отправки."
    },
    {
      question: `Куда подавать документ: ${document.title}?`,
      answer: "Порядок подачи зависит от ситуации и адресата. Проверьте, кому направляется документ: другой стороне, должностному лицу, ведомству или в суд."
    }
  ];
}

function documentWebPageJsonLd(document: NavigatorDocument) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: getDocumentH1(document),
    description: getDocumentMetaDescription(document),
    url: absoluteUrl(`/documents/${document.slug}/`)
  };
}

function documentArticleJsonLd(document: NavigatorDocument) {
  if (!document.lastReviewedAt && !document.seoDescription) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: document.title,
    description: getDocumentMetaDescription(document),
    dateModified: document.lastReviewedAt,
    mainEntityOfPage: absoluteUrl(`/documents/${document.slug}/`)
  };
}

function faqPageJsonLd(faq: DocumentFaq[]) {
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

function getDocumentByParam(slug: string) {
  return getNavigatorDocument(DOCUMENT_SLUG_ALIASES[slug] ?? slug);
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
