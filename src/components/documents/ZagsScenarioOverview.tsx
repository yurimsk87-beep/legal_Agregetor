import Link from "next/link";
import { ZAGS_SCENARIOS, ZAGS_SCENARIO_KEYS } from "@/data/zags-route";

export function ZagsScenarioOverview({
  basePath,
  queryKey,
  linkLabel
}: {
  basePath: string;
  queryKey: "scenario" | "variant";
  linkLabel: string;
}) {
  return (
    <section className="mt-10 border-t border-line pt-8" aria-labelledby="zags-scenario-overview">
      <h2 id="zags-scenario-overview" className="text-2xl font-semibold text-ink">Четыре процедуры ЗАГС</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">
        У каждой процедуры своя форма, состав сведений, пошлина и порядок подачи. Краткий обзор помогает выбрать маршрут, а подробная проверка открывается отдельно.
      </p>
      <div className="mt-6 grid gap-6">
        {ZAGS_SCENARIO_KEYS.map((key) => {
          const scenario = ZAGS_SCENARIOS[key];
          return (
            <article key={key} className="border-b border-line pb-6 last:border-b-0">
              <h3 className="text-xl font-semibold text-ink">{scenario.title}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-700">{scenario.description[0]}</p>
              <dl className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-ink">Форма</dt>
                  <dd className="text-zinc-700">{scenario.forms.map((form) => `N ${form.number} — ${form.purpose}`).join("; ")}.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Госпошлина</dt>
                  <dd className="text-zinc-700">{scenario.fee}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-ink">Подача</dt>
                  <dd className="text-zinc-700">{scenario.filing}</dd>
                </div>
              </dl>
              <Link
                href={`${basePath}?${queryKey}=${key}`}
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30"
              >
                {linkLabel}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
