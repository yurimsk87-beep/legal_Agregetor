"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { INTERNATIONAL_FAMILY_DISPUTES_KEYS, INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS, type InternationalFamilyDisputesKey } from "@/data/international-family-disputes-route";
import { createInternationalFamilyDisputesPdfBlob } from "@/lib/international-family-disputes-pdf";
import { validateInternationalFamilyDisputes, type InternationalFamilyDisputesDecision, type InternationalFamilyDisputesValues } from "@/lib/international-family-disputes-validator";

export function InternationalFamilyDisputesHelper({ initialKey }: { initialKey?: InternationalFamilyDisputesKey }) {
  const [key, setKey] = useState<InternationalFamilyDisputesKey | "">(initialKey ?? "");
  const [values, setValues] = useState<InternationalFamilyDisputesValues>({});
  const [decision, setDecision] = useState<InternationalFamilyDisputesDecision | null>(null);
  const [message, setMessage] = useState("");
  const scenario = key ? INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[key] : null;
  function update(name: string, value: string) { setValues((current) => ({ ...current, [name]: value })); setDecision(null); setMessage(""); }
  async function download() {
    if (!decision?.pdfAvailable) return;
    try {
      const blob = await createInternationalFamilyDisputesPdfBlob(decision); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `international-family-dispute-${key}.pdf`; anchor.click(); URL.revokeObjectURL(url);
      setMessage("Лист скачан. До любого обращения нужна международная юридическая проверка.");
    } catch { setMessage("Не удалось сформировать PDF. Попробуйте ещё раз."); }
  }
  return <section id="fill-online" className="scroll-mt-24 border border-line bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-2xl font-semibold text-ink">Подготовить сведения</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-700">Результат — лист для юриста, не заявление и не процессуальный документ.</p>
    <div className="mt-5 grid gap-2"><label htmlFor="international-family-scenario" className="text-sm font-semibold text-ink">Что вам нужно сделать?</label>
      <select id="international-family-scenario" value={key} onChange={(event) => { setKey(event.target.value as InternationalFamilyDisputesKey | ""); setValues({}); setDecision(null); }} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base focus:ring-2 focus:ring-trust/30">
        <option value="">Выберите ситуацию</option>{INTERNATIONAL_FAMILY_DISPUTES_KEYS.map((item) => <option value={item} key={item}>{INTERNATIONAL_FAMILY_DISPUTES_SCENARIOS[item].title}</option>)}
      </select></div>
    {scenario ? <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); setDecision(validateInternationalFamilyDisputes(scenario.key, values)); }}>
      {scenario.questions.map((field) => <div key={field.name} className="grid gap-2"><label htmlFor={`international-family-${field.name}`} className="text-sm font-semibold text-ink">{field.label}</label>
        {field.type === "select" ? <select id={`international-family-${field.name}`} value={values[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base focus:ring-2 focus:ring-trust/30" required>
          <option value="">Выберите вариант</option>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select> : <textarea id={`international-family-${field.name}`} value={values[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} rows={3} className="min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-base focus:ring-2 focus:ring-trust/30" required />}
      </div>)}<button type="submit" className="inline-flex min-h-11 w-fit items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-trust/30">Получить чек-лист</button>
    </form> : null}
    {decision ? <div className="mt-6 border-t border-line pt-5" aria-live="polite"><h3 className="text-xl font-semibold text-ink">{decision.resultLabel}</h3>
      <p className="mt-2 text-sm font-semibold text-amber-900">Готово к подаче: нет. Юридическая проверка обязательна.</p>
      {decision.issues.map((issue) => <p key={issue.field} className="mt-2 text-sm text-red-800">{issue.message}</p>)}
      {decision.notices.map((notice) => <p key={notice} className="mt-2 text-sm leading-6 text-zinc-700">{notice}</p>)}
      {decision.outcomeKey === "urgent-child-safety-abroad" ? <div className="mt-5 border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-950"><p className="font-semibold">Немедленное действие</p><p className="mt-2">Если ребёнок в России и угроза существует сейчас, позвоните <a href="tel:112" className="font-bold underline">112</a>. За рубежом используйте местную экстренную службу.</p><p className="mt-2">Не ждите подготовки документа.</p></div> : null}
      {decision.pdfAvailable ? <><h4 className="mt-5 font-semibold text-ink">Что собрать</h4><ul className="mt-2 grid gap-2 text-sm leading-6 text-zinc-700">{decision.evidence.map((item) => <li key={item}>- {item}</li>)}</ul>
        <h4 className="mt-5 font-semibold text-ink">Что делать дальше</h4><ol className="mt-2 grid gap-2 text-sm leading-6 text-zinc-700">{decision.nextSteps.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol>
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={download} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-trust/30"><Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF</button>
          <Link href="/questions/#question" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust focus:ring-2 focus:ring-trust/30"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Проверить у юриста</Link></div></> : null}
      {message ? <p role="status" className="mt-3 text-sm text-zinc-700">{message}</p> : null}
    </div> : null}
  </section>;
}
