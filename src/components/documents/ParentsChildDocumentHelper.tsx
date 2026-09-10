"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { getParentsChildRules } from "@/data/parents-child-legal-review";
import { PARENTS_CHILD_SCENARIOS } from "@/data/parents-child-route";
import type { ParentsChildChangeSubject, ParentsChildField, ParentsChildScenarioKey } from "@/data/parents-child-route";
import { createParentsChildDocxBlob, getParentsChildDocxFilename } from "@/lib/parents-child-docx";
import { createParentsChildPdfBlob, getParentsChildPdfFilename } from "@/lib/parents-child-pdf";
import { getVisibleParentsChildFields, validateParentsChildApplication } from "@/lib/parents-child-validator";
import type { ParentsChildDecision, ParentsChildValues } from "@/lib/parents-child-validator";

export function ParentsChildDocumentHelper({ scenarioKey }: { scenarioKey: ParentsChildScenarioKey }) {
  const scenario = PARENTS_CHILD_SCENARIOS[scenarioKey];
  const [values, setValues] = useState<ParentsChildValues>({});
  const [step, setStep] = useState(0);
  const [decision, setDecision] = useState<ParentsChildDecision | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const fields = useMemo(() => getVisibleParentsChildFields(scenarioKey, values), [scenarioKey, values]);
  const safeStep = Math.min(step, Math.max(fields.length - 1, 0));
  const field = fields[safeStep];
  const canAdvance = !field?.required || Boolean(values[field.name]?.trim());
  const changeSubject = values.changeSubject === "residence" || values.changeSubject === "communication" ? values.changeSubject as ParentsChildChangeSubject : undefined;
  const applicableRules = getParentsChildRules(scenarioKey, changeSubject, decision?.resultKind === "agreement" ? "voluntary" : decision ? "court" : undefined);

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setDecision(null);
    setDraft("");
    setMessage("");
  }

  function advance(event: FormEvent) {
    event.preventDefault();
    if (!field || !canAdvance) return;
    if (safeStep < fields.length - 1) {
      setStep(safeStep + 1);
      return;
    }
    const result = validateParentsChildApplication(scenarioKey, values);
    setDecision(result);
    setDraft(result.draftText);
  }

  function goBack() {
    if (decision) {
      setDecision(null);
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  }

  async function downloadPdf() {
    if (!decision) return;
    try {
      const blob = await createParentsChildPdfBlob({ ...decision, draftText: draft });
      downloadBlob(blob, getParentsChildPdfFilename(decision.outcomeKey));
      setMessage("PDF сформирован. Проверьте статус готовности на первой странице.");
    } catch {
      setMessage("PDF не сформирован. Попробуйте ещё раз.");
    }
  }

  async function downloadDocx() {
    if (!draft) return;
    try {
      downloadBlob(await createParentsChildDocxBlob(draft), getParentsChildDocxFilename(scenario.documentSlug));
      setMessage("DOCX сформирован с обязательной маркировкой.");
    } catch {
      setMessage("DOCX не сформирован. Текст доступен для копирования.");
    }
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setMessage("Текст скопирован вместе с маркировкой.");
  }

  function printDraft() {
    if (!draft) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return setMessage("Браузер заблокировал печатное окно.");
    printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Документ</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;white-space:pre-wrap;line-height:1.5;color:#111}@media print{body{margin:20mm}}</style></head><body>${escapeHtml(draft)}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <section id="fill-online" className="scroll-mt-24 border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Подготовка результата</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{scenario.mainDocument}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">Ответы обрабатываются по заранее заданным правилам. Помощник не дописывает факты, мнение ребёнка, заключение органа опеки или реквизиты суда.</p>

      {!decision && field ? (
        <form className="mt-6" onSubmit={advance}>
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-zinc-600"><span>Вопрос {safeStep + 1} из {fields.length}</span><span>{Math.round(((safeStep + 1) / fields.length) * 100)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true"><div className="h-full bg-trust" style={{ width: `${((safeStep + 1) / fields.length) * 100}%` }} /></div>
          <div className="mt-6"><HelperField field={field} value={values[field.name] ?? ""} onChange={setField} /></div>
          <div className="mt-6 flex flex-wrap gap-3">
            {safeStep > 0 ? <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Назад</button> : null}
            <button type="submit" disabled={!canAdvance} className="inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30 disabled:opacity-60">{safeStep === fields.length - 1 ? "Подготовить документ" : "Продолжить"}</button>
          </div>
        </form>
      ) : null}

      {decision?.resultKind === "urgent" ? (
        <div className="mt-6 border-l-4 border-red-600 bg-red-50 p-5 text-red-950" aria-live="assertive">
          <p className="text-sm font-semibold uppercase">Срочная ситуация</p>
          <h3 className="mt-2 text-2xl font-semibold">Не откладывайте обращение ради документа</h3>
          <p className="mt-3 text-sm leading-6">{decision.notices[0]}</p>
          <ol className="mt-4 grid gap-2 text-sm leading-6">{decision.filingSteps.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol>
          <a href="tel:112" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-red-700 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500/40">Позвонить 112</a>
        </div>
      ) : null}

      {decision && decision.resultKind !== "urgent" ? (
        <div className="mt-6" aria-live="polite">
          <div className={`border p-4 text-sm leading-6 ${decision.filingReady ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950"}`}>
            <p className="font-semibold">{decision.resultLabel}</p>
            <p className="mt-2"><strong>Результат:</strong> {decision.documentTitle}</p>
            <p className="mt-2">{decision.filingReady ? "Результат можно использовать по инструкции после проверки данных." : "Результат нельзя считать готовым к подаче."}</p>
            {decision.notices.map((notice) => <p key={notice} className="mt-2">{notice}</p>)}
            {decision.issues.length ? <ul className="mt-3 list-disc pl-5">{decision.issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}</ul> : null}
          </div>

          {decision.preparedData.length ? <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3><dl className="mt-3 grid gap-3 text-sm leading-6">{decision.preparedData.map((item) => <div key={item.label} className="border-l-2 border-line pl-3"><dt className="font-semibold text-ink">{item.label}</dt><dd className="whitespace-pre-wrap text-zinc-700">{item.value}</dd></div>)}</dl></section> : null}

          <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Что делать дальше</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{decision.filingSteps.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol></section>

          <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Применимые правовые основания</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{applicableRules.map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.norm}</a><span className="block text-xs leading-5 text-zinc-600">{rule.scope}</span></li>)}</ul></section>

          {draft && !decision.issues.length ? <section className="mt-6 border border-amber-300 bg-amber-50 p-4"><p className="font-semibold text-amber-950">{decision.resultKind === "agreement" ? "ПРОЕКТ СОГЛАШЕНИЯ" : "ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ"}</p><textarea aria-label="Текст подготовленного результата" value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-4 min-h-[28rem] w-full border border-line bg-white p-4 font-mono text-sm leading-6 text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={copyDraft} className="min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold">Копировать</button><button type="button" onClick={downloadDocx} className="min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold">Скачать DOCX</button><button type="button" onClick={printDraft} className="min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold">Печать</button></div></section> : null}

          {decision.pdfAvailable ? <section className="mt-6 border-t border-line pt-6"><h3 className="text-xl font-semibold text-ink">Итоговый результат</h3><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30"><Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF</button><Link href="/questions/#question" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust focus:outline-none focus:ring-2 focus:ring-trust/30"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Проверить у юриста</Link></div>{message ? <p className="mt-3 text-sm text-zinc-700" role="status">{message}</p> : null}</section> : null}
          <button type="button" onClick={goBack} className="mt-6 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Изменить ответы</button>
        </div>
      ) : null}
    </section>
  );
}

function HelperField({ field, value, onChange }: { field: ParentsChildField; value: string; onChange: (name: string, value: string) => void }) {
  const id = `parents-child-${field.name}`;
  return <div className="grid gap-2 text-sm font-semibold text-ink"><label htmlFor={id}>{field.label}{field.required ? <span className="sr-only"> (обязательно)</span> : null}</label>{field.type === "select" ? <select id={id} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"><option value="">Выберите вариант</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "textarea" ? <textarea id={id} rows={5} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-32 w-full rounded-md border border-line bg-white px-3 py-3 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /> : <input id={id} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />}{field.hint ? <span className="text-xs font-normal leading-5 text-zinc-600">{field.hint}</span> : null}</div>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] ?? character));
}
