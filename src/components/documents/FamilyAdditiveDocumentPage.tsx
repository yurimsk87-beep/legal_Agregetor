import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FamilyAdditiveDocumentHelper } from "@/components/documents/FamilyAdditiveDocumentHelper";
import { JsonLd } from "@/components/JsonLd";
import type { FamilyAdditiveRoute, FamilyAdditiveScenario } from "@/data/family-additive-routes";
import type { NavigatorDocument } from "@/data/documents";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/seo";

export function FamilyAdditiveDocumentPage({ document, route, scenario }: { document: NavigatorDocument; route: FamilyAdditiveRoute; scenario: FamilyAdditiveScenario }) {
  const documentPath = `/documents/${document.slug}/`;
  const problemPath = `/problems/semeynoe-pravo/${route.problemSlug}/?scenario=${scenario.key}`;
  const breadcrumbs = [{ name: "Главная", path: "/" }, { name: "Документы", path: "/documents/" }, { name: document.title, path: documentPath }];
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: document.title, description: document.shortDescription, url: absoluteUrl(documentPath) };
  return <>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs), jsonLd]} />
    <Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7">
        <p className="text-sm font-semibold uppercase text-trust">{document.documentType}</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{document.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{document.heroDescription}</p>
        <a href="#fill-online" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Подготовить документ</a>
      </header>
      <section className="mt-7 grid gap-4 md:grid-cols-2">
        <Fact title="Когда подходит" items={scenario.description} />
        <Fact title="Что подготовить" items={scenario.documents} />
        <Fact title="Куда обращаться" items={[scenario.filing]} />
        <Fact title="Срок и расходы" items={[scenario.term, scenario.fee]} />
      </section>
      <div className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{scenario.warning}</div>
      <div className="mt-7"><FamilyAdditiveDocumentHelper routeSlug={route.problemSlug} scenarioKey={scenario.key} /></div>
      <Link href={problemPath} className="mt-6 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Вернуться к порядку действий</Link>
    </article>
  </>;
}

function Fact({ items, title }: { items: string[]; title: string }) {
  return <section className="border-t-4 border-zinc-300 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-ink">{title}</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{items.map((item) => <li key={item}>- {item}</li>)}</ul></section>;
}
