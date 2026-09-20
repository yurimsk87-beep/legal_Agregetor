"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { NavigatorDocument } from "@/data/documents";

const tagRules = [
  ["ЗАГС", /загс|брак/i],
  ["Алименты", /алимент|содержан|дополнительн.*расход/i],
  ["Суды и иски", /иск|суд|оспар|лишен|ограничен|установлен.*отцов/i],
  ["Соглашения", /соглашен|договор/i],
  ["Жалобы", /жалоб|отказ|бездейств/i],
  ["Исполнительное производство", /исполнител|пристав|задолж/i]
] as const;

export function DocumentsCatalog({ documents }: { documents: NavigatorDocument[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const indexed = useMemo(() => documents.map((document) => ({ document, tags: tagsFor(document), haystack: normalize([document.title, document.documentType, document.category, document.shortDescription, ...document.keywords, ...document.userQueries, ...document.relatedProblems.map((item) => item.title)].join(" ")) })), [documents]);
  const tags = useMemo(() => Array.from(new Set(indexed.flatMap((item) => item.tags))), [indexed]);
  const filtered = indexed.filter((item) => (!tag || item.tags.includes(tag)) && (!normalize(query) || item.haystack.includes(normalize(query))));
  const filteredActive = Boolean(query || tag);

  return (
    <div>
      <div className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-sm">
        <label className="relative block"><span className="sr-only">Поиск документов</span><Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-zinc-500" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти документ: алименты, развод, оспаривание отцовства..." className="min-h-12 w-full rounded-md border border-line py-3 pl-11 pr-4 text-base outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></label>
        <div className="flex flex-wrap gap-2" aria-label="Фильтр по типу документа"><button type="button" onClick={() => setTag("")} aria-pressed={!tag} className={tagClass(!tag)}>Все</button>{tags.map((item) => <button type="button" key={item} onClick={() => setTag(item)} aria-pressed={tag === item} className={tagClass(tag === item)}>{item}</button>)}</div>
        {filteredActive ? <button type="button" onClick={() => { setQuery(""); setTag(""); }} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-trust underline underline-offset-4"><X className="h-4 w-4" aria-hidden="true" />Сбросить фильтры</button> : null}
      </div>
      {filtered.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map(({ document, tags: itemTags }) => <article key={document.slug} className="rounded-md border border-line bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-trust">{document.category}</p><h2 className="mt-2 text-xl font-semibold text-ink">{document.title}</h2><p className="mt-3 text-sm leading-6 text-zinc-600">{document.shortDescription}</p><div className="mt-3 flex flex-wrap gap-2">{itemTags.map((item) => <span key={item} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{item}</span>)}</div><Link href={`/documents/${document.slug}/`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Открыть документ</Link></article>)}</div> : <div className="mt-6 rounded-md border border-line bg-white p-6"><p className="font-semibold text-ink">Документы не найдены</p><p className="mt-2 text-sm text-zinc-600">Измените запрос или сбросьте фильтры.</p><button type="button" onClick={() => { setQuery(""); setTag(""); }} className="mt-4 min-h-11 font-semibold text-trust underline">Сбросить фильтры</button></div>}
    </div>
  );
}

function tagsFor(document: NavigatorDocument) {
  const text = [document.title, document.documentType, document.category, document.shortDescription, ...document.keywords].join(" ");
  return ["Семья и дети", ...tagRules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)];
}
function normalize(value: string) { return value.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim(); }
function tagClass(active: boolean) { return `min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${active ? "border-trust bg-trust text-white" : "border-line bg-white text-zinc-700 hover:border-trust"}`; }
