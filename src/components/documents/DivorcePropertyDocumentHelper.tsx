"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  DIVORCE_PROPERTY_SCENARIOS
} from "@/data/divorce-property-route";
import { COURT_DIRECTORY, COURT_REGIONS } from "@/data/court-directory";
import type {
  DivorcePropertyHelperField,
  DivorcePropertyScenarioKey
} from "@/data/divorce-property-route";
import {
  calculatePropertyAssets,
  courtLevelLabel,
  isDivorcePropertyFieldVisible,
  resolveCourtLevel,
  validateDivorcePropertyApplication
} from "@/lib/divorce-property-validator";
import type {
  CourtLevel,
  DivorcePropertyDecision,
  DivorcePropertyValues,
  PropertyAssetRow
} from "@/lib/divorce-property-validator";

type ReviewState = {
  decision: DivorcePropertyDecision;
  missing: string[];
  values: Array<{ label: string; value: string }>;
} | null;

export function DivorcePropertyDocumentHelper({ scenarioKey }: { scenarioKey: DivorcePropertyScenarioKey }) {
  const scenario = DIVORCE_PROPERTY_SCENARIOS[scenarioKey];
  const [values, setValues] = useState<DivorcePropertyValues>({});
  const [assetRows, setAssetRows] = useState<PropertyAssetRow[]>(() => [createEmptyAssetRow()]);
  const [review, setReview] = useState<ReviewState>(null);
  const [draftPreview, setDraftPreview] = useState("");
  const [supplementalDrafts, setSupplementalDrafts] = useState<Array<{ title: string; text: string }>>([]);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const formValues = scenarioKey === "property-claim"
    ? { ...values, assetRows: JSON.stringify(assetRows) }
    : values;
  const courtLevel = resolveCourtLevel(scenarioKey, formValues);
  const previousCourtLevel = useRef(courtLevel);
  const visibleFields = scenario.helperFields.filter((field) => isDivorcePropertyFieldVisible(scenarioKey, field.name, formValues));

  useEffect(() => {
    if (previousCourtLevel.current === courtLevel) return;
    previousCourtLevel.current = courtLevel;
    setValues((current) => {
      if (!current.courtSearchConfirmed && !current.courtName && !current.courtAddress && !current.courtWebsite) return current;
      return {
        ...current,
        courtSearchConfirmed: "",
        courtName: "",
        courtAddress: "",
        courtWebsite: "",
        appealCourtName: ""
      };
    });
    setReview(null);
    setDraftPreview("");
    setSupplementalDrafts([]);
  }, [courtLevel]);

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setReview(null);
    setDraftPreview("");
    setSupplementalDrafts([]);
    setCopied(false);
    setDownloadError("");
  }

  function setAssetField(id: string, name: keyof PropertyAssetRow, value: string) {
    setAssetRows((current) => current.map((row) => row.id === id ? { ...row, [name]: value } as PropertyAssetRow : row));
    setReview(null);
    setDraftPreview("");
    setSupplementalDrafts([]);
  }

  function addAsset() {
    setAssetRows((current) => [...current, createEmptyAssetRow()]);
    setReview(null);
  }

  function removeAsset(id: string) {
    setAssetRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));
    setReview(null);
  }

  function setSupplementalDraft(index: number, text: string) {
    setSupplementalDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, text } : draft));
  }

  function reviewFields(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = visibleFields
      .filter((field) => field.required && !values[field.name]?.trim())
      .map((field) => field.label);
    const decision = validateDivorcePropertyApplication(scenarioKey, formValues);
    const preparedValues = visibleFields
      .map((field) => ({ label: field.label, value: fieldValueLabel(field, formValues[field.name] ?? "") }))
      .filter((item) => item.value);
    setReview({ decision, missing, values: preparedValues });
    setDraftPreview(decision.allowed ? decision.draftText : "");
    setSupplementalDrafts(decision.allowed ? decision.supplementalDrafts : []);
  }

  const hasErrors = Boolean(review && (review.missing.length || !review.decision.allowed));
  const hasDraft = Boolean(review?.decision.allowed && review.decision.draftText);

  async function copyDraft() {
    if (!review || !draftPreview) return;
    await navigator.clipboard.writeText(draftPreview);
    setCopied(true);
  }

  async function downloadDocx() {
    if (!review || !draftPreview) return;
    setDownloadError("");
    try {
      const { Document, Packer, Paragraph } = await import("docx");
      const supplementalParagraphs = supplementalDrafts.flatMap((draft) => [
        new Paragraph({ text: "" }),
        new Paragraph({ text: draft.title }),
        ...draft.text.split("\n").map((line) => new Paragraph({ text: line }))
      ]);
      const document = new Document({
        sections: [{
          properties: {},
          children: [
            ...draftPreview.split("\n").map((line) => new Paragraph({ text: line })),
            ...supplementalParagraphs
          ]
        }]
      });
      const blob = await Packer.toBlob(document);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${review.decision.filingReady ? "" : "chernovik-"}${scenario.documentSlug}.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Не удалось сформировать DOCX в браузере. Текст документа сохранён в превью и доступен для копирования.");
    }
  }

  function printDraft() {
    if (!review || !draftPreview) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setDownloadError("Браузер заблокировал печатное окно. Разрешите всплывающие окна для этой страницы.");
      return;
    }
    const supplementalText = supplementalDrafts.map((draft) => `\n\n${draft.title}\n${draft.text}`).join("");
    const printTitle = review.decision.filingReady ? review.decision.documentTitle : `Черновик — ${review.decision.documentTitle}`;
    printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(printTitle)}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;white-space:pre-wrap;line-height:1.5;color:#111}@media print{body{margin:20mm}}</style></head><body>${escapeHtml(draftPreview + supplementalText)}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <section id="fill-online" className="scroll-mt-24 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Подготовка документа</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{scenario.mainDocument}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
        Ответы обрабатываются в браузере и не отправляются на сервер. Помощник применяет только заранее заданные правила и не использует свободную генерацию правовых требований.
      </p>

      {scenarioKey === "registry-divorce" ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Для форм N 9-12 помощник определяет бланк и подготавливает сведения. Приблизительный официальный PDF или DOCX не создаётся: используйте действующую форму Приказа Минюста России N 201.
        </div>
      ) : null}

      <form className="mt-6 grid min-w-0 gap-5" onSubmit={reviewFields}>
        {scenarioKey === "property-claim" ? (
          <PropertyAssetEditor
            rows={assetRows}
            onAdd={addAsset}
            onChange={setAssetField}
            onRemove={removeAsset}
          />
        ) : null}
        {visibleFields.map((field) => (
          <div key={field.name} className="min-w-0">
            {field.name === "courtSearchConfirmed" ? <CourtLookupNotice courtLevel={courtLevel} /> : null}
            <HelperField field={field} courtLevel={courtLevel} onChange={setField} value={formValues[field.name] ?? ""} />
          </div>
        ))}
        <div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
            Подготовить документ
          </button>
        </div>
      </form>

      <div className="mt-5" aria-live="polite">
        {hasErrors && review ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            <p className="font-semibold">Документ пока нельзя сформировать:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {review.missing.map((item) => <li key={`missing-${item}`}>Заполните поле «{item}».</li>)}
              {review.decision.issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}
            </ul>
          </div>
        ) : review ? (
          <div className={`rounded-lg border p-4 text-sm leading-6 ${review.decision.filingReady ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950"}`}>
            <p className="font-semibold">{review.decision.filingReady ? "Проверка завершена." : "Черновик — не готов к подаче."}</p>
            <p className="mt-2"><strong>Основной документ:</strong> {review.decision.documentTitle}.</p>
            {review.decision.formNumbers.length ? <p className="mt-1"><strong>Форма:</strong> {review.decision.formNumbers.map((number) => `N ${number}`).join(", ")}.</p> : null}
            <p className="mt-1"><strong>Платёж:</strong> {review.decision.feeLabel}</p>
            <p className="mt-1"><strong>Куда подавать:</strong> {review.decision.jurisdiction}</p>
            <p className="mt-1"><strong>Как подать:</strong> {review.decision.filingInstruction}</p>
            <p className="mt-1"><strong>После подачи:</strong> {review.decision.afterFiling}</p>
            {review.decision.notices.map((notice) => <p key={notice} className="mt-2">{notice}</p>)}
            {review.decision.requiresLegalReview ? (
              <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
                В ответах есть обстоятельства, требующие индивидуальной проверки. Файл и печатная версия будут помечены как черновик и не должны подаваться без проверки.
              </p>
            ) : null}
            <div className="mt-4 border-t border-emerald-200 pt-4">
              <p className="font-semibold">Приложения:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {review.decision.attachments.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            {review.decision.additionalDocuments.length ? (
              <div className="mt-4 border-t border-emerald-200 pt-4">
                <p className="font-semibold">Дополнительные документы только по вашим ответам:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {review.decision.additionalDocuments.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {review?.decision.allowed && review.missing.length === 0 && scenarioKey === "registry-divorce" ? (
        <div className="mt-5 grid gap-4 rounded-lg border border-line bg-zinc-50 p-4">
          <h3 className="font-semibold text-ink">Сведения для переноса в официальный бланк</h3>
          <PreparedValues values={review.values} />
          <a href="https://publication.pravo.gov.ru/Document/View/0001201810030017" target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center rounded-md border border-line bg-white px-4 py-2 font-semibold text-trust hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
            Открыть официальные формы
          </a>
        </div>
      ) : null}

      {hasDraft && review ? (
        <section className="mt-6 rounded-lg border border-line bg-zinc-50 p-4">
          <h3 className="text-xl font-semibold text-ink">Редактируемое превью</h3>
          <textarea
            aria-label="Текст подготовленного документа"
            className="mt-4 min-h-[32rem] w-full rounded-md border border-line bg-white p-4 font-mono text-sm leading-6 text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"
            value={draftPreview}
            onChange={(event) => setDraftPreview(event.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={copyDraft} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
              {copied ? "Текст скопирован" : "Копировать текст"}
            </button>
            <button type="button" onClick={downloadDocx} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
              {review.decision.filingReady ? "Скачать DOCX" : "Скачать черновик DOCX"}
            </button>
            <button type="button" onClick={printDraft} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
              Печатная версия
            </button>
          </div>
          {downloadError ? <p className="mt-3 text-sm text-rose-700">{downloadError}</p> : null}
        </section>
      ) : null}

      {review?.decision.allowed && supplementalDrafts.length ? (
        <section className="mt-6">
          <h3 className="text-xl font-semibold text-ink">Дополнительные документы</h3>
          <div className="mt-4 grid gap-3">
            {supplementalDrafts.map((draft, index) => (
              <details key={draft.title} className="rounded-lg border border-line bg-white px-4 shadow-sm">
                <summary className="flex min-h-11 cursor-pointer items-center py-3 font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">{draft.title}</summary>
                <textarea aria-label={draft.title} className="mb-3 min-h-72 w-full rounded-md border border-line bg-zinc-50 p-4 font-mono text-sm leading-6 text-ink" value={draft.text} onChange={(event) => setSupplementalDraft(index, event.target.value)} />
                <button type="button" onClick={() => navigator.clipboard.writeText(draft.text)} className="mb-4 inline-flex min-h-11 items-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
                  Копировать документ
                </button>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {hasDraft ? (
        <div className="mt-6 border-t border-line pt-5">
          <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
            Проверить документ у юриста
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function HelperField({ courtLevel, field, onChange, value }: {
  courtLevel: CourtLevel;
  field: DivorcePropertyHelperField;
  onChange: (name: string, value: string) => void;
  value: string;
}) {
  const fieldId = `divorce-property-${field.name}`;
  const label = field.name === "courtName"
    ? courtLevel === "magistrate"
      ? "Номер и официальное наименование мирового судебного участка"
      : "Официальное наименование районного или городского суда"
    : field.label;

  return (
    <div className="grid gap-2 text-sm font-semibold text-ink">
      <label htmlFor={fieldId}>{label}{field.required ? <span className="text-rose-600"> *</span> : null}</label>
      {field.type === "court-region" ? (
        <>
          <input id={fieldId} name={field.name} list="court-regions" required={field.required} value={value} placeholder="Начните вводить регион" onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
          <datalist id="court-regions">
            {COURT_REGIONS.map((region) => <option key={region} value={region} />)}
          </datalist>
        </>
      ) : field.type === "textarea" ? (
        <textarea id={fieldId} name={field.name} required={field.required} rows={3} value={value} placeholder={field.placeholder} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-24 w-full rounded-md border border-line bg-white px-3 py-3 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
      ) : field.type === "select" ? (
        <select id={fieldId} name={field.name} required={field.required} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20">
          <option value="">Выберите вариант</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input id={fieldId} name={field.name} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "0.01" : undefined} required={field.required} value={value} placeholder={field.placeholder} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
      )}
    </div>
  );
}

function CourtLookupNotice({ courtLevel }: { courtLevel: CourtLevel }) {
  return (
    <div className="mb-5 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      <p className="font-semibold">Предварительный уровень суда: {courtLevelLabel(courtLevel)}.</p>
      <p className="mt-2">{COURT_DIRECTORY.notice}</p>
      <a href={COURT_DIRECTORY.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">
        Найти суд по территориальной подсудности
      </a>
      <p className="mt-2 text-xs">Источник: {COURT_DIRECTORY.sourceName}. Проверено {COURT_DIRECTORY.lastVerifiedAt}.</p>
    </div>
  );
}

function PropertyAssetEditor({
  onAdd,
  onChange,
  onRemove,
  rows
}: {
  onAdd: () => void;
  onChange: (id: string, name: keyof PropertyAssetRow, value: string) => void;
  onRemove: (id: string) => void;
  rows: PropertyAssetRow[];
}) {
  const calculation = calculatePropertyAssets(rows);

  return (
    <section className="min-w-0 border-t border-line pt-5">
      <h3 className="text-xl font-semibold text-ink">Построчный расчёт имущества</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700">Цена иска рассчитывается из стоимости долей, которые просит получить истец, и денежной компенсации в его пользу. Суд вправе уточнить цену при явном несоответствии стоимости.</p>
      <div className="mt-4 grid gap-4">
        {rows.map((row, index) => (
          <fieldset key={row.id} className="min-w-0 rounded-lg border border-line p-4">
            <legend className="px-2 font-semibold text-ink">Объект {index + 1}</legend>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <AssetInput label="Вид и описание имущества" name="description" row={row} onChange={onChange} />
              <AssetInput label="Кадастровый номер, VIN или иной идентификатор" name="identifier" row={row} onChange={onChange} />
              <AssetInput label="Дата и основание приобретения" name="acquisitionBasis" row={row} onChange={onChange} />
              <AssetInput label="На кого оформлено имущество" name="registeredOwner" row={row} onChange={onChange} />
              <AssetInput label="Стоимость всего объекта, руб." name="fullValue" row={row} onChange={onChange} type="number" />
              <AssetInput label="Доля, требуемая истцом, %" name="claimedSharePercent" row={row} onChange={onChange} type="number" />
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-ink">
                Требуемый результат
                <select required value={row.requestedResult} onChange={(event) => onChange(row.id, "requestedResult", event.target.value)} className="min-h-11 min-w-0 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20">
                  <option value="">Выберите вариант</option>
                  <option value="plaintiff">Передать объект истцу</option>
                  <option value="shared">Определить долю истца</option>
                  <option value="defendant">Передать объект ответчику</option>
                  <option value="exclude">Исключить объект из общего имущества</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-ink">
                Денежная компенсация
                <select required value={row.compensationDirection} onChange={(event) => onChange(row.id, "compensationDirection", event.target.value)} className="min-h-11 min-w-0 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20">
                  <option value="">Выберите вариант</option>
                  <option value="none">Не требуется</option>
                  <option value="to-plaintiff">В пользу истца</option>
                  <option value="from-plaintiff">В пользу ответчика</option>
                </select>
              </label>
              {row.compensationDirection && row.compensationDirection !== "none" ? (
                <AssetInput label="Сумма компенсации, руб." name="compensationAmount" row={row} onChange={onChange} type="number" />
              ) : null}
            </div>
            <button type="button" disabled={rows.length === 1} onClick={() => onRemove(row.id)} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-rose-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:text-zinc-400">
              Удалить объект
            </button>
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
          Добавить объект
        </button>
        <p className="text-sm font-semibold text-ink">Предварительная цена иска: {formatMoney(calculation.claimPrice)} руб.</p>
      </div>
    </section>
  );
}

function AssetInput({
  label,
  name,
  onChange,
  row,
  type = "text"
}: {
  label: string;
  name: keyof PropertyAssetRow;
  onChange: (id: string, name: keyof PropertyAssetRow, value: string) => void;
  row: PropertyAssetRow;
  type?: "text" | "number";
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-ink">
      {label}
      <input type={type} min={name === "claimedSharePercent" ? 0 : type === "number" ? 0.01 : undefined} max={name === "claimedSharePercent" ? 100 : undefined} step={type === "number" ? "0.01" : undefined} required value={row[name]} onChange={(event) => onChange(row.id, name, event.target.value)} className="min-h-11 min-w-0 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
    </label>
  );
}

function createEmptyAssetRow(): PropertyAssetRow {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `asset-${Date.now()}-${Math.random()}`,
    description: "",
    identifier: "",
    acquisitionBasis: "",
    registeredOwner: "",
    fullValue: "",
    claimedSharePercent: "",
    requestedResult: "",
    compensationDirection: "",
    compensationAmount: ""
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, " ");
}

function PreparedValues({ values }: { values: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-3">
      {values.map((item) => (
        <div key={item.label}>
          <dt className="font-semibold text-ink">{item.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function fieldValueLabel(field: DivorcePropertyHelperField, rawValue: string) {
  const selectedLabel = field.type === "select"
    ? field.options?.find((option) => option.value === rawValue)?.label
    : undefined;
  return (selectedLabel ?? rawValue).trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
