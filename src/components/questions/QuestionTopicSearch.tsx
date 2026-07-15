"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type Topic = { id: string; name: string; slug?: string };

export function QuestionTopicSearch({
  categories,
  activeCategorySlug,
  initialQuery = ""
}: {
  categories: Topic[];
  activeCategorySlug?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const trimmed = query.trim();

  const filteredTopics = useMemo(() => {
    if (!trimmed) return categories;
    const needle = trimmed.toLowerCase();
    return categories.filter((category) => category.name.toLowerCase().includes(needle));
  }, [categories, trimmed]);

  function runSearch() {
    if (trimmed.length < 2) return;
    router.push(`/questions/?q=${encodeURIComponent(trimmed)}#questions-list`);
  }

  return (
    <div className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Поиск</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">Найдите тему или похожий вопрос</h2>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
        role="search"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например: алименты, развод, увольнение"
            aria-label="Поиск по темам и вопросам"
            className="h-11 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm text-ink outline-none transition focus:border-trust"
          />
        </div>
        <button
          type="submit"
          disabled={trimmed.length < 2}
          className="inline-flex h-11 shrink-0 items-center rounded-md bg-trust px-4 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Найти
        </button>
      </form>

      <div className="mt-4 flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1" aria-label="Темы вопросов">
        <Link href="/questions/#questions-list" className={chipClass(!activeCategorySlug)}>
          Все темы
        </Link>
        {filteredTopics.map((category) => {
          const key = category.slug ?? category.id;
          const isActive = activeCategorySlug === category.slug || activeCategorySlug === category.id;
          return (
            <Link key={category.id} href={`/questions/?category=${encodeURIComponent(key)}#questions-list`} className={chipClass(isActive)}>
              {category.name}
            </Link>
          );
        })}
        {trimmed.length >= 2 && filteredTopics.length === 0 ? (
          <button type="button" onClick={runSearch} className={chipClass(false)}>
            Искать «{trimmed}» среди вопросов
          </button>
        ) : null}
      </div>
    </div>
  );
}

function chipClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-white"
    : "rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-trust hover:text-trust";
}
