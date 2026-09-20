import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentsCatalog } from "@/components/documents/DocumentsCatalog";
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
            Найдите нужный документ по названию или жизненной ситуации. ПравоПоиск поможет заполнить данные и подготовить заявление, иск, соглашение или другой документ. Если требуется официальная форма — покажем, где её получить и как заполнить.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <DocumentsCatalog documents={navigatorDocuments} />
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
