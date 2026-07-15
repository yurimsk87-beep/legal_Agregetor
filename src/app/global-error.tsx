"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold text-ink">Что-то пошло не так</h1>
          <p className="mt-4 text-zinc-600">Попробуйте обновить страницу или вернитесь на главную. Детали технической ошибки пользователю не раскрываются.</p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={reset} className="rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white">
              Повторить
            </button>
            <Link href="/" className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink">
              На главную
            </Link>
            <Link href="/problems/" className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink">
              Смотреть ситуации
            </Link>
          </div>
        </section>
      </body>
    </html>
  );
}
