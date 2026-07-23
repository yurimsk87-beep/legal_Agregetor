"use client";

import { useEffect, useState } from "react";
import { ZagsApplicationHelper } from "@/components/documents/ZagsApplicationHelper";
import type { DocumentGeneratorTemplate } from "@/lib/types";
import { getZagsScenario } from "@/data/zags-route";

type Props = {
  template: DocumentGeneratorTemplate;
  instructionHref: string;
};

export function DocumentGeneratorSection({ template }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedScenario = getZagsScenario(selectedKey);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("variant");
    if (key && template.variants.some((variant) => variant.key === key)) {
      setSelectedKey(key);
      requestAnimationFrame(() => document.getElementById("fill-online")?.scrollIntoView({ block: "start" }));
    }
  }, [template.variants]);

  function selectVariant(key: string) {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", key);
    url.hash = "fill-online";
    window.history.replaceState(null, "", url);
  }

  function resetVariant() {
    setSelectedKey(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("variant");
    url.hash = "fill-online";
    window.history.replaceState(null, "", url);
  }

  return (
    <section id="fill-online" className="scroll-mt-24">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Заявление в ЗАГС</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Выберите процедуру</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Для разных обращений в ЗАГС применяются разные утверждённые формы. Выберите цель — дальше появится помощник по подготовке данных для официального бланка.
        </p>
      </div>

      {!selectedScenario ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {template.variants.map((variant) => (
            <button
              key={variant.key}
              type="button"
              onClick={() => selectVariant(variant.key)}
              className="min-h-11 rounded-lg border border-line bg-white p-5 text-left shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"
            >
              <span className="text-lg font-semibold text-ink">{variant.title}</span>
              <span className="mt-2 block text-sm leading-6 text-zinc-600">{variant.description}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedScenario ? (
        <div className="mt-6 grid gap-6">
          <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-trust">Выбранный вариант</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">{selectedScenario.title}</h3>
              </div>
              <button type="button" onClick={resetVariant} className="min-h-11 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:border-trust focus:outline-none">
                Выбрать другой
              </button>
            </div>
          </div>

          <ZagsApplicationHelper scenarioKey={selectedScenario.key} />
        </div>
      ) : null}
    </section>
  );
}
