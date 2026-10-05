"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { LegalReviewLawyers } from "@/components/lawyers/LegalReviewLawyers";
import type { LaborLegalRule } from "@/data/labor-legal-sources";
import type { LaborRoute } from "@/data/labor-routes";
import { resolveLaborResult } from "@/data/labor-routes";

export function LaborScenarioFlow({ route, initialScenario, rules }: { route: LaborRoute; initialScenario?: string; rules: LaborLegalRule[] }) {
  const [scenarioKey, setScenarioKey] = useState(initialScenario ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const result = useMemo(() => scenarioKey ? resolveLaborResult(route, scenarioKey, answers) : null, [route, scenarioKey, answers]);
  const scenario = result?.scenario;

  function chooseScenario(key: string) {
    setScenarioKey(key);
    setAnswers({});
    setShowResult(false);
    history.replaceState(null, "", `?scenario=${encodeURIComponent(key)}`);
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

  return (
    <div className="mt-8">
      <button type="button" onClick={() => chooseScenario("")} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Изменить ситуацию</button>
      <section className="mt-5 border-t border-line pt-6" aria-labelledby="clarifications-title">
        <h2 id="clarifications-title" className="text-2xl font-semibold text-ink">Уточните обстоятельства</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">Укажите только подтвержденные сведения. Не добавляйте данные, которые не нужны для этой трудовой ситуации.</p>
        <div className="mt-5 grid gap-5">
          {scenario.questions.map((question, index) => (
            <label key={question} className="grid gap-2 font-semibold text-ink">
              {question}
              <textarea value={answers[question] ?? ""} onChange={(event) => { setAnswers((current) => ({ ...current, [question]: event.target.value })); setShowResult(false); }} rows={2} className="w-full rounded-md border border-line px-3 py-3 font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" aria-describedby={`labor-answer-${index}`} />
              <span id={`labor-answer-${index}`} className="text-xs font-normal text-zinc-500">Кратко, по документам или переписке.</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={() => setShowResult(true)} className="mt-6 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-trust/30">Получить порядок действий</button>
      </section>

      {showResult && result ? (
        <section className="mt-8 border-t border-line pt-6" aria-live="polite" aria-labelledby="labor-result-title">
          <div className={`border-l-4 p-4 ${result.status === "NEEDS_FACTS" ? "border-amber-400 bg-amber-50 text-amber-950" : "border-trust bg-emerald-50 text-emerald-950"}`}>
            <div className="flex gap-3">
              {result.status === "NEEDS_FACTS" ? <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />}
              <div><h2 id="labor-result-title" className="text-xl font-semibold">{scenario.resultTitle}</h2><p className="mt-2 text-sm leading-6">{result.status === "NEEDS_FACTS" ? "Для персонального результата заполните недостающие сведения. Пока доступен общий безопасный порядок действий." : "Сведения собраны. Результат остается предварительным до проверки документа, срока, адресата и приложений."}</p></div>
            </div>
          </div>

          <section className="mt-6"><h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3><dl className="mt-4 grid gap-3">{scenario.questions.map((question) => <div key={question} className="border-l-2 border-line pl-3"><dt className="font-semibold text-ink">{question}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{answers[question]?.trim() || "Не указано"}</dd></div>)}</dl></section>
          <button type="button" onClick={() => { setShowResult(false); document.getElementById("clarifications-title")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-5 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Редактировать сведения</button>

          <section className="mt-7 border-t border-line pt-6"><h3 className="text-xl font-semibold text-ink">Что делать дальше</h3><ol className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">{scenario.nextSteps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {scenario.deadline ? <Info title="Срок" text={scenario.deadline} /> : null}
            {scenario.payments ? <Info title="Выплаты" text={scenario.payments} /> : null}
            {scenario.stateDuty ? <Info title="Госпошлина" text={scenario.stateDuty} /> : null}
            <Info title="Куда обращаться" text={scenario.authority.join(", ")} />
            {scenario.jurisdiction ? <Info title="Подсудность" text={scenario.jurisdiction} /> : null}
          </div>

          <section className="mt-7 border-t border-line pt-6"><div className="flex items-center gap-2"><Scale className="h-5 w-5 text-trust" aria-hidden="true" /><h3 className="text-xl font-semibold text-ink">Правовые основания</h3></div><div className="mt-4 grid gap-4">{rules.map((item) => <article key={item.id} className="border-l-2 border-line pl-4"><p className="font-semibold leading-7 text-ink">{item.statement}</p><p className="mt-1 text-sm leading-6 text-zinc-600">{item.act}, {item.provisions.join(", ")}. {item.scope}</p><p className="mt-1 text-xs leading-5 text-zinc-500">Ограничение: {item.limitations}</p><a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:ring-2 focus:ring-trust/30">Официальный источник</a></article>)}</div></section>

          {scenario.documentSlug && result.status === "PREPARED" ? <section className="mt-7 border-t border-line pt-6"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-trust" aria-hidden="true" /><h3 className="text-xl font-semibold text-ink">Подготовить документ</h3></div><p className="mt-2 text-sm leading-6 text-zinc-700">Перенесите подтвержденные сведения в документ и проверьте его перед отправкой.</p><Link href={`/documents/${scenario.documentSlug}/`} className="mt-4 inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white focus:ring-2 focus:ring-trust/30">Открыть документ</Link></section> : null}
          <LegalReviewLawyers context={{ route: `/problems/trudovoe-pravo/${route.slug}/`, scenario: scenario.key, documentTitle: scenario.resultTitle }} serviceSlug="trudovye-spory" />
        </section>
      ) : null}
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return <section className="border-t border-line pt-4"><h3 className="font-semibold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p></section>;
}
