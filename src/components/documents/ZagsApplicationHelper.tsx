"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ZAGS_SCENARIOS } from "@/data/zags-route";
import type { ZagsScenarioKey } from "@/data/zags-route";
import zagsOffices from "@/data/zags-offices.json";

const zagsOfficesByRegion: Record<string, string[]> = zagsOffices;
const zagsRegions = Object.keys(zagsOfficesByRegion);

type ReviewState = {
  missing: string[];
  values: Array<{ label: string; value: string }>;
} | null;

export function ZagsApplicationHelper({ scenarioKey }: { scenarioKey: ZagsScenarioKey }) {
  const scenario = ZAGS_SCENARIOS[scenarioKey];
  const [review, setReview] = useState<ReviewState>(null);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const availableOffices = zagsOfficesByRegion[selectedRegion] ?? [];

  function reviewFields(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = scenario.helperFields
      .map((field) => ({ label: field.label, value: String(formData.get(field.name) ?? "").trim() }))
      .filter((item) => item.value);
    const missing = scenario.helperFields
      .filter((field) => {
        if (!field.required) return false;

        const value = String(formData.get(field.name) ?? "").trim();
        if (!value) return true;
        if (field.type === "zags-region") return !zagsOfficesByRegion[value];
        if (field.type === "zags-office") {
          const region = String(formData.get("region") ?? "").trim();
          return !(zagsOfficesByRegion[region] ?? []).includes(value);
        }

        return false;
      })
      .map((field) => field.label);

    setReview({ missing, values });
  }

  return (
    <section id="fill-online" className="scroll-mt-24 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Помощник по заполнению</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">Подготовьте данные для заявления</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
        Помощник собирает сведения в порядке, удобном для переноса в утверждённый бланк. Он не создаёт и не имитирует официальный бланк органа ЗАГС.
      </p>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Используйте только действующую редакцию формы из Приказа Минюста России N 201. Перед подачей перенесите подготовленные данные в официальный бланк и проверьте обязательные поля, подписи и приложения.
      </div>

      <div className="mt-5 grid gap-3 rounded-lg border border-line bg-zinc-50 p-4">
        <h3 className="font-semibold text-ink">Подходящая форма</h3>
        {scenario.forms.map((form) => (
          <p key={form.number} className="text-sm leading-6 text-zinc-700">
            <strong>Форма N {form.number}</strong> — {form.purpose}.
          </p>
        ))}
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="https://publication.pravo.gov.ru/Document/View/0001201810030017"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30"
          >
            Официальное опубликование
          </a>
          <a
            href="https://www.consultant.ru/document/cons_doc_LAW_308185/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30"
          >
            Открыть действующую редакцию форм
          </a>
        </div>
      </div>

      <form className="mt-6 grid gap-5" onSubmit={reviewFields}>
        {scenario.helperFields.map((field) => (
          <label key={field.name} className="grid gap-2 text-sm font-semibold text-ink">
            <span>
              {field.label}
              {field.required ? <span className="text-rose-600"> *</span> : null}
            </span>
            {field.type === "zags-region" ? (
              <>
                <input
                  name={field.name}
                  list="zags-regions"
                  required={field.required}
                  value={selectedRegion}
                  onChange={(event) => {
                    setSelectedRegion(event.target.value);
                    setSelectedOffice("");
                  }}
                  placeholder="Начните вводить область, республику или регион"
                  autoComplete="off"
                  className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
                />
                <datalist id="zags-regions">
                  {zagsRegions.map((region) => <option key={region} value={region} />)}
                </datalist>
              </>
            ) : field.type === "zags-office" ? (
              <>
                <input
                  name={field.name}
                  list="zags-offices"
                  required={field.required}
                  value={selectedOffice}
                  onChange={(event) => setSelectedOffice(event.target.value)}
                  placeholder={availableOffices.length ? "Начните вводить название органа ЗАГС" : "Сначала выберите регион"}
                  autoComplete="off"
                  disabled={!availableOffices.length}
                  className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 focus:border-trust focus:ring-2 focus:ring-trust/20"
                />
                <datalist id="zags-offices">
                  {availableOffices.map((office) => <option key={office} value={office} />)}
                </datalist>
              </>
            ) : field.type === "textarea" ? (
              <textarea
                name={field.name}
                required={field.required}
                rows={3}
                className="min-h-24 w-full rounded-md border border-line bg-white px-3 py-3 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
              />
            ) : field.type === "select" ? (
              <select
                name={field.name}
                required={field.required}
                defaultValue=""
                className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
              >
                <option value="">Выберите вариант</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
              />
            )}
          </label>
        ))}

        <div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
            Проверить заполнение
          </button>
        </div>
      </form>

      <div className="mt-5" aria-live="polite">
        {review?.missing.length ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            <p className="font-semibold">Заполните обязательные сведения:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {review.missing.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ) : review ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-semibold">Основные данные собраны.</p>
            <p className="mt-1">Перенесите их в действующий официальный бланк и сверьте с документами до подписания.</p>
            <dl className="mt-4 grid gap-3 border-t border-emerald-200 pt-4">
              {review.values.map((item) => (
                <div key={item.label}>
                  <dt className="font-semibold">{item.label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-zinc-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
