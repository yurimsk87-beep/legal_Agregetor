import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { legalProblems } from "@/data/legal-problems";

const referenceProblem = legalProblems[0];

export const metadata: Metadata = buildMetadata({
  title: "Юридические ситуации — Брак и ЗАГС",
  description: "Эталонный правовой маршрут по заключению брака, перемене имени, повторным документам и исправлению записей ЗАГС.",
  path: "/problems/",
  isIndexable: true
});

export default function ProblemsPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Юридические ситуации", path: "/problems/" }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), collectionJsonLd()]} />
      <Breadcrumbs items={breadcrumbs} />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Правовой навигатор</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Юридические ситуации</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
            Сейчас в навигаторе доступен эталонный маршрут по регистрации брака и обращениям в органы ЗАГС.
          </p>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-ink">Семейные споры</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link href="/problems/semya-i-deti/" className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
                <h3 className="text-lg font-semibold text-ink">Брак и ЗАГС</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Заключение брака, перемена имени, повторные свидетельства и исправление записей актов гражданского состояния.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Доступная ситуация</h2>
          <article className="mt-6 max-w-2xl rounded-lg border border-line bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-ink">{referenceProblem.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{referenceProblem.shortAnswer}</p>
            <Link href="/problems/semya-i-deti/brak-zags-i-smena-familii/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-trust hover:text-ink">
              Открыть разбор
            </Link>
          </article>
        </section>
      </main>
    </>
  );
}

function collectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Юридические ситуации",
    url: absoluteUrl("/problems/"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: referenceProblem.title,
          url: absoluteUrl("/problems/semya-i-deti/brak-zags-i-smena-familii/")
        }
      ]
    }
  };
}
