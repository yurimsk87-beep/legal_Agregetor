import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Страница не найдена — ПравоПоиск",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <SearchX className="mx-auto h-12 w-12 text-trust" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-semibold text-ink">Страница не найдена</h1>
      <p className="mt-4 text-zinc-600">
        Возможно, страница удалена или URL введен с ошибкой. Начните с диагностики, правового навигатора или каталога документов.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          На главную
        </Link>
        <Link href="/problems/" className="inline-flex rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          Смотреть ситуации
        </Link>
        <Link href="/problems/" className="inline-flex rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Правовой навигатор
        </Link>
        <Link href="/documents/" className="inline-flex rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Документы
        </Link>
      </div>
    </section>
  );
}
