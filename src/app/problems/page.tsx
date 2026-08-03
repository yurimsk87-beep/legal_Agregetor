import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { legalProblems } from "@/data/legal-problems";

export const metadata: Metadata = buildMetadata({
  title: "Юридические ситуации — семейные споры",
  description: "Маршруты по браку, ЗАГС, разводу и разделу имущества с документами, пошлинами и порядком действий.",
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
            Доступны эталонные маршруты по регистрации брака, обращениям в ЗАГС, разводу и разделу имущества.
          </p>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-ink">Семейные споры</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link href="/problems/semya-i-deti/" className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
                <h3 className="text-lg font-semibold text-ink">Семейные споры</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Брак и ЗАГС, развод через ЗАГС или суд, нотариальный и судебный раздел имущества.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Доступные ситуации</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {legalProblems.map((problem) => (
              <article key={problem.slug} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-ink">{problem.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{problem.shortAnswer}</p>
                <Link href={`/problems/${problem.categorySlug}/${problem.slug}/`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-trust hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                  Открыть разбор
                </Link>
              </article>
            ))}
          </div>
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
      numberOfItems: legalProblems.length,
      itemListElement: legalProblems.map((problem, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: problem.title,
          url: absoluteUrl(`/problems/${problem.categorySlug}/${problem.slug}/`)
        }))
    }
  };
}
