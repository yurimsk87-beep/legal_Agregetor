import type { LegalReference } from "@/lib/types";

type LegalReferencesBlockProps = {
  references: readonly LegalReference[];
  title?: string;
  description?: string;
};

export function LegalReferencesBlock({
  references,
  title = "Правовые основания",
  description = "Нормы, которые обычно проверяют по этой ситуации. Точный набор зависит от документов, сроков и фактов дела."
}: LegalReferencesBlockProps) {
  if (!references.length) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Нормы права</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {references.map((reference) => (
          <article key={`${reference.code}-${reference.article}`} className="rounded-md border border-line bg-zinc-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-trust ring-1 ring-line">
                {reference.code}
              </span>
              <span className="text-sm font-semibold text-ink">{reference.article}</span>
            </div>
            {reference.title ? <h3 className="mt-3 text-base font-semibold text-ink">{reference.title}</h3> : null}
            <p className="mt-2 text-sm leading-6 text-zinc-600">{reference.summary}</p>
            {reference.url ? (
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-trust hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30"
              >
                Открыть источник
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
