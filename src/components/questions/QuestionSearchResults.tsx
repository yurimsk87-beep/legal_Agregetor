"use client";

import Link from "next/link";
import { useState } from "react";
import { Scale } from "lucide-react";
import type { Question } from "@/lib/types";
import { QuestionCard } from "./QuestionsList";

const PAGE_SIZE = 24;

export function QuestionSearchResults({
  query,
  initialQuestions,
  initialHasMore
}: {
  query: string;
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(initialQuestions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMore() {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query, offset: String(items.length), limit: String(PAGE_SIZE) });
      const response = await fetch(`/api/questions/?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Request failed");
      const data = (await response.json()) as { questions?: Question[]; hasMore?: boolean };
      const next = Array.isArray(data.questions) ? data.questions : [];
      setItems((current) => {
        const seen = new Set(current.map((question) => question.id));
        return [...current, ...next.filter((question) => !seen.has(question.id))];
      });
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Не удалось загрузить ещё. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Результаты поиска</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            Вопросы по запросу «{query}»
          </h2>
        </div>
        <Link href="/questions/#questions-list" className="shrink-0 text-sm font-semibold text-trust hover:text-ink">
          Сбросить поиск
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-5">
          {items.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
          <Scale className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-ink">Ничего не нашли по запросу «{query}»</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Попробуйте другие слова или задайте свой вопрос — после модерации он появится в открытом разделе.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink">
              Задать вопрос юристу
            </Link>
            <Link href="/questions/#questions-list" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Все вопросы
            </Link>
          </div>
        </div>
      )}

      {(hasMore || error) && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {hasMore ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isLoading}
              className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoading ? "Загружаем..." : "Показать ещё"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
