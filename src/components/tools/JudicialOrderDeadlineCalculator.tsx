"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { judicialOrderDebtRoute } from "@/lib/judicial-order-flow";
import { calculateJudicialOrderDeadline, type JudicialOrderDeadlineResult, type JudicialOrderDeadlineStatus } from "@/lib/judicial-order-deadline";

export function JudicialOrderDeadlineCalculator() {
  const [receivedDate, setReceivedDate] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [unknownReceiptDate, setUnknownReceiptDate] = useState(false);
  const [learnedFromBailiffs, setLearnedFromBailiffs] = useState(false);
  const [alreadyMissed, setAlreadyMissed] = useState(false);

  const result = useMemo(
    () =>
      calculateJudicialOrderDeadline({
        alreadyMissed,
        receivedDateValue: receivedDate,
        unknownReceiptDate
      }),
    [alreadyMissed, receivedDate, unknownReceiptDate]
  );

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-ink">Рассчитать срок подачи возражения</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Основная дата для расчета - день, когда вы получили копию судебного приказа. Дата вынесения приказа сама по себе обычно не запускает десятидневный срок.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Дата получения судебного приказа</span>
              <input
                type="date"
                value={receivedDate}
                disabled={unknownReceiptDate}
                onChange={(event) => setReceivedDate(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-trust disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-ink">Дата вынесения приказа, если известна</span>
              <input
                type="date"
                value={orderDate}
                onChange={(event) => setOrderDate(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-trust"
              />
              {orderDate ? <span className="mt-2 block text-sm leading-6 text-zinc-500">Эта дата нужна для ориентира, но срок возражений обычно считается со дня получения копии приказа.</span> : null}
            </label>

            <div className="grid gap-3 rounded-lg border border-line bg-zinc-50 p-4">
              <CheckboxField checked={unknownReceiptDate} label="Я не помню дату получения" onChange={setUnknownReceiptDate} />
              <CheckboxField checked={learnedFromBailiffs} label="Я узнал о приказе только от приставов" onChange={setLearnedFromBailiffs} />
              <CheckboxField checked={alreadyMissed} label="Срок уже пропущен, хочу понять что делать" onChange={setAlreadyMissed} />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Калькулятор дает ориентировочный расчет и не заменяет консультацию юриста. Учитывается перенос только с субботы или воскресенья на понедельник; праздничные и официальные нерабочие дни отдельно не рассчитываются.
          </div>
        </div>

        <DeadlineResultCard learnedFromBailiffs={learnedFromBailiffs} result={result} />
      </div>
    </section>
  );
}

function DeadlineResultCard({ learnedFromBailiffs, result }: { learnedFromBailiffs: boolean; result: JudicialOrderDeadlineResult }) {
  if (result.status === "unknown") {
    return (
      <ResultShell status="unknown" tone="amber" title="Нужно уточнить дату получения">
        <p>
          Для судебного приказа важна не дата вынесения, а дата, когда вы получили его копию. Без этой даты можно только ориентировочно оценить ситуацию.
        </p>
        <CheckList
          items={[
            "проверьте конверт и почтовое уведомление;",
            "найдите трек-номер письма;",
            "проверьте Госуслуги и электронные уведомления;",
            "ознакомьтесь с материалами дела в суде;",
            "запросите у пристава постановление и основание возбуждения производства."
          ]}
        />
        {learnedFromBailiffs ? <BailiffWarning /> : null}
        <p className="mt-4 text-sm leading-6 text-zinc-600">Основание: ст. 128 ГПК РФ связывает десятидневный срок с получением копии судебного приказа.</p>
        <ResultLinks primaryHref={judicialOrderDebtRoute.canonicalUrl} primaryLabel="Открыть инструкцию" secondaryHref="/questions/" secondaryLabel="Посмотреть Q&A" />
      </ResultShell>
    );
  }

  if (result.status === "missed") {
    return (
      <ResultShell status="missed" tone="red" title="Срок, вероятно, пропущен">
        <p>
          По введенной дате десятидневный срок обычно уже истек. В такой ситуации вместе с возражениями может потребоваться заявление о восстановлении срока.
        </p>
        <DeadlineSummary result={result} />
        {learnedFromBailiffs ? <BailiffWarning /> : null}
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          По ст. 112 ГПК РФ пропущенный процессуальный срок можно просить восстановить, если есть уважительные причины и документы, которые это подтверждают.
        </p>
        <ResultLinks
          primaryHref="/documents/zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza/"
          primaryLabel="Заявление о восстановлении срока"
          secondaryHref="/lawyers/"
          secondaryLabel="Посмотреть юристов"
        />
      </ResultShell>
    );
  }

  if (result.status === "today") {
    return (
      <ResultShell status="today" tone="amber" title="Срок может истечь сегодня">
        <p>
          Обычно откладывать уже нельзя: подготовьте и подайте возражение сегодня, сохранив подтверждение отправки или подачи.
        </p>
        <DeadlineSummary result={result} />
        <p className="mt-4 rounded-lg bg-white p-3 text-sm leading-6 text-zinc-700">
          По ст. 108 ГПК РФ процессуальное действие можно совершить до 24:00 последнего дня срока, в том числе отправить документы почтой до истечения суток.
        </p>
        <ResultLinks primaryHref={`/documents/${judicialOrderDebtRoute.documentSlug}/?variant=${judicialOrderDebtRoute.documentVariant}&route_id=${judicialOrderDebtRoute.routeId}#fill-online`} primaryLabel="Подготовить возражение" secondaryHref="/lawyers/" secondaryLabel="Срочно к юристу" />
      </ResultShell>
    );
  }

  return (
    <ResultShell status="running" tone="green" title="Срок, вероятно, ещё не истёк">
      <p>
        По введенной дате десятидневный срок обычно еще идет. Проверьте дату получения и подготовьте письменные возражения в суд, вынесший приказ.
      </p>
      <DeadlineSummary result={result} />
      {learnedFromBailiffs ? <BailiffWarning /> : null}
      <p className="mt-4 text-sm leading-6 text-zinc-600">
        Если возражения поступят в срок, по ст. 129 ГПК РФ судья отменяет судебный приказ. Причины несогласия с долгом обычно подробно доказывать не требуется.
      </p>
      <ResultLinks primaryHref={`/documents/${judicialOrderDebtRoute.documentSlug}/?variant=${judicialOrderDebtRoute.documentVariant}&route_id=${judicialOrderDebtRoute.routeId}#fill-online`} primaryLabel="Подготовить возражение" secondaryHref={judicialOrderDebtRoute.canonicalUrl} secondaryLabel="Открыть инструкцию" />
    </ResultShell>
  );
}

function DeadlineSummary({ result }: { result: JudicialOrderDeadlineResult }) {
  if (!result.deadline) return null;

  return (
    <dl className="mt-5 grid gap-3 rounded-lg bg-white p-4 text-sm">
      {result.receivedDate ? (
        <div>
          <dt className="font-semibold text-zinc-500">Дата получения</dt>
          <dd className="mt-1 text-ink">{formatDate(result.receivedDate)}</dd>
        </div>
      ) : null}
      <div>
        <dt className="font-semibold text-zinc-500">Ориентировочный последний день</dt>
        <dd className="mt-1 text-ink">{formatDate(result.deadline)}</dd>
      </div>
      {result.daysLeft !== null ? (
        <div>
          <dt className="font-semibold text-zinc-500">Осталось</dt>
          <dd className="mt-1 text-ink">{result.daysLeft >= 0 ? daysText(result.daysLeft) : "срок уже прошел"}</dd>
        </div>
      ) : null}
      {result.movedFromWeekend && result.baseDeadline ? (
        <div data-testid="weekend-transfer" className="rounded-md bg-emerald-50 p-3 text-emerald-800">
          Последний день выпадал на {formatDate(result.baseDeadline)}, поэтому он перенесен на ближайший понедельник по логике ст. 108 ГПК РФ.
        </div>
      ) : null}
    </dl>
  );
}

function ResultShell({ children, status, title, tone }: { children: ReactNode; status: JudicialOrderDeadlineStatus; title: string; tone: "green" | "amber" | "red" }) {
  const toneClassName =
    tone === "red" ? "border-red-200 bg-red-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50";

  return (
    <div data-testid="deadline-result" data-status={status} className={`min-w-0 rounded-lg border p-5 ${toneClassName}`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Результат</p>
      <h3 className="mt-2 text-2xl font-semibold text-ink">{title}</h3>
      <div className="mt-4 text-base leading-7 text-zinc-700">{children}</div>
    </div>
  );
}

function ResultLinks({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Link href={primaryHref} className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink">
        {primaryLabel}
      </Link>
      <Link href={secondaryHref} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
        {secondaryLabel}
      </Link>
      <Link href="/questions/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
        Q&A по приказам
      </Link>
      <Link href="/lawyers/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
        Юристы
      </Link>
    </div>
  );
}

function BailiffWarning() {
  return (
    <div data-testid="bailiff-warning" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      Если вы узнали о приказе только от приставов, проверьте материалы судебного дела и документы исполнительного производства. Часто нужно одновременно подавать возражения и просить восстановить срок.
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex min-w-0 gap-2 text-sm leading-6 text-zinc-700">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-trust" aria-hidden="true" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckboxField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-w-0 items-start gap-3 text-sm font-semibold text-ink">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-trust" />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function daysText(days: number) {
  if (days === 0) return "последний день сегодня";
  const lastTwo = days % 100;
  const last = days % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${days} дней`;
  if (last === 1) return `${days} день`;
  if (last >= 2 && last <= 4) return `${days} дня`;
  return `${days} дней`;
}
