"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DraftPayload = {
  routeId?: string | null;
  documentSlug?: string;
  documentTitle?: string;
  documentVariant?: string;
  generatedText?: string;
  values?: Record<string, unknown>;
  caseContext?: {
    facts?: string[];
    deadline?: { status?: string; deadline?: string | null; daysLeft?: number | null };
  } | null;
  createdAt?: string;
};

type SubmitState = { status: "idle" | "loading" | "success" | "error"; id?: string; message?: string };

export function DocumentReviewRequestForm() {
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [messenger, setMessenger] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const documentTitle = draft?.documentTitle ?? "сформированный документ";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pravopoisk:document-review");
      if (raw) setDraft(JSON.parse(raw) as DraftPayload);
    } catch {
      setDraft(null);
    }
  }, []);

  async function submit() {
    if (!draft || !consent) return;
    setSubmitState({ status: "loading" });
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email,
        messenger,
        documentsNote: comment,
        message: buildMessage(draft, comment),
        sourceType: "DOCUMENT_REVIEW",
        sourcePage: "/document-review/",
        contactTransferConsent: true,
        consent: true,
        structuredPayload: {
          reviewGoal: "Проверить сформированный документ перед подачей",
          routeId: draft.routeId ?? null,
          documentSlug: draft.documentSlug,
          documentTitle: draft.documentTitle,
          documentVariant: draft.documentVariant,
          generatedText: draft.generatedText,
          values: draft.values,
          caseContext: draft.caseContext,
          userComment: comment,
          version: "document_review_mvp"
        }
      })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setSubmitState({ status: "error", message: result?.message ?? "Не удалось отправить заявку." });
      return;
    }
    setSubmitState({ status: "success", id: result.id });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Проверка документа</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-5xl">Передать документ юристу</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-700">
          Юрист увидит {documentTitle}, данные из формы и вашу цель проверки. Заявка не публикуется в Q&A.
        </p>
      </header>

      {submitState.status === "success" ? (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Передано на проверку</h2>
          <p className="mt-3 text-base leading-7 text-emerald-950">Номер заявки: {submitState.id}</p>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-emerald-950">
            <li>- Статус: Передано на проверку.</li>
            <li>- В пакет вошли документ, данные формы и ваш комментарий.</li>
            <li>- Канал связи: {messenger || phone || email}.</li>
          </ul>
          <Link href="/account/cases/" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
            Открыть мои дела
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form className="rounded-lg border border-line bg-white p-5 shadow-sm" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <h2 className="text-2xl font-semibold text-ink">Контакты для ответа</h2>
            <div className="mt-5 grid gap-4">
              <Input label="Имя" value={name} onChange={setName} required />
              <Input label="Телефон" value={phone} onChange={setPhone} required />
              <Input label="Email" type="email" value={email} onChange={setEmail} />
              <Input label="Удобный канал связи" value={messenger} onChange={setMessenger} placeholder="Например: Telegram, WhatsApp, звонок" />
              <label className="block">
                <span className="text-sm font-semibold text-ink">Комментарий юристу</span>
                <textarea value={comment} onChange={(event) => setComment(event.currentTarget.value)} rows={4} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust" placeholder="Что особенно проверить: срок, реквизиты, формулировки, приложения" />
              </label>
              <label className="flex gap-3 rounded-md border border-line bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.currentTarget.checked)} className="mt-1 h-4 w-4 shrink-0 accent-trust" />
                <span>Согласен передать контакты и текст сформированного документа для проверки юристом.</span>
              </label>
            </div>
            {submitState.status === "error" ? <p className="mt-3 text-sm font-semibold text-red-700">{submitState.message}</p> : null}
            <button type="submit" disabled={!draft || !consent || submitState.status === "loading"} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:bg-zinc-300 sm:w-auto">
              {submitState.status === "loading" ? "Отправляем..." : "Отправить на проверку"}
            </button>
          </form>

          <ReviewPreview draft={draft} />
        </section>
      )}
    </main>
  );
}

function ReviewPreview({ draft }: { draft: DraftPayload | null }) {
  if (!draft) {
    return (
      <aside className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <p className="font-semibold">Документ не найден в браузере</p>
        <p className="mt-2">Сначала сформируйте документ. Если нужна консультация без документа, можно задать вопрос юристу.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/documents/" className="inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink hover:text-trust">
            Сформировать документ
          </Link>
          <Link href="/questions/#question" className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-ink hover:text-trust">
            Спросить юриста
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">Что получит юрист</h2>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-700">
        <li>- Документ: {draft.documentTitle ?? draft.documentSlug ?? "сформированный документ"}.</li>
        <li>- Вариант: {draft.documentVariant ?? "универсальный"}.</li>
        <li>- Данные формы: {draft.values ? "будут переданы юристу вместе с документом" : "передаётся только текст документа"}.</li>
        <li>- Цель: проверить реквизиты, формулировки, приложения, пошлины и порядок подачи.</li>
      </ul>
      <div className="mt-5 rounded-lg bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-ink">Фрагмент документа</p>
        <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{draft.generatedText}</p>
      </div>
    </aside>
  );
}

function Input({
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}{required ? " *" : ""}</span>
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.currentTarget.value)} className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust" />
    </label>
  );
}

function buildMessage(draft: DraftPayload, comment: string) {
  const facts = draft.caseContext?.facts?.join(" ") || "Факты переданы из сформированного документа.";
  return [
    "Проверка сформированного документа.",
    `Документ: ${draft.documentTitle ?? draft.documentSlug ?? "документ"}.`,
    draft.documentVariant ? `Вариант: ${draft.documentVariant}.` : "",
    `Контекст: ${facts}`,
    comment ? `Комментарий пользователя: ${comment}` : ""
  ].filter(Boolean).join("\n");
}
