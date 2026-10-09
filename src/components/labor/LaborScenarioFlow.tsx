"use client";

import { useState } from "react";
import { LaborDocumentGenerator } from "@/components/labor/LaborDocumentGenerator";
import type { LaborDocumentScenario } from "@/data/labor-documents";
import type { LaborLegalRule } from "@/data/labor-legal-sources";
import type { LaborRoute } from "@/data/labor-routes";

export function LaborScenarioFlow({ route, initialScenario, rules }: { route: LaborRoute; initialScenario?: string; rules: LaborLegalRule[] }) {
  const [scenarioKey, setScenarioKey] = useState(initialScenario ?? "");
  const scenario = route.scenarios.find((item) => item.key === scenarioKey);

  function chooseScenario(key: string) {
    setScenarioKey(key);
    history.replaceState(null, "", key ? `?scenario=${encodeURIComponent(key)}` : window.location.pathname);
  }

  if (!scenario) {
    return (
      <section className="mt-8" aria-labelledby="labor-scenario-title">
        <h2 id="labor-scenario-title" className="text-2xl font-semibold text-ink">Выберите, что произошло</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {route.scenarios.map((item) => (
            <button key={item.key} type="button" onClick={() => chooseScenario(item.key)} className="min-h-11 rounded-md border border-line bg-white p-5 text-left shadow-sm outline-none hover:border-trust focus:ring-2 focus:ring-trust/30">
              <span className="block text-lg font-semibold text-ink">{item.title}</span>
              <span className="mt-2 block text-sm leading-6 text-zinc-600">{item.description}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const selected = scenario.documentSlug
    ? { route, scenario: scenario as LaborDocumentScenario["scenario"] }
    : null;

  return (
    <div className="mt-8">
      <button type="button" onClick={() => chooseScenario("")} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Изменить ситуацию</button>
      {selected ? (
        <LaborDocumentGenerator
          key={`${route.slug}:${scenario.key}`}
          document={{ slug: selected.scenario.documentSlug }}
          selected={selected}
          rules={rules}
        />
      ) : (
        <p className="mt-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert">Для выбранной ситуации документ пока недоступен.</p>
      )}
    </div>
  );
}
