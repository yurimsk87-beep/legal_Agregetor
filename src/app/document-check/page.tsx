import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileCheck2, FileText, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentCheckWizard } from "@/components/document-check/DocumentCheckWizard";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, legalServiceJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import type { FaqItem } from "@/lib/types";

const title = "Проверка юридического документа онлайн — разбор и помощь юриста";
const description =
  "Загрузите юридический документ на ПравоПоиск: сервис поможет понять содержание, проверить сроки и риски, сформировать ответ или отправить документ юристу на проверку.";

const breadcrumbs = [
  { name: "Главная", path: "/" },
  { name: "Проверка документа", path: "/document-check/" }
];

const supportedDocuments = [
  "Судебный приказ",
  "Постановление пристава",
  "Исполнительный лист",
  "Претензия",
  "Ответ на претензию",
  "Жалоба",
  "Заявление в суд",
  "Договор",
  "Уведомление от работодателя",
  "Документ по алиментам"
];

const faqItems: FaqItem[] = [
  {
    id: "document-check-supported-documents",
    entityType: "GENERAL",
    entityId: "document-check",
    sortOrder: 1,
    question: "Какие документы можно загрузить?",
    answer: "На первом этапе можно загрузить PDF, DOC, DOCX, JPG и PNG: судебный приказ, постановление пристава, договор, претензию, жалобу, заявление и другие юридические документы."
  },
  {
    id: "document-check-lawyer-consultation",
    entityType: "GENERAL",
    entityId: "document-check",
    sortOrder: 2,
    question: "Заменяет ли автоматический разбор консультацию юриста?",
    answer: "Нет. Автоматический разбор помогает понять содержание документа и возможные следующие шаги, но для точной оценки сроков, рисков и перспектив лучше обратиться к юристу."
  },
  {
    id: "document-check-send-lawyer",
    entityType: "GENERAL",
    entityId: "document-check",
    sortOrder: 3,
    question: "Можно ли отправить документ юристу на проверку?",
    answer: "Да. После автоматического разбора можно указать, что именно нужно проверить, оставить контакт и подтвердить согласие на обработку персональных данных."
  },
  {
    id: "document-check-file-formats",
    entityType: "GENERAL",
    entityId: "document-check",
    sortOrder: 4,
    question: "Какие форматы файлов поддерживаются?",
    answer: "Поддерживаются PDF, DOC, DOCX, JPG и PNG. На странице загрузки также действует ограничение размера файла."
  },
  {
    id: "document-check-deadline",
    entityType: "GENERAL",
    entityId: "document-check",
    sortOrder: 5,
    question: "Что делать, если в документе указан срок?",
    answer: "Проверьте дату документа и дату фактического получения. Если срок уже идёт или спорный, лучше спросить юриста о сроках перед отправкой ответа."
  },
  {
    id: "document-check-cabinet",
    entityType: "GENERAL",
    entityId: "document-check",
    sortOrder: 6,
    question: "Сохраняется ли документ в личном кабинете?",
    answer: "Если пользователь авторизован, сервисный сценарий должен позволять вернуться к разбору и статусу проверки. Если пользователь не авторизован, ему предлагается войти и сохранить документ в кабинете."
  }
];

export function generateMetadata(): Metadata {
  return buildMetadata({
    title,
    description,
    path: "/document-check/",
    isIndexable: true
  });
}

export default function DocumentCheckPage() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentCheckJsonLd(), faqJsonLd(faqItems)]} />
      <Breadcrumbs items={breadcrumbs} />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-trust">Разбор документа онлайн</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Проверьте юридический документ перед отправкой или ответом
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
              Загрузите документ — мы объясним простыми словами, что это значит, какие сроки и риски нужно проверить, и при необходимости передадим его юристу.
            </p>
            <div className="mt-6 grid gap-3 text-sm leading-6 text-zinc-700">
              {[
                "Понять, что за документ вы получили.",
                "Проверить сроки, риски, сумму, номер дела или производства.",
                "Подобрать ответ, жалобу, заявление или другой юридический документ.",
                "Отправить документ юристу перед подачей или ответом."
              ].map((item) => (
                <p key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </div>

          <DocumentCheckWizard />
        </div>
      </section>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-trust">Что поддерживается</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Документы для первого этапа</h2>
              <p className="mt-3 text-base leading-7 text-zinc-600">
                Сервис рассчитан на массовые юридические документы: судебный приказ, постановление пристава, договор, претензию, жалобу и документы по алиментам. Если тип не определится, вы увидите запасной сценарий и сможете отправить документ юристу.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {supportedDocuments.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 shadow-sm">
                  <FileText className="h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
                  <span className="text-sm font-semibold text-ink">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-zinc-50">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              {
                icon: FileCheck2,
                title: "Документ пользователя",
                text: "Загрузите файл или опишите документ словами. Разбор начинается с типа документа, отправителя и цели."
              },
              {
                icon: AlertTriangle,
                title: "Сроки и риски",
                text: "Сервис показывает, какие даты, суммы, номера и требования стоит проверить до ответа или подачи."
              },
              {
                icon: ShieldCheck,
                title: "Проверка юристом",
                text: "Если срок спорный, деньги списали или документ непонятен, можно отправить его юристу на проверку."
              }
            ].map(({ icon: Icon, title: cardTitle, text }) => (
              <article key={cardTitle} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <Icon className="h-6 w-6 text-trust" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-ink">{cardTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-trust">Юридическая консультация по документу</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Когда лучше показать документ юристу</h2>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  Проверка юридического документа особенно важна, если в нём указан срок, деньги уже списали, скоро суд, документ связан с приставами, работодателем, договором или вы собираетесь отправлять ответ от своего имени.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
                  Отправить документ юристу
                </Link>
                <Link href="/documents/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
                  Сформировать ответ
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              Автоматический разбор помогает понять содержание документа и возможные следующие шаги, но не является индивидуальной юридической консультацией. Для точной оценки сроков, рисков и перспектив рекомендуется обратиться к юристу.
            </div>
            <div className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-zinc-600">
              Юрист проверяет документ на основании предоставленных вами данных. Результат проверки зависит от содержания документа, сроков и обстоятельств ситуации.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Вопросы о проверке документа</h2>
          <div className="mt-5 grid gap-3">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-lg border border-line bg-white px-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="text-trust transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 text-sm leading-6 text-zinc-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function documentCheckJsonLd() {
  return legalServiceJsonLd({
    path: "/document-check/",
    name: "Проверка юридического документа онлайн",
    description
  }) ?? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: absoluteUrl("/document-check/")
  };
}
