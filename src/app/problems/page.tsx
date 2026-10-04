import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Юридические ситуации — семейное право",
  description: "Семейные ситуации по браку, разводу, алиментам, детям, имуществу супругов, отцовству, усыновлению и опеке.",
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
            Выберите правовую тему и получите порядок действий, перечень документов, проверенные источники и подходящий результат.
          </p>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-ink">Семейное право</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link href="/problems/semeynoe-pravo/" className="rounded-lg border border-line bg-white p-5 shadow-sm hover:border-trust">
                <h3 className="text-lg font-semibold text-ink">Семейное право</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Брак и ЗАГС, развод, алименты, дети, имущество супругов, отцовство, родительские права, усыновление и опека.
                </p>
              </Link>
            </div>
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
      numberOfItems: 1,
      itemListElement: [{
          "@type": "ListItem",
          position: 1,
          name: "Семейное право",
          url: absoluteUrl("/problems/semeynoe-pravo/")
        }]
    }
  };
}
