import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LegalReferencesBlock } from "@/components/legal/LegalReferencesBlock";
import { JudicialOrderDeadlineCalculator } from "@/components/tools/JudicialOrderDeadlineCalculator";
import { DutyLawyerWidget } from "@/components/qna/DutyLawyerWidget";
import { getLegalReferences } from "@/data/legal-references";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

const toolPath = "/tools/sudebnyy-prikaz-deadline/";

const faq = [
  {
    question: "С какого дня считать срок отмены судебного приказа?",
    answer: "Обычно десятидневный срок считают со дня получения копии судебного приказа, а не со дня его вынесения. Дату получения нужно подтвердить конвертом, уведомлением, трек-номером, материалами дела или иным документом."
  },
  {
    question: "Что делать, если письмо получил родственник?",
    answer: "Нужно проверить, кто расписался за получение, имел ли он доступ к корреспонденции и как суд оценит такое вручение. Если фактически вы не могли узнать о приказе, может понадобиться заявление о восстановлении срока."
  },
  {
    question: "Что делать, если приказ увидел только у приставов?",
    answer: "Запросите материалы исполнительного производства и судебного дела, узнайте дату направления и вручения приказа. Часто в такой ситуации подают возражения и одновременно просят восстановить срок."
  },
  {
    question: "Можно ли отменить приказ после 10 дней?",
    answer: "Да, но обычно нужно просить восстановить пропущенный процессуальный срок и подтвердить уважительные причины пропуска. Сам по себе пропуск срока не означает, что действовать уже нельзя."
  },
  {
    question: "Нужно ли объяснять причины несогласия с долгом?",
    answer: "Для отмены судебного приказа обычно достаточно письменных возражений относительно его исполнения. Подробный спор о долге чаще рассматривается уже в исковом порядке, если взыскатель обратится с иском."
  },
  {
    question: "Что делать, если последний день срока выпал на выходной?",
    answer: "По процессуальным правилам, если последний день срока приходится на нерабочий день, окончание срока переносится на следующий рабочий день. Этот калькулятор учитывает перенос с субботы и воскресенья; праздничные и официальные нерабочие дни нужно проверить отдельно по производственному календарю."
  },
  {
    question: "Можно ли отправить возражение почтой в последний день?",
    answer: "Да, процессуальное действие можно совершить до 24:00 последнего дня срока. Для почты важно сохранить квитанцию, трек-номер и, по возможности, опись вложения."
  }
];

const legalReferences = getLegalReferences(["gpk_128", "gpk_129", "gpk_108", "gpk_112"]);

export const metadata: Metadata = buildMetadata({
  title: "Калькулятор срока отмены судебного приказа — проверьте 10 дней для возражения",
  description:
    "Укажите дату получения судебного приказа — калькулятор подскажет ориентировочную дату подачи возражения, сроки, риски и следующие шаги с правовыми основаниями по ГПК РФ.",
  path: toolPath,
  isIndexable: true
});

export default function JudicialOrderDeadlineToolPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Инструменты", path: "/tools/" },
    { name: "Калькулятор срока отмены судебного приказа", path: toolPath }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), webPageJsonLd(), faqPageJsonLd()]} />
      <Breadcrumbs items={breadcrumbs} />

      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-trust">Инструмент</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">Калькулятор срока отмены судебного приказа</h1>
              <p className="mt-5 text-lg leading-8 text-zinc-700">
                Укажите дату получения копии судебного приказа. Калькулятор ориентировочно покажет последний день подачи возражений, риски пропуска и следующий безопасный шаг.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="#calculator" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
                  Рассчитать срок
                </Link>
                <Link href="/questions/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
                  Задать вопрос юристу
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Расчет предварительный: проверьте дату фактического получения приказа и документы о вручении. Калькулятор не заменяет консультацию юриста и не учитывает праздничные или официальные нерабочие дни.
          </div>
        </section>

        <div id="calculator" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <JudicialOrderDeadlineCalculator />
        </div>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LegalReferencesBlock
            references={legalReferences}
            title="Правовая основа расчета"
            description="Эти нормы используются для базовой логики калькулятора: дата получения приказа, срок возражений, восстановление срока и правило последнего дня."
          />
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-ink">Что делать после расчёта</h2>
            <ol className="mt-5 grid gap-3">
              {[
                "Сохраните подтверждение даты получения приказа.",
                "Подготовьте письменные возражения в суд, вынесший приказ.",
                "Если срок пропущен, приложите заявление о восстановлении срока и доказательства уважительных причин.",
                "Отправьте документы так, чтобы осталось подтверждение подачи или отправки.",
                "Если уже работают приставы, проверьте исполнительное производство и основания списаний."
              ].map((item, index) => (
                <li key={item} className="flex min-w-0 gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">{index + 1}</span>
                  <span className="min-w-0 text-sm leading-6 text-zinc-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold text-ink">Нужна проверка расчёта?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Опишите дату получения и текущий статус дела в вопросе юристу.</p>
            <Link href="/questions/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Перейти к вопросам
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-ink">FAQ</h2>
          <div className="mt-6 grid gap-3">
            {faq.map((item) => (
              <details key={item.question} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-lg font-semibold text-ink">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-ink">
          <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold">Не уверены, успеваете ли отменить приказ?</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-200">
              Проверьте дату получения, подготовьте возражение или задайте вопрос юристу. Если срок пропущен, не затягивайте с восстановлением срока.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-zinc-100">
                Задать вопрос юристу
              </Link>
              <Link href="/lawyers/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                Посмотреть юристов
              </Link>
            </div>
          </div>
        </section>
        <DutyLawyerWidget source="tool-sudebnyy-prikaz" compact />
      </main>
    </>
  );
}

function webPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Калькулятор срока отмены судебного приказа",
    description: metadata.description,
    url: absoluteUrl(toolPath)
  };
}

function faqPageJsonLd() {
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
