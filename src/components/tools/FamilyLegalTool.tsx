"use client";

import { useMemo, useState } from "react";
import { ExternalLink, RotateCcw } from "lucide-react";
import { OfficialServiceHelp } from "@/components/forms/OfficialServiceHelp";
import type { OfficialServiceKind } from "@/data/official-service-links";
import type { FamilyToolDefinition } from "@/data/family-tools";
import { calculateAlimonyShare, calculateClaimPrice, calculatePreliminaryAlimonyDebt, determineAlimonyProcedure } from "@/lib/family-tools";
import { calculateFamilyStateDuty, type FamilyStateDutyClaimType, type FamilyStateDutyResult } from "@/lib/family-state-duty";

const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 });

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold text-ink">{label}<input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-line bg-white px-3 py-2 font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></label>;
}

function Choice({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-800"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5" />{label}</label>;
}

export function FamilyLegalTool({ tool }: { tool: FamilyToolDefinition }) {
  const [first, setFirst] = useState(""); const [second, setSecond] = useState(""); const [third, setThird] = useState("");
  const [flagA, setFlagA] = useState(false); const [flagB, setFlagB] = useState(false); const [flagC, setFlagC] = useState(false);
  const stateDutyResult = useMemo(() => tool.slug === "family-state-duty" && third
    ? calculateFamilyStateDuty(third as FamilyStateDutyClaimType, Number(first))
    : null, [first, third, tool.slug]);
  const result = useMemo(() => {
    const a = Number(first); const b = Number(second);
    if (tool.slug === "claim-price") { const total = calculateClaimPrice([a, b, Number(third || 0)]); return total === null ? null : { title: "Предварительная цена иска", text: money.format(total) }; }
    if (tool.slug === "alimony-shares") { const estimate = calculateAlimonyShare(a, Number(second)); return estimate ? { title: "Ориентир по доле", text: `${estimate.share === 0.25 ? "1/4" : estimate.share === 0.5 ? "1/2" : "1/3"}, или ${money.format(estimate.amount)} от указанного дохода` } : null; }
    if (tool.slug === "alimony-debt-estimate") { const debt = calculatePreliminaryAlimonyDebt(a, b); return debt === null ? null : { title: "Предварительная разница", text: money.format(debt) }; }
    if (tool.slug === "order-or-claim") { const procedure = determineAlimonyProcedure({ percentageOnly: flagA, hasPaternityDispute: flagB, hasOtherRecipients: flagC, hasOtherDispute: third === "yes" }); return procedure === "order" ? { title: "Возможен приказной порядок", text: "Проверьте подсудность, приложения и отсутствие иных препятствий к выдаче приказа." } : { title: "Нужен исковой порядок", text: "Обнаружено обстоятельство, которое нельзя безопасно включить в упрощённый результат." }; }
    return null;
  }, [first, flagA, flagB, flagC, second, third, tool.slug]);
  function reset() { setFirst(""); setSecond(""); setThird(""); setFlagA(false); setFlagB(false); setFlagC(false); }
  return <div className="mt-8 grid gap-6"><section className="border border-line bg-white p-5 sm:p-6">
    {tool.slug === "family-state-duty" ? <div className="grid min-w-0 gap-4"><label className="grid min-w-0 gap-2 text-sm font-semibold">Вид требования<select value={third} onChange={(event) => setThird(event.target.value)} className="min-h-11 min-w-0 w-full rounded-md border border-line px-3 font-normal"><option value="">Выберите</option><option value="divorce">Расторжение брака</option><option value="property">Имущественный иск, подлежащий оценке</option><option value="non-property">Неимущественный семейный спор</option><option value="alimony">Взыскание алиментов истцом</option><option value="divorce-property">Расторжение брака и раздел имущества</option><option value="other-mixed">Иной набор требований</option></select></label>{third === "property" || third === "divorce-property" ? <NumberField label="Цена имущественного требования, руб." value={first} onChange={setFirst} /> : null}</div> : null}
    {tool.slug === "claim-price" ? <div className="grid gap-4 sm:grid-cols-3"><NumberField label="Стоимость имущества" value={first} onChange={setFirst} /><NumberField label="Денежная компенсация" value={second} onChange={setSecond} /><NumberField label="Иные оцениваемые требования" value={third} onChange={setThird} /></div> : null}
    {tool.slug === "alimony-shares" ? <div className="grid min-w-0 gap-4 sm:grid-cols-2"><NumberField label="Ежемесячный доход, руб." value={first} onChange={setFirst} /><label className="grid min-w-0 gap-2 text-sm font-semibold">Количество детей<select value={second} onChange={(event) => setSecond(event.target.value)} className="min-h-11 min-w-0 w-full rounded-md border border-line px-3 font-normal"><option value="">Выберите</option><option value="1">Один</option><option value="2">Двое</option><option value="3">Трое и более</option></select></label></div> : null}
    {tool.slug === "alimony-debt-estimate" ? <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Начислено за период, руб." value={first} onChange={setFirst} /><NumberField label="Уплачено за период, руб." value={second} onChange={setSecond} /></div> : null}
    {tool.slug === "order-or-claim" ? <div className="grid gap-2"><Choice label="Требование только о взыскании алиментов в долях" checked={flagA} onChange={setFlagA} /><Choice label="Есть спор об отцовстве" checked={flagB} onChange={setFlagB} /><Choice label="Алименты уже взыскиваются в пользу другого лица" checked={flagC} onChange={setFlagC} /><Choice label="Есть иной спор или дополнительные требования" checked={third === "yes"} onChange={(value) => setThird(value ? "yes" : "")} /></div> : null}
    {tool.slug === "notary-costs" ? <div className="grid gap-4 text-sm leading-6 text-zinc-700"><p>Единый нотариальный тариф состоит из федеральной и региональной частей. Региональная часть зависит от субъекта РФ и действия, поэтому здесь не рассчитывается.</p><OfficialServiceHelp kind="notary" /><a href={tool.sources[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-trust underline underline-offset-4">Проверить тариф на сайте ФНП <ExternalLink className="h-4 w-4" /></a></div> : null}
    {tool.slug === "court-finder" ? <div className="grid gap-4 text-sm leading-6 text-zinc-700"><p>Определите вид и уровень суда, затем найдите суд по полному адресу. Перенесите в документ официальное наименование и адрес только со страницы суда.</p><OfficialServiceHelp kind="court" /></div> : null}
    {tool.slug === "family-document-check" ? <div className="grid gap-2"><Choice label="Документ подписан надлежащим лицом" checked={flagA} onChange={setFlagA} /><Choice label="Есть подтверждающие документы и копии для участников" checked={flagB} onChange={setFlagB} /><Choice label="Проверены адресат, подсудность и способ подачи" checked={flagC} onChange={setFlagC} /><p className="mt-3 text-sm font-semibold">Проверено: {[flagA, flagB, flagC].filter(Boolean).length} из 3. Это общий чек-лист, а не подтверждение готовности конкретного документа.</p></div> : null}
    {tool.slug === "where-to-file" ? <div className="grid min-w-0 gap-3"><label className="grid min-w-0 gap-2 text-sm font-semibold">Что требуется<select value={third} onChange={(event) => setThird(event.target.value)} className="min-h-11 min-w-0 w-full rounded-md border border-line px-3 font-normal"><option value="">Выберите</option><option value="zags">Зарегистрировать акт гражданского состояния</option><option value="notary">Удостоверить соглашение или сделку</option><option value="court">Разрешить семейный спор</option><option value="fssp">Исполнить судебный акт</option><option value="guardianship">Обратиться в орган опеки</option></select></label>{officialKindForFiling(third) ? <OfficialServiceHelp kind={officialKindForFiling(third) as OfficialServiceKind} /> : null}</div> : null}
    {stateDutyResult ? <StateDutyResultCard result={stateDutyResult} /> : null}
    {result ? <div className="mt-6 border-l-4 border-trust bg-blue-50 p-4" role="status"><p className="font-semibold text-ink">{result.title}</p><p className="mt-2 text-sm leading-6 text-zinc-700">{result.text}</p></div> : null}
    <button type="button" onClick={reset} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold"><RotateCcw className="h-4 w-4" /> Сбросить</button>
  </section><section className="border-t border-line pt-5"><h2 className="text-xl font-semibold text-ink">Правовые источники</h2><ul className="mt-3 grid gap-3">{tool.sources.map((source) => <li key={`${source.norm}-${source.url}`} className="text-sm leading-6"><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-trust underline underline-offset-4">{source.title}: {source.norm}</a><span className="block text-zinc-600">Тип: {source.sourceType === "primary" ? "официальный первичный" : "secondary"}. Проверено {source.checkedAt}. {source.limitation}</span></li>)}</ul></section></div>;
}

function officialKindForFiling(value: string): OfficialServiceKind | null {
  return (["court", "notary", "fssp", "zags", "guardianship"] as const).find((kind) => kind === value) ?? null;
}

function StateDutyResultCard({ result }: { result: FamilyStateDutyResult }) {
  return <div className="mt-6 border-l-4 border-trust bg-blue-50 p-4 text-sm leading-6 text-zinc-700" role="status">
    <p className="font-semibold text-ink">Итого к оплате: {result.total === null ? "требуется проверка" : money.format(result.total)}{result.benefit ? " - применяется льгота" : ""}</p>
    <dl className="mt-3 grid gap-2">
      <div><dt className="font-semibold text-ink">Тип требования</dt><dd>{result.claimTypeLabel}</dd></div>
      <div><dt className="font-semibold text-ink">Формула</dt><dd>{result.formula}</dd></div>
      {result.priceRange ? <div><dt className="font-semibold text-ink">Диапазон цены иска</dt><dd>{result.priceRange}</dd></div> : null}
      {result.benefit ? <div><dt className="font-semibold text-ink">Льгота</dt><dd>{result.benefit}</dd></div> : null}
      <div><dt className="font-semibold text-ink">Норма</dt><dd>{result.norm}</dd></div>
      <div><dt className="font-semibold text-ink">Проверено</dt><dd>{result.checkedAt}</dd></div>
    </dl>
    {result.components.length > 1 ? <ul className="mt-3 grid gap-1">{result.components.map((component) => <li key={component.label}><strong>{component.label}:</strong> {money.format(component.amount)}. {component.formula}</li>)}</ul> : null}
    <ul className="mt-3 list-disc pl-5">{result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
  </div>;
}
