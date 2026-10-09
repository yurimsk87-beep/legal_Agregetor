import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LaborDocumentGenerator } from "@/components/labor/LaborDocumentGenerator";
import type { LaborDocumentScenario } from "@/data/labor-documents";
import { getLaborRulesByIds, getLaborRulesForArea } from "@/data/labor-legal-sources";
import { LABOR_CATEGORY_SLUG } from "@/data/labor-routes";
import type { NavigatorDocument } from "@/data/documents";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/seo";

export function LaborDocumentPage({ document, selected }: { document: NavigatorDocument; selected: LaborDocumentScenario }) {
  const path = `/documents/${document.slug}/`;
  const problemPath = `/problems/${LABOR_CATEGORY_SLUG}/${selected.route.slug}/`;
  const rules = getLaborRulesForArea(selected.route.areaId);
  const visibleRules = selected.scenario.legalRuleIds?.length
    ? getLaborRulesByIds(selected.scenario.legalRuleIds)
    : rules;
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Документы", path: "/documents/" },
    { name: document.title, path }
  ];

  return <>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs), documentWebPageJsonLd(path, document)]} />
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

      <section className="mt-8 grid gap-7 md:grid-cols-2" aria-label="Содержание и приложения">
        <FactBlock title="Что войдет в иск" items={document.whatToInclude} />
        <FactBlock title="Какие доказательства приложить" items={document.documentsToAttach} />
      </section>

      <section className="mt-10 border-t border-line pt-7">
        <h2 className="text-2xl font-semibold text-ink">Проверенные правовые основания</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">Нормы помогают проверить срок, подсудность и возможные требования. Их применение зависит от документов и обстоятельств увольнения.</p>
        <div className="mt-5 grid gap-5">{visibleRules.map((rule) => <article key={rule.id} className="border-l-2 border-line pl-4"><h3 className="font-semibold text-ink">{rule.act}, {rule.provisions.join(", ")}</h3><p className="mt-1 text-sm leading-6 text-zinc-700">{rule.statement}</p><p className="mt-1 text-xs leading-5 text-zinc-500">Граница применения: {rule.limitations}</p><a href={rule.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Официальный источник</a></article>)}</div>
        {document.lastReviewedAt ? <p className="mt-4 text-xs leading-5 text-zinc-500">Последняя правовая сверка: {formatDate(document.lastReviewedAt)}.</p> : null}
      </section>

      <LaborDocumentGenerator document={document} selected={selected} rules={rules} />

      <section className="mt-10 border-t border-line pt-7"><h2 className="text-2xl font-semibold text-ink">Что делать после скачивания</h2><ol className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">{document.afterFiling.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol></section>

      <section className="mt-10 border-t border-line pt-7"><h2 className="text-2xl font-semibold text-ink">Связанные материалы</h2><div className="mt-4 grid gap-3"><Link href={`${problemPath}?scenario=${selected.scenario.key}`} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Увольнение по инициативе работодателя: порядок действий</Link>{document.relatedDocuments.map((item) => <Link key={item.slug} href={`/documents/${item.slug}/`} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">{item.title}</Link>)}</div></section>

    </article>
  </>;
}

function FactBlock({ title, items }: { title: string; items: string[] }) {
  return <section className="border-t-4 border-zinc-300 pt-4"><h2 className="text-xl font-semibold text-ink">{title}</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{items.map((item) => <li key={item}>- {item}</li>)}</ul></section>;
}

function documentWebPageJsonLd(path: string, document: NavigatorDocument) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: document.title, description: document.seoDescription ?? document.shortDescription, url: absoluteUrl(path), inLanguage: "ru-RU" };
}

function formatDate(value: string) {
  return value.split("-").reverse().join(".");
}
