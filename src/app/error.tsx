"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink">Не удалось загрузить страницу</h1>
      <p className="mt-4 text-zinc-600">Повторите попытку. Если ошибка сохранится, вернитесь на главную или откройте диагностику ситуации.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          Повторить
        </button>
        <Link href="/" className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          На главную
        </Link>
        <Link href="/problems/" className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Смотреть ситуации
        </Link>
      </div>
    </section>
  );
}
