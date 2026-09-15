"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { getParentalRightsRestrictionRules } from "@/data/parental-rights-restriction-legal-review";
import { PARENTAL_RIGHTS_RESTRICTION_SCENARIOS, type ParentalRightsRestrictionField, type ParentalRightsRestrictionScenarioKey } from "@/data/parental-rights-restriction-route";
import { createParentalRightsRestrictionDocxBlob, getParentalRightsRestrictionDocxFilename } from "@/lib/parental-rights-restriction-docx";
import { createParentalRightsRestrictionPdfBlob, getParentalRightsRestrictionPdfFilename } from "@/lib/parental-rights-restriction-pdf";
import { getVisibleParentalRightsRestrictionFields, validateParentalRightsRestriction } from "@/lib/parental-rights-restriction-validator";
import type { ParentalRightsRestrictionDecision, ParentalRightsRestrictionValues } from "@/lib/parental-rights-restriction-validator";

export function ParentalRightsRestrictionDocumentHelper({ scenarioKey }: { scenarioKey: ParentalRightsRestrictionScenarioKey }) {
  const scenario = PARENTAL_RIGHTS_RESTRICTION_SCENARIOS[scenarioKey];
  const [values, setValues] = useState<ParentalRightsRestrictionValues>({});
  const [step, setStep] = useState(0);
  const [decision, setDecision] = useState<ParentalRightsRestrictionDecision | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const fields = useMemo(() => getVisibleParentalRightsRestrictionFields(scenarioKey, values), [scenarioKey, values]);
  const safeStep = Math.min(step, Math.max(fields.length - 1, 0));
  const field = fields[safeStep];
  const canAdvance = !field?.required || Boolean(values[field.name]?.trim());
  const rules = getParentalRightsRestrictionRules(scenarioKey, decision?.legalPath);

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setDecision(null);
    setDraft("");
    setMessage("");
  }

  function advance(event: FormEvent) {
    event.preventDefault();
    if (!field || !canAdvance) return;
    if (safeStep < fields.length - 1) return setStep(safeStep + 1);
    const result = validateParentalRightsRestriction(scenarioKey, values);
    setDecision(result);
    setDraft(result.draftText);
  }

  function goBack() {
    if (decision) return setDecision(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function downloadPdf() {
    if (!decision) return;
    try {
      downloadBlob(await createParentalRightsRestrictionPdfBlob({ ...decision, draftText: draft }), getParentalRightsRestrictionPdfFilename(decision.outcomeKey));
      setMessage("PDF сформирован. Проверьте предупреждение о готовности на первой странице.");
    } catch {
      setMessage("PDF не сформирован. Попробуйте ещё раз.");
    }
  }

  async function downloadDocx() {
    if (!draft) return;
    try {
      downloadBlob(await createParentalRightsRestrictionDocxBlob(draft), getParentalRightsRestrictionDocxFilename(scenario.documentSlug));
      setMessage("DOCX сформирован с обязательной маркировкой судебного черновика.");
    } catch {
      setMessage("DOCX не сформирован. Используйте PDF или измените ответы.");
    }
  }

  return (
    <section id="fill-online" className="scroll-mt-24 border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Проверка ситуации</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{scenario.mainDocument}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">Сервис разграничивает источники опасности для ребёнка и безопасно останавливает срочные случаи. Он не устанавливает наличие основания и не прогнозирует решение суда.</p>

      {!decision && field ? <form className="mt-6" onSubmit={advance}>
        <div className="mb-4 flex items-center justify-between gap-4 text-sm text-zinc-600"><span>Вопрос {safeStep + 1} из {fields.length}</span><span>{Math.round(((safeStep + 1) / fields.length) * 100)}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true"><div className="h-full bg-trust" style={{ width: `${((safeStep + 1) / fields.length) * 100}%` }} /></div>
        <div className="mt-6"><HelperField field={field} value={values[field.name] ?? ""} onChange={setField} /></div>
        <div className="mt-6 flex flex-wrap gap-3">{safeStep > 0 ? <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Назад</button> : null}<button type="submit" disabled={!canAdvance} className="inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30 disabled:opacity-60">{safeStep === fields.length - 1 ? "Получить результат" : "Продолжить"}</button></div>
      </form> : null}

      {decision ? <div className="mt-6" aria-live="polite">
        <div className={`${decision.resultKind === "emergency" ? "border-red-300 bg-red-50 text-red-950" : "border-amber-300 bg-amber-50 text-amber-950"} border p-4 text-sm leading-6`}><p className="font-semibold">{decision.resultLabel}</p><p className="mt-2"><strong>Результат:</strong> {decision.documentTitle}</p><p className="mt-2">{decision.resultKind === "emergency" ? "Обычная подготовка документа остановлена." : "Результат нельзя считать готовым к подаче."}</p>{decision.notices.map((notice) => <p key={notice} className="mt-2">{notice}</p>)}{decision.issues.length ? <ul className="mt-3 list-disc pl-5">{decision.issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}</ul> : null}</div>
        {decision.preparedData.length ? <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3><dl className="mt-3 grid gap-3 text-sm leading-6">{decision.preparedData.map((item) => <div key={item.label} className="border-l-2 border-line pl-3"><dt className="font-semibold text-ink">{item.label}</dt><dd className="whitespace-pre-wrap text-zinc-700">{item.value}</dd></div>)}</dl></section> : null}
        <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Что делать дальше</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{decision.filingSteps.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol></section>
        <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Применимые правовые основания</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{rules.map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">{rule.norm}</a><span className="block text-xs leading-5 text-zinc-600">{rule.scope}</span></li>)}</ul></section>
        {draft && !decision.issues.length ? <section className="mt-6 border border-amber-300 bg-amber-50 p-4"><p className="font-semibold text-amber-950">{decision.resultLabel}</p><textarea aria-label="Текст судебного черновика" value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-4 min-h-[28rem] w-full border border-line bg-white p-4 font-mono text-sm leading-6 text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /><button type="button" onClick={downloadDocx} className="mt-4 min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold">Скачать DOCX</button></section> : null}
        {decision.pdfAvailable ? <section className="mt-6 border-t border-line pt-6"><h3 className="text-xl font-semibold text-ink">Итоговый результат</h3><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-trust/30"><Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF</button><Link href="/questions/#question" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust focus:outline-none focus:ring-2 focus:ring-trust/30"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Проверить у юриста</Link></div>{message ? <p className="mt-3 text-sm text-zinc-700" role="status">{message}</p> : null}</section> : null}
        <button type="button" onClick={goBack} className="mt-6 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Изменить ответы</button>
      </div> : null}
    </section>
  );
}

function HelperField({ field, value, onChange }: { field: ParentalRightsRestrictionField; value: string; onChange: (name: string, value: string) => void }) {
  const id = `parental-rights-restriction-${field.name}`;
  if (field.type === "searchable") return <div className="grid gap-2 text-sm font-semibold text-ink"><SearchableSelect id={id} label={field.label} value={value} onChange={(next) => onChange(field.name, next)} options={(field.options ?? []).map((option) => ({ id: option.value, label: option.label }))} required={field.required} />{field.hint ? <span className="text-xs font-normal leading-5 text-zinc-600">{field.hint}</span> : null}</div>;
  return <div className="grid gap-2 text-sm font-semibold text-ink"><label htmlFor={id}>{field.label}{field.required ? <span className="sr-only"> (обязательно)</span> : null}</label>{field.type === "select" ? <select id={id} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20"><option value="">Выберите вариант</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "textarea" ? <textarea id={id} rows={5} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-32 w-full rounded-md border border-line bg-white px-3 py-3 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /> : <input id={id} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />}{field.hint ? <span className="text-xs font-normal leading-5 text-zinc-600">{field.hint}</span> : null}</div>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

