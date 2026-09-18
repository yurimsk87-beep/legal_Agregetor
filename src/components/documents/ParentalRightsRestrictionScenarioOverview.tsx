import Link from "next/link";
import { PARENTAL_RIGHTS_RESTRICTION_SCENARIO_CHOICES, PARENTAL_RIGHTS_RESTRICTION_SCENARIOS } from "@/data/parental-rights-restriction-route";

export function ParentalRightsRestrictionScenarioOverview({ basePath }: { basePath: string }) {
  return <section className="mt-8 border-t border-line pt-7" aria-labelledby="restriction-overview-title">
    <h2 id="restriction-overview-title" className="text-2xl font-semibold text-ink">Три задачи маршрута</h2>
    <div className="mt-5 grid gap-5">{PARENTAL_RIGHTS_RESTRICTION_SCENARIO_CHOICES.map((choice) => {
      const scenario = PARENTAL_RIGHTS_RESTRICTION_SCENARIOS[choice.key];
      return <article key={choice.key} className="border-l-4 border-trust bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-ink">{scenario.title}</h3>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{scenario.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <p className="mt-4 text-sm leading-6 text-zinc-700"><strong>Результат:</strong> {scenario.mainDocument}</p>
        <Link href={`${basePath}?scenario=${choice.key}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Открыть маршрут</Link>
      </article>;
    })}</div>
  </section>;
}
