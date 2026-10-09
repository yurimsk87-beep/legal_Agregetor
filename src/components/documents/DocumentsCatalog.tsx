"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { NavigatorDocument } from "@/data/documents";

const documentTypeRules = [
  ["Иски", /^(иск|исковое заявление)/i],
  ["Заявления", /^заявление/i],
  ["Жалобы", /^жалоба/i],
  ["Возражения и отзывы", /возражен|замечан|^отзыв/i],
  ["Уведомления", /^уведомление/i],
  ["Запросы", /^запрос/i],
  ["Претензии и требования", /претенз|требован/i],
  ["Соглашения и договоры", /соглашен|договор/i]
] as const;

const lawAreas = ["Семейное право", "Трудовое право"] as const;

export function DocumentsCatalog({ documents }: { documents: NavigatorDocument[] }) {
  const [query, setQuery] = useState("");
  const [lawArea, setLawArea] = useState("");
  const [documentType, setDocumentType] = useState("");
  const indexed = useMemo(() => documents.map((document) => ({ document, lawArea: lawAreaFor(document), documentType: documentTypeFor(document), haystack: normalize([document.title, document.documentType, document.category, document.shortDescription, ...document.keywords, ...document.userQueries, ...document.relatedProblems.map((item) => item.title)].join(" ")) })), [documents]);
  const availableDocumentTypes = useMemo(() => Array.from(new Set(indexed.filter((item) => !lawArea || item.lawArea === lawArea).map((item) => item.documentType))), [indexed, lawArea]);
  const normalizedQuery = normalize(query);
  const filtered = indexed.filter((item) => (!lawArea || item.lawArea === lawArea) && (!documentType || item.documentType === documentType) && (!normalizedQuery || item.haystack.includes(normalizedQuery)));
  const filteredActive = Boolean(query || lawArea || documentType);
  const resetFilters = () => { setQuery(""); setLawArea(""); setDocumentType(""); };

  return (
    <div>
      <div className="grid gap-4 rounded-md border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <label className="grid gap-2"><span className="text-sm font-semibold text-ink">Поиск документов</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-zinc-500" aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например: увольнение, алименты или развод" className="min-h-12 w-full rounded-md border border-line py-3 pl-11 pr-4 text-base outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></span></label>
          <label className="grid gap-2"><span className="text-sm font-semibold text-ink">Вид права</span><select value={lawArea} onChange={(event) => { setLawArea(event.target.value); setDocumentType(""); }} className="min-h-12 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"><option value="">Все виды права</option>{lawAreas.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Тип документа</p>
          <div className="flex flex-wrap gap-2" aria-label="Фильтр по типу документа"><button type="button" onClick={() => setDocumentType("")} aria-pressed={!documentType} className={tagClass(!documentType)}>Все</button>{availableDocumentTypes.map((item) => <button type="button" key={item} onClick={() => setDocumentType(item)} aria-pressed={documentType === item} className={tagClass(documentType === item)}>{item}</button>)}</div>
        </div>
        {filteredActive ? <button type="button" onClick={resetFilters} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-trust underline underline-offset-4"><X className="h-4 w-4" aria-hidden="true" />Сбросить фильтры</button> : null}
      </div>
      {filtered.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map(({ document, lawArea: itemLawArea, documentType: itemDocumentType }) => <article key={document.slug} className="rounded-md border border-line bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-trust">{document.category}</p><h2 className="mt-2 text-xl font-semibold text-ink">{document.title}</h2><p className="mt-3 text-sm leading-6 text-zinc-600">{document.shortDescription}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{itemLawArea}</span><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700">{itemDocumentType}</span></div><Link href={`/documents/${document.slug}/`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Открыть документ</Link></article>)}</div> : <div className="mt-6 rounded-md border border-line bg-white p-6"><p className="font-semibold text-ink">Документы не найдены</p><p className="mt-2 text-sm text-zinc-600">Измените запрос или сбросьте фильтры.</p><button type="button" onClick={resetFilters} className="mt-4 min-h-11 font-semibold text-trust underline">Сбросить фильтры</button></div>}
    </div>
  );
}

function lawAreaFor(document: NavigatorDocument) {
  return document.category === "Трудовое право" ? "Трудовое право" : "Семейное право";
}
function documentTypeFor(document: NavigatorDocument) {
  const values = [document.title, document.documentType];
  return documentTypeRules.find(([, pattern]) => values.some((value) => pattern.test(value)))?.[0] ?? "Другие документы";
}
function normalize(value: string) { return value.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim(); }
function tagClass(active: boolean) { return `min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${active ? "border-trust bg-trust text-white" : "border-line bg-white text-zinc-700 hover:border-trust"}`; }
