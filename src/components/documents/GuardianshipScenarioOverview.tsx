import Link from "next/link";
import { GUARDIANSHIP_SCENARIO_CHOICES, GUARDIANSHIP_SCENARIOS } from "@/data/guardianship-route";

export function GuardianshipScenarioOverview({ basePath, linkLabel = "Открыть маршрут" }: { basePath: string; linkLabel?: string }) {
  return (
    <section className="mt-8 border-t border-line pt-7" aria-labelledby="guardianship-overview-title">
      <h2 id="guardianship-overview-title" className="text-2xl font-semibold text-ink">Четыре порядка обращения</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
        Содержимое размещено на основной странице, а выбор открывает только применимые шаги и документ.
      </p>
      <div className="mt-5 grid gap-5">
        {GUARDIANSHIP_SCENARIO_CHOICES.map((choice) => {
          const scenario = GUARDIANSHIP_SCENARIOS[choice.key];
          return (
            <article key={choice.key} className="border-l-4 border-trust bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-ink">{scenario.title}</h3>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
                {scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-700"><strong>Основной результат:</strong> {scenario.mainDocument}</p>
              <Link href={`${basePath}?scenario=${choice.key}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 hover:text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                {linkLabel}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
