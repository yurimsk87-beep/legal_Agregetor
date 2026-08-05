import Link from "next/link";
import {
  DIVORCE_PROPERTY_SCENARIO_CHOICES,
  DIVORCE_PROPERTY_SCENARIOS
} from "@/data/divorce-property-route";

export function DivorcePropertyScenarioOverview({ basePath }: { basePath: string }) {
  return (
    <section className="mt-10 border-t border-line pt-8" aria-labelledby="route-overview-title">
      <h2 id="route-overview-title" className="text-2xl font-semibold text-ink">Четыре порядка действий</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
        Выберите цель на первом экране. Ниже приведено краткое различие процедур, чтобы поисковая и серверная версия страницы содержала полный смысл маршрута без одновременного показа анкет.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {DIVORCE_PROPERTY_SCENARIO_CHOICES.map((choice) => {
          const scenario = DIVORCE_PROPERTY_SCENARIOS[choice.key];
          return (
            <article key={choice.key} className="border-l-4 border-trust pl-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {choice.goal === "divorce" ? "Расторжение брака" : "Раздел имущества"}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-ink">{scenario.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{scenario.description[0]}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600"><strong>Документ:</strong> {scenario.mainDocument}</p>
              <Link href={`${basePath}?scenario=${scenario.key}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                Открыть порядок действий
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
