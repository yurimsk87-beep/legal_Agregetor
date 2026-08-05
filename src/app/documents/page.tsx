import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { navigatorDocuments } from "@/data/documents";

export const metadata: Metadata = buildMetadata({
  title: "Юридические документы: ЗАГС, развод и имущество",
  description: "Подготовьте заявления ЗАГС, судебные иски и проект соглашения о разделе имущества по проверенным правилам.",
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
            Выберите документ. Для официальных форм ЗАГС подготовим сведения, для исков и проекта соглашения — редактируемый документ и DOCX.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {navigatorDocuments.map((document) => (
              <article key={document.slug} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-trust">{document.category}</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">{document.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{document.shortDescription}</p>
                <Link href={`/documents/${document.slug}/`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                  Открыть документ
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function documentsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: navigatorDocuments.length,
    itemListElement: navigatorDocuments.map((document, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: document.title,
        url: absoluteUrl(`/documents/${document.slug}/`)
      }))
  };
}
