import type { FaqItem } from "@/lib/types";

export function FaqBlock({ items, title = "Частые вопросы" }: { items: FaqItem[]; title?: string }) {
  if (items.length === 0) return null;

  return (
    <section data-seo-block="faq" className="border-y border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-normal text-ink">{title}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <article key={item.id} className="rounded-lg border border-line bg-zinc-50 p-5">
              <h3 className="text-base font-semibold text-ink">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
