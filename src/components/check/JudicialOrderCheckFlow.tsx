"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { calculateJudicialOrderDeadline, formatDateForInput } from "@/lib/judicial-order-deadline";
import { getJudicialOrderDocumentHref, judicialOrderDebtRoute } from "@/lib/judicial-order-flow";

type FormState = {
  documentType: "order" | "unknown" | "other";
  receivedWay: "paper" | "gosuslugi" | "unknown";
  receivedDate: string;
  claimantType: "bank" | "mfo" | "collector" | "other" | "unknown";
  disagreement: "amount" | "paid" | "limitation" | "other";
  enforcement: "none" | "started" | "withdrawn" | "unknown";
};

const initialState: FormState = {
  documentType: "order",
  receivedWay: "paper",
  receivedDate: "",
  claimantType: "bank",
  disagreement: "amount",
  enforcement: "none"
};

export function JudicialOrderCheckFlow() {
  const [values, setValues] = useState<FormState>(() => ({
    ...initialState,
    receivedDate: formatDateForInput(addDays(new Date(), -3))
  }));
  const [submitted, setSubmitted] = useState(false);
  const deadline = useMemo(
    () =>
      calculateJudicialOrderDeadline({
        receivedDateValue: values.receivedDate,
        unknownReceiptDate: !values.receivedDate || values.receivedWay === "unknown"
      }),
    [values.receivedDate, values.receivedWay]
  );
  const documentHref = getJudicialOrderDocumentHref({
    source: "check",
    receivedWay: values.receivedWay === "unknown" ? "unsure" : values.receivedWay,
    receivedDateStatus: values.receivedDate ? "known" : "unknown",
    receivedDate: values.receivedDate,
    claimantName: claimantLabel(values.claimantType),
    objectionReason: objectionReason(values.disagreement),
    objectionComment: objectionComment(values),
    requestTermRestoration: deadline.status === "missed"
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    const payload = {
      routeId: judicialOrderDebtRoute.routeId,
      problemSlug: judicialOrderDebtRoute.problemSlug,
      documentSlug: judicialOrderDebtRoute.documentSlug,
      documentVariant: judicialOrderDebtRoute.documentVariant,
      facts: confirmedFacts(values),
      assumptions: assumptions(values),
      deadline: {
        status: deadline.status,
        receivedDate: values.receivedDate || null,
        deadline: deadline.deadline ? formatDateForInput(deadline.deadline) : null,
        daysLeft: deadline.daysLeft
      },
      createdAt: new Date().toISOString()
    };
    sessionStorage.setItem("pravopoisk:judicial-order-case", JSON.stringify(payload));
    setSubmitted(true);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Диагностика ситуации</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ink sm:text-5xl">
          Судебный приказ по долгу: проверьте срок и следующий шаг
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-700">
          Ответьте на короткие вопросы. Мы покажем предварительную оценку, что нужно сделать дальше, и передадим факты в генератор возражения.
        </p>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Уточните факты</h2>
          <div className="mt-5 grid gap-4">
            <SelectField label="1. Это именно судебный приказ?" value={values.documentType} onChange={(value) => update("documentType", value as FormState["documentType"])}>
              <option value="order">Да, документ называется «судебный приказ»</option>
              <option value="unknown">Не уверен</option>
              <option value="other">Нет, другой документ</option>
            </SelectField>
            <SelectField label="2. Как вы получили копию приказа?" value={values.receivedWay} onChange={(value) => update("receivedWay", value as FormState["receivedWay"])}>
              <option value="paper">На руки или по почте</option>
              <option value="gosuslugi">Через Госуслуги</option>
              <option value="unknown">Не помню / точной даты нет</option>
            </SelectField>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Дата получения копии приказа</span>
              <input
                type="date"
                value={values.receivedDate}
                onChange={(event) => update("receivedDate", event.currentTarget.value)}
                className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
              />
            </label>
            <SelectField label="3. Кто взыскатель?" value={values.claimantType} onChange={(value) => update("claimantType", value as FormState["claimantType"])}>
              <option value="bank">Банк</option>
              <option value="mfo">МФО</option>
              <option value="collector">Коллектор</option>
              <option value="other">Другая организация</option>
              <option value="unknown">Не знаю</option>
            </SelectField>
            <SelectField label="4. С чем вы не согласны?" value={values.disagreement} onChange={(value) => update("disagreement", value as FormState["disagreement"])}>
              <option value="amount">С суммой долга</option>
              <option value="paid">Долг уже оплачен полностью или частично</option>
              <option value="limitation">Срок взыскания мог быть пропущен</option>
              <option value="other">Другое несогласие</option>
            </SelectField>
            <SelectField label="5. Приставы уже начали взыскание?" value={values.enforcement} onChange={(value) => update("enforcement", value as FormState["enforcement"])}>
              <option value="none">Нет, списаний и производства нет</option>
              <option value="started">Исполнительное производство началось</option>
              <option value="withdrawn">Деньги уже списали</option>
              <option value="unknown">Не знаю</option>
            </SelectField>
          </div>
          <button type="button" onClick={submit} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink sm:w-auto">
            Получить оценку
          </button>
        </div>

        <AssessmentPanel deadline={deadline} documentHref={documentHref} submitted={submitted} values={values} />
      </section>
    </main>
  );
}

function AssessmentPanel({
  deadline,
  documentHref,
  submitted,
  values
}: {
  deadline: ReturnType<typeof calculateJudicialOrderDeadline>;
  documentHref: string;
  submitted: boolean;
  values: FormState;
}) {
  const deadlineText =
    deadline.status === "running"
      ? `Срок предварительно не пропущен. Осталось: ${deadline.daysLeft} дн.`
      : deadline.status === "today"
        ? "Последний день срока может быть сегодня."
        : deadline.status === "missed"
          ? "Срок может быть пропущен: потребуется проверить восстановление срока."
          : "Без даты получения срок можно оценить только ориентировочно.";

  return (
    <aside className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Предварительная оценка</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">Что делать дальше</h2>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Информация носит справочный характер. Если срок спорный, деньги списали или документ непонятен, лучше проверить ситуацию с юристом.
      </div>
      <div className="mt-5 grid gap-4">
        <InfoBlock title="Что произошло" items={confirmedFacts(values)} />
        <InfoBlock title="Срок и риск" items={[deadlineText, "Основание: ст. 128 и 129 ГПК РФ о сроке и отмене судебного приказа."]} />
        <InfoBlock title="План" items={[
          "Сверьте реквизиты суда, номер дела, взыскателя и дату получения приказа.",
          "Сформируйте возражение на исполнение судебного приказа.",
          "Подайте возражение в суд, который вынес приказ, и сохраните подтверждение подачи."
        ]} ordered />
        <InfoBlock title="Что ещё может понадобиться" items={missingFacts(values)} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={documentHref} className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          Сформировать возражение на судебный приказ
        </Link>
        <Link href={judicialOrderDebtRoute.toolUrl} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Проверить срок отдельно
        </Link>
      </div>
      {submitted ? <p className="mt-3 text-xs leading-5 text-zinc-500">Факты сохранены в браузере и будут подставлены в следующий шаг.</p> : null}
    </aside>
  );
}

function SelectField({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust">
        {children}
      </select>
    </label>
  );
}

function InfoBlock({ items, ordered = false, title }: { items: string[]; ordered?: boolean; title: string }) {
  const List = ordered ? "ol" : "ul";
  return (
    <div className="rounded-lg border border-line bg-zinc-50 p-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      <List className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
        {items.map((item, index) => (
          <li key={item}>{ordered ? `${index + 1}. ` : "- "}{item}</li>
        ))}
      </List>
    </div>
  );
}

function confirmedFacts(values: FormState) {
  return [
    values.documentType === "order" ? "Документ определён как судебный приказ." : "Тип документа нужно проверить.",
    `Взыскатель: ${claimantLabel(values.claimantType).toLowerCase()}.`,
    `Несогласие: ${disagreementLabel(values.disagreement).toLowerCase()}.`,
    enforcementLabel(values.enforcement)
  ];
}

function assumptions(values: FormState) {
  return [
    values.claimantType === "bank" || values.claimantType === "mfo" || values.claimantType === "collector"
      ? "Сценарий отнесён к долгу по кредиту, займу, банку или МФО."
      : "Сценарий может отличаться от банковского долга, если взыскатель другой."
  ];
}

function missingFacts(values: FormState) {
  return [
    values.receivedDate ? "" : "Нужна точная дата получения копии приказа.",
    "Номер дела и дата вынесения приказа.",
    "Название суда и данные взыскателя из приказа.",
    "Сумма взыскания и расчёт долга."
  ].filter(Boolean);
}

function claimantLabel(value: FormState["claimantType"]) {
  if (value === "bank") return "Банк";
  if (value === "mfo") return "МФО";
  if (value === "collector") return "Коллектор";
  if (value === "other") return "Другая организация";
  return "Взыскатель не уточнён";
}

function disagreementLabel(value: FormState["disagreement"]) {
  if (value === "amount") return "не согласны с суммой долга";
  if (value === "paid") return "долг уже оплачен полностью или частично";
  if (value === "limitation") return "срок взыскания мог быть пропущен";
  return "есть возражения против исполнения приказа";
}

function enforcementLabel(value: FormState["enforcement"]) {
  if (value === "none") return "Исполнительное производство и списания пока не начались.";
  if (value === "started") return "Исполнительное производство уже началось.";
  if (value === "withdrawn") return "Деньги уже списывали, нужно проверить действия приставов или банка.";
  return "Статус исполнительного производства нужно уточнить.";
}

function objectionReason(value: FormState["disagreement"]) {
  if (value === "amount") return "disagree_with_amount";
  if (value === "paid") return "already_paid";
  if (value === "limitation") return "limitation_period";
  return "disagree_with_claims";
}

function objectionComment(values: FormState) {
  return `${disagreementLabel(values.disagreement)}. ${enforcementLabel(values.enforcement)}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
