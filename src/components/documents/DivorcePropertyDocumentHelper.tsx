"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  DIVORCE_PROPERTY_SCENARIOS
} from "@/data/divorce-property-route";
import type {
  DivorcePropertyHelperField,
  DivorcePropertyScenarioKey
} from "@/data/divorce-property-route";
import {
  isDivorcePropertyFieldVisible,
  validateDivorcePropertyApplication
} from "@/lib/divorce-property-validator";
import type {
  DivorcePropertyDecision,
  DivorcePropertyValues
} from "@/lib/divorce-property-validator";

type ReviewState = {
  decision: DivorcePropertyDecision;
  missing: string[];
  values: Array<{ label: string; value: string }>;
} | null;

export function DivorcePropertyDocumentHelper({ scenarioKey }: { scenarioKey: DivorcePropertyScenarioKey }) {
  const scenario = DIVORCE_PROPERTY_SCENARIOS[scenarioKey];
  const [values, setValues] = useState<DivorcePropertyValues>({});
  const [review, setReview] = useState<ReviewState>(null);
  const [draftPreview, setDraftPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const visibleFields = scenario.helperFields.filter((field) => isDivorcePropertyFieldVisible(scenarioKey, field.name, values));

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setReview(null);
    setDraftPreview("");
    setCopied(false);
    setDownloadError("");
  }

  function reviewFields(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = visibleFields
      .filter((field) => field.required && !values[field.name]?.trim())
      .map((field) => field.label);
    const decision = validateDivorcePropertyApplication(scenarioKey, values);
    const preparedValues = visibleFields
      .map((field) => ({ label: field.label, value: fieldValueLabel(field, values[field.name] ?? "") }))
      .filter((item) => item.value);
    setReview({ decision, missing, values: preparedValues });
    setDraftPreview(decision.allowed ? decision.draftText : "");
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
      const supplementalParagraphs = review.decision.supplementalDrafts.flatMap((draft) => [
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
      anchor.download = `${scenario.documentSlug}.docx`;
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
    printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(review.decision.documentTitle)}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;white-space:pre-wrap;line-height:1.5;color:#111}@media print{body{margin:20mm}}</style></head><body>${escapeHtml(draftPreview)}</body></html>`);
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

      <form className="mt-6 grid gap-5" onSubmit={reviewFields}>
        {visibleFields.map((field) => (
          <HelperField key={field.name} field={field} onChange={setField} value={values[field.name] ?? ""} />
        ))}
        <div>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
            Проверить и подготовить документ
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
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <p className="font-semibold">Проверка завершена.</p>
            <p className="mt-2"><strong>Основной документ:</strong> {review.decision.documentTitle}.</p>
            {review.decision.formNumbers.length ? <p className="mt-1"><strong>Форма:</strong> {review.decision.formNumbers.map((number) => `N ${number}`).join(", ")}.</p> : null}
            <p className="mt-1"><strong>Платёж:</strong> {review.decision.feeLabel}</p>
            <p className="mt-1"><strong>Куда подавать:</strong> {review.decision.jurisdiction}</p>
            <p className="mt-1"><strong>Как подать:</strong> {review.decision.filingInstruction}</p>
            <p className="mt-1"><strong>После подачи:</strong> {review.decision.afterFiling}</p>
            {review.decision.notices.map((notice) => <p key={notice} className="mt-2">{notice}</p>)}
            {review.decision.requiresLegalReview ? (
              <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
                В ответах есть обстоятельства, требующие индивидуальной проверки. Черновик можно использовать для сбора сведений, но не как окончательный документ.
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
              Скачать DOCX
            </button>
            <button type="button" onClick={printDraft} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">
              Печатная версия
            </button>
          </div>
          {downloadError ? <p className="mt-3 text-sm text-rose-700">{downloadError}</p> : null}
        </section>
      ) : null}

      {review?.decision.allowed && review.decision.supplementalDrafts.length ? (
        <section className="mt-6">
          <h3 className="text-xl font-semibold text-ink">Дополнительные документы</h3>
          <div className="mt-4 grid gap-3">
            {review.decision.supplementalDrafts.map((draft) => (
              <details key={draft.title} className="rounded-lg border border-line bg-white px-4 shadow-sm">
                <summary className="flex min-h-11 cursor-pointer items-center py-3 font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">{draft.title}</summary>
                <textarea aria-label={draft.title} className="mb-3 min-h-72 w-full rounded-md border border-line bg-zinc-50 p-4 font-mono text-sm leading-6 text-ink" defaultValue={draft.text} />
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

function HelperField({ field, onChange, value }: {
  field: DivorcePropertyHelperField;
  onChange: (name: string, value: string) => void;
  value: string;
}) {
  const fieldId = `divorce-property-${field.name}`;

  return (
    <div className="grid gap-2 text-sm font-semibold text-ink">
      <label htmlFor={fieldId}>{field.label}{field.required ? <span className="text-rose-600"> *</span> : null}</label>
      {field.type === "textarea" ? (
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
