import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "О проекте — юридический навигатор для граждан",
  description:
    "ПравоПоиск помогает определить юридическую ситуацию, увидеть сроки и риски, подготовить документы и подключить юриста, если без него нельзя.",
  path: "/about/",
  isIndexable: true
});

const steps = [
  "Выберите ситуацию в правовом навигаторе или пройдите диагностику.",
  "Посмотрите краткий ответ, сроки, риски и первые действия.",
  "Откройте инструкцию и подготовьте подходящий документ.",
  "Используйте генератор, если для документа есть онлайн-шаблон.",
  "Задайте вопрос или подключите юриста, если ситуация сложная."
];

export default function AboutPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "О проекте", path: "/about/" }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">О проекте</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">Юридический навигатор для граждан</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">
            Определим вашу ситуацию, покажем сроки и риски, подготовим документы и подключим юриста, если без него нельзя.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/problems/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              Смотреть ситуации
            </Link>
            <Link href="/problems/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Правовой навигатор
            </Link>
            <Link href="/documents/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Документы
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Как работает сервис</h2>
          <ol className="mt-5 grid gap-3 text-sm leading-6 text-zinc-700">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-trust text-sm font-semibold text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-lg border border-line bg-zinc-50 p-5">
          <h2 className="text-2xl font-semibold text-ink">Что важно знать</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
            <p>Материалы сайта помогают сориентироваться и выбрать первый шаг, но не заменяют индивидуальную юридическую консультацию.</p>
            <p>Генераторы документов создают шаблоны. Перед подачей нужно проверить реквизиты, сроки, факты, суммы и приложения.</p>
            <p>Если есть суд, исполнительное производство, риск пропуска срока, уголовный риск или крупная сумма спора, лучше обратиться к юристу.</p>
          </div>
        </section>
      </main>
    </>
  );
}
