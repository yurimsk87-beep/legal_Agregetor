import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LaborDocumentGenerator } from "@/components/labor/LaborDocumentGenerator";
import type { LaborDocumentScenario } from "@/data/labor-documents";
import { getLaborRulesForArea } from "@/data/labor-legal-sources";
import { LABOR_CATEGORY_SLUG } from "@/data/labor-routes";
import type { NavigatorDocument } from "@/data/documents";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export function LaborDocumentPage({ document, selected }: { document: NavigatorDocument; selected: LaborDocumentScenario }) {
  const path = `/documents/${document.slug}/`;
  const problemPath = `/problems/${LABOR_CATEGORY_SLUG}/${selected.route.slug}/`;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" },
    { name: document.title, path }
  ];

  return <>
    <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
    <Breadcrumbs items={breadcrumbs} />
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-7">
        <p className="text-sm font-semibold uppercase text-trust">Трудовое право</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">{document.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-700">{document.heroDescription}</p>
        <a href="#fill-online" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-trust/30">Подготовить документ</a>
      </header>

      <section className="mt-7 grid gap-6 border-b border-line pb-7 md:grid-cols-2">
        <FactBlock title="Когда подходит" items={document.whenToUse} />
        <FactBlock title="Что подготовить" items={document.whatToPrepare} />
        <FactBlock title="Куда обращаться" items={[document.whereToSubmit]} />
        <FactBlock title="Срок и расходы" items={document.deadlinesAndFees.length ? document.deadlinesAndFees : document.deadlines} />
      </section>

      <LaborDocumentGenerator document={document} selected={selected} rules={getLaborRulesForArea(selected.route.areaId)} />

      <Link href={`${problemPath}?scenario=${selected.scenario.key}`} className="mt-8 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Вернуться к порядку действий</Link>
    </article>
  </>;
}

function FactBlock({ title, items }: { title: string; items: string[] }) {
  return <section className="border-t-4 border-zinc-300 pt-4"><h2 className="text-xl font-semibold text-ink">{title}</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{items.map((item) => <li key={item}>- {item}</li>)}</ul></section>;
}
