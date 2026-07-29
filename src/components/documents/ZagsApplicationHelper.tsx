"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ZAGS_SCENARIOS } from "@/data/zags-route";
import type { ZagsHelperField, ZagsScenarioKey } from "@/data/zags-route";
import zagsDirectoryJson from "@/data/zags-offices.json";
import {
  isZagsFieldVisible,
  validateZagsApplication
} from "@/lib/zags-application-validator";
import type {
  ZagsApplicationDecision,
  ZagsApplicationValues
} from "@/lib/zags-application-validator";

type ZagsDirectory = {
  metadata: {
    sourceUrl: string;
    sourceName: string;
    lastVerifiedAt: string;
    isComplete: boolean;
    note: string;
  };
  regions: Record<string, string[]>;
};

const zagsDirectory = zagsDirectoryJson as ZagsDirectory;
const zagsRegions = Object.keys(zagsDirectory.regions);

type ReviewState = {
  decision: ZagsApplicationDecision;
  missing: string[];
  values: Array<{ label: string; value: string }>;
} | null;

export function ZagsApplicationHelper({ scenarioKey }: { scenarioKey: ZagsScenarioKey }) {
  const scenario = ZAGS_SCENARIOS[scenarioKey];
  const [review, setReview] = useState<ReviewState>(null);
  const [values, setValues] = useState<ZagsApplicationValues>({});
  const availableOffices = zagsDirectory.regions[values.region ?? ""] ?? [];
  const visibleFields = scenario.helperFields.filter((field) =>
    isZagsFieldVisible(scenarioKey, field.name, values)
  );

  function setField(name: string, value: string) {
    setValues((current) => name === "region"
      ? { ...current, region: value, office: "" }
      : { ...current, [name]: value });
    setReview(null);
  }

  function reviewFields(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = visibleFields
      .filter((field) => field.required && !values[field.name]?.trim())
      .map((field) => field.label);
    const decision = validateZagsApplication(scenarioKey, values);
    const preparedValues = visibleFields
      .map((field) => ({ label: field.label, value: values[field.name]?.trim() ?? "" }))
      .filter((item) => item.value);

    setReview({ decision, missing, values: preparedValues });
  }

  const hasErrors = Boolean(review && (review.missing.length || !review.decision.allowed));

  return (
    <section id="fill-online" className="scroll-mt-24 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Проверка применимости</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">Подготовьте данные для заявления</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
        Помощник проверит выбранную процедуру, форму, приложения и госпошлину. Он не создаёт и не имитирует официальный бланк органа ЗАГС.
      </p>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Используйте действующую редакцию формы из Приказа Минюста России N 201. Перед подачей перенесите подготовленные данные в официальный бланк и сверьте подписи и приложения.
      </div>

      <div className="mt-5 grid gap-3 rounded-lg border border-line bg-zinc-50 p-4">
        <h3 className="font-semibold text-ink">Возможные формы для процедуры</h3>
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
        {visibleFields.map((field) => (
          <ZagsField
            key={field.name}
            availableOffices={availableOffices}
            field={field}
            onChange={setField}
            value={values[field.name] ?? ""}
          />
        ))}

        <div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
            Проверить применимость и данные
          </button>
        </div>
      </form>

      <div className="mt-5" aria-live="polite">
        {hasErrors && review ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            <p className="font-semibold">Пока нельзя завершить подготовку:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {review.missing.map((item) => <li key={`missing-${item}`}>Заполните поле «{item}».</li>)}
              {review.decision.issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}
            </ul>
          </div>
        ) : review ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-semibold">Данные собраны, применимость проверена.</p>
            <p className="mt-2"><strong>Форма:</strong> {review.decision.formNumbers.map((number) => `N ${number}`).join(", ")}.</p>
            <p className="mt-1"><strong>Госпошлина:</strong> {review.decision.feeLabel}</p>
            {review.decision.notices.map((notice) => <p key={notice} className="mt-2">{notice}</p>)}
            <div className="mt-4 border-t border-emerald-200 pt-4">
              <p className="font-semibold">Приложения по выбранным ответам:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {review.decision.attachments.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
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

      <p className="mt-5 text-xs leading-5 text-zinc-500">
        Справочник используется только для подсказок и может быть неполным. {zagsDirectory.metadata.note}{" "}
        <a href={zagsDirectory.metadata.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-trust underline underline-offset-2">
          {zagsDirectory.metadata.sourceName}
        </a>{" "}
        (проверено {zagsDirectory.metadata.lastVerifiedAt}).
      </p>
    </section>
  );
}

function ZagsField({
  availableOffices,
  field,
  onChange,
  value
}: {
  availableOffices: string[];
  field: ZagsHelperField;
  onChange: (name: string, value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
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
            value={value}
            onChange={(event) => onChange(field.name, event.target.value)}
            placeholder="Начните вводить область, республику или регион"
            autoComplete="off"
            className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
          />
          <datalist id="zags-regions">
            {zagsRegions.map((region) => <option key={region} value={region} />)}
          </datalist>
          <span className="font-normal text-zinc-500">Можно ввести регион вручную, даже если его нет в подсказках.</span>
        </>
      ) : field.type === "zags-office" ? (
        <>
          <input
            name={field.name}
            list="zags-offices"
            required={field.required}
            value={value}
            onChange={(event) => onChange(field.name, event.target.value)}
            placeholder="Начните вводить название органа ЗАГС"
            autoComplete="off"
            className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
          />
          <datalist id="zags-offices">
            {availableOffices.map((office) => <option key={office} value={office} />)}
          </datalist>
          <span className="font-normal text-zinc-500">Не нашли нужный орган — введите название вручную.</span>
        </>
      ) : field.type === "textarea" ? (
        <textarea
          name={field.name}
          required={field.required}
          rows={3}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="min-h-24 w-full rounded-md border border-line bg-white px-3 py-3 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
        />
      ) : field.type === "select" ? (
        <select
          name={field.name}
          required={field.required}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
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
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
        />
      )}
    </label>
  );
}
