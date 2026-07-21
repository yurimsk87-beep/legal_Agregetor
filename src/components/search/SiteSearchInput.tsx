"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AiNavigatorDropdownPanel, type AiNavigatorDropdownPage } from "@/components/ai/AiNavigatorDropdownPanel";
import { getJudicialOrderProblemHref } from "@/lib/judicial-order-flow";

type SiteSearchInputProps = {
  defaultValue?: string;
  hints: string[];
  placeholder: string;
  aiNavigatorPage?: AiNavigatorDropdownPage;
};

const minQueryLength = 2;

export function SiteSearchInput({ defaultValue = "", hints, placeholder, aiNavigatorPage }: SiteSearchInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();
  const showPopularHints = trimmedQuery.length < minQueryLength;
  const showDropdown = Boolean(aiNavigatorPage) && open && trimmedQuery.length >= minQueryLength;
  const allResultsHref = getJudicialOrderProblemHref(trimmedQuery) ?? `/problems/?q=${encodeURIComponent(trimmedQuery)}`;

  // Закрываем выпадающее окно только по клику ВНЕ корня. Любой клик внутри (поле,
  // textarea, кнопки ИИ-блока) не закрывает дропдаун.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative mt-5 min-w-0 w-full">
      <form
        action="/problems/"
        role="search"
        className="flex min-w-0 flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          const href = getJudicialOrderProblemHref(trimmedQuery);
          if (!href) return;
          event.preventDefault();
          window.location.href = href;
        }}
      >
        <label htmlFor="site-search-query" className="sr-only">
          Опишите проблему или найдите нужный документ
        </label>
        <input
          id="site-search-query"
          type="search"
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="min-h-12 w-full min-w-0 flex-1 rounded-md border border-line bg-white px-4 text-base text-ink outline-none placeholder:text-zinc-400 focus:border-trust"
        />
        <button type="submit" className="min-h-12 rounded-md bg-trust px-6 text-sm font-semibold text-white hover:bg-ink">
          Найти решение
        </button>
      </form>

      {showPopularHints ? <PopularSearchHints hints={hints.slice(0, 5)} /> : null}

      {showDropdown && aiNavigatorPage ? (
        <div className="relative z-30 mt-2 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-white p-3 shadow-lg sm:absolute sm:left-0 sm:right-0 sm:p-4">
          <AiNavigatorDropdownPanel query={trimmedQuery} page={aiNavigatorPage} />
          {/* Обычный поиск остаётся доступным из дропдауна. */}
          <Link
            href={allResultsHref}
            className="mt-3 flex items-center justify-between gap-2 rounded-md border border-line bg-zinc-50 px-3 py-2 text-xs font-semibold text-ink hover:border-trust"
          >
            <span className="min-w-0 truncate">Показать все результаты по запросу «{trimmedQuery}»</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-trust" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function PopularSearchHints({ hints }: { hints: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-zinc-600">Популярные запросы:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {hints.map((hint) => (
          <Link
            key={hint}
            href={getJudicialOrderProblemHref(hint) ?? `/problems/?q=${encodeURIComponent(hint)}`}
            className="rounded-full border border-line bg-zinc-50 px-4 py-2 text-sm font-semibold text-ink hover:border-trust hover:text-trust"
          >
            {hint}
          </Link>
        ))}
      </div>
    </div>
  );
}
