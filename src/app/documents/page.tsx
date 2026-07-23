import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { navigatorDocuments } from "@/data/documents";

const referenceDocument = navigatorDocuments[0];

export const metadata: Metadata = buildMetadata({
  title: "Юридические документы — заявление в ЗАГС",
  description: "Подготовьте данные для заявления в ЗАГС по официальным формам для четырёх предусмотренных процедур.",
  path: "/documents/",
  isIndexable: true
});

export default function DocumentsPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentsJsonLd()]} />
      <Breadcrumbs items={breadcrumbs} />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Документы</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Юридические документы</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
            Сейчас доступен один эталонный документ с четырьмя отдельными процедурами обращения в органы ЗАГС.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <article className="max-w-2xl rounded-lg border border-line bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-trust">{referenceDocument.category}</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{referenceDocument.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{referenceDocument.shortDescription}</p>
            <Link href="/documents/zayavlenie-v-zags/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              Открыть документ
            </Link>
          </article>
        </section>
      </main>
    </>
  );
}

function documentsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: 1,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: referenceDocument.title,
        url: absoluteUrl("/documents/zayavlenie-v-zags/")
      }
    ]
  };
}
