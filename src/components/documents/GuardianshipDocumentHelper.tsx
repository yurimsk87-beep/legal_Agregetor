"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { DOCUMENT_REVIEW_RETENTION_DAYS } from "@/data/document-review-policy";
import {
  findGuardianshipTerritory,
  getGuardianshipAuthorityOptions,
  getGuardianshipMunicipalityOptions,
  getGuardianshipRegionOptions,
  GUARDIANSHIP_DIRECTORY_METADATA,
  TERRITORY_NOT_FOUND_ID,
  type GuardianshipCity
} from "@/data/guardianship-territories";
import { GUARDIANSHIP_SCENARIOS } from "@/data/guardianship-route";
import type { GuardianshipField, GuardianshipScenarioKey } from "@/data/guardianship-route";
import {
  getVisibleGuardianshipFields,
  resetGuardianshipDependentValues,
  validateGuardianshipApplication
} from "@/lib/guardianship-validator";
import type { GuardianshipDecision, GuardianshipDocumentItem, GuardianshipValues } from "@/lib/guardianship-validator";
import {
  createGuardianshipDocxBlob,
  ensureGuardianshipDraftMarker,
  getGuardianshipDocxFilename
} from "@/lib/guardianship-docx";
import { createGuardianshipPdfBlob, getGuardianshipPdfFilename } from "@/lib/guardianship-pdf";
import { sendAnalyticsEvent } from "@/lib/analytics-client";

type ReviewStatus = "idle" | "submitting" | "success" | "withdrawing" | "withdrawn" | "error";

export function GuardianshipDocumentHelper({ scenarioKey, cities }: { scenarioKey: GuardianshipScenarioKey; cities: GuardianshipCity[] }) {
  const scenario = GUARDIANSHIP_SCENARIOS[scenarioKey];
  const [values, setValues] = useState<GuardianshipValues>({});
  const [step, setStep] = useState(0);
  const [decision, setDecision] = useState<GuardianshipDecision | null>(null);
  const [draft, setDraft] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewReceipt, setReviewReceipt] = useState<{ leadId: string; withdrawalToken: string } | null>(null);
  const fields = useMemo(() => getVisibleGuardianshipFields(scenarioKey, values), [scenarioKey, values]);
  const safeStep = Math.min(step, Math.max(fields.length - 1, 0));
  const field = fields[safeStep];

  function setField(name: string, value: string) {
    setValues((current) => resetGuardianshipDependentValues(scenarioKey, name, { ...current, [name]: value }));
    setDecision(null);
    setDraft("");
    setFieldError("");
    setNotice("");
    setReviewOpen(false);
    setReviewStatus("idle");
    setReviewMessage("");
    setReviewReceipt(null);
  }

  function advance(event: FormEvent) {
    event.preventDefault();
    if (!field) return;
    if (field.required && !values[field.name]?.trim()) {
      setFieldError(`Заполните поле «${field.label}».`);
      return;
    }
    if (safeStep < fields.length - 1) {
      setStep(safeStep + 1);
      setFieldError("");
      return;
    }
    const result = validateGuardianshipApplication(scenarioKey, values);
    setDecision(result);
    setDraft(result.draftText ? ensureGuardianshipDraftMarker(result.draftText) : "");
  }

  function goBack() {
    if (decision) {
      setDecision(null);
      setReviewOpen(false);
      setReviewStatus("idle");
      setReviewMessage("");
      setReviewReceipt(null);
      return;
    }
    setStep((current) => Math.max(0, current - 1));
    setFieldError("");
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(ensureGuardianshipDraftMarker(draft));
    setNotice("Черновик скопирован вместе с обязательной маркировкой.");
  }

  async function downloadDraft() {
    if (!draft) return;
    try {
      const blob = await createGuardianshipDocxBlob(draft);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = getGuardianshipDocxFilename(scenario.documentSlug);
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Черновик DOCX сформирован с обязательной маркировкой.");
    } catch {
      setNotice("DOCX не сформирован. Текст остаётся доступен для копирования.");
    }
  }

  function printDraft() {
    if (!draft) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setNotice("Браузер заблокировал печатное окно.");
      return;
    }
    const marked = ensureGuardianshipDraftMarker(draft);
    printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Черновик</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;white-space:pre-wrap;line-height:1.5;color:#111}@media print{body{margin:20mm}}</style></head><body>${escapeHtml(marked)}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function createPdf() {
    if (!decision) throw new Error("Результат ещё не подготовлен.");
    return createGuardianshipPdfBlob(decision, draft);
  }

  async function downloadPdf() {
    if (!decision) return;
    try {
      const blob = await createPdf();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = getGuardianshipPdfFilename(decision.outcomeKey, decision.resultKind === "draft");
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("PDF сформирован. Проверьте маркировку результата перед использованием.");
    } catch {
      setNotice("PDF не сформирован. Попробуйте ещё раз.");
    }
  }

  async function submitForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision) return;
    setReviewStatus("submitting");
    setReviewMessage("");
    const form = event.currentTarget;
    const input = new FormData(form);

    try {
      const blob = await createPdf();
      const payload = new FormData();
      payload.set("name", String(input.get("name") ?? ""));
      payload.set("phone", String(input.get("phone") ?? ""));
      payload.set("email", String(input.get("email") ?? ""));
      payload.set("message", `Проверка PDF по маршруту «Опека и попечительство над ребёнком». Результат: ${decision.resultLabel}.`);
      payload.set("documentsNote", String(input.get("documentsNote") ?? ""));
      payload.set("sourcePage", window.location.pathname);
      payload.set("sourceType", "DOCUMENT_REVIEW");
      payload.set("format", "online");
      payload.set("consent", input.get("consent") === "on" ? "true" : "false");
      payload.set("contactTransferConsent", input.get("contactTransferConsent") === "on" ? "true" : "false");
      payload.set("structuredPayload", JSON.stringify({
        route: "child-guardianship",
        scenarioKey,
        outcomeKey: decision.outcomeKey,
        resultKind: decision.resultKind,
        requiresLegalReview: decision.requiresLegalReview,
        resultStatus: decision.filingReady ? "FILING_READY" : "NOT_READY_FOR_FILING",
        reviewStatus: "AWAITING_LAWYER_ASSIGNMENT"
      }));
      payload.set("attachment", new File([blob], getGuardianshipPdfFilename(decision.outcomeKey, decision.resultKind === "draft"), { type: "application/pdf" }));

      const response = await fetch("/api/leads/", { method: "POST", body: payload });
      const result = (await response.json().catch(() => null)) as { id?: string; message?: string; withdrawalToken?: string } | null;
      if (!response.ok) throw new Error(result?.message || "Не удалось передать PDF на проверку.");

      sendAnalyticsEvent({
        type: "DOCUMENT_REVIEW_REQUEST_CREATED",
        sourcePage: window.location.pathname,
        targetType: "GUARDIANSHIP_OUTCOME",
        targetId: decision.outcomeKey,
        payload: { scenarioKey, outcomeKey: decision.outcomeKey }
      });
      setReviewStatus("success");
      if (result?.id && result.withdrawalToken) setReviewReceipt({ leadId: result.id, withdrawalToken: result.withdrawalToken });
      setReviewMessage("Заявка принята платформой и ожидает назначения юриста. PDF и контакты не публикуются. О передаче конкретному юристу платформа сообщит отдельно.");
      form.reset();
    } catch (error) {
      setReviewStatus("error");
      setReviewMessage(error instanceof Error ? error.message : "Не удалось передать PDF на проверку.");
    }
  }

  async function withdrawReviewConsent() {
    if (!reviewReceipt) return;
    setReviewStatus("withdrawing");
    const response = await fetch(`/api/leads/${encodeURIComponent(reviewReceipt.leadId)}/document-review/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: reviewReceipt.withdrawalToken })
    });
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
      setReviewStatus("error");
      setReviewMessage(result?.message || "Не удалось отозвать согласие.");
      return;
    }
    setReviewStatus("withdrawn");
    setReviewReceipt(null);
    setReviewMessage(result?.message || "Согласие отозвано, PDF удалён.");
  }

  return (
    <section id="fill-online" className="scroll-mt-24 border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Подготовка документа</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{scenario.mainDocument}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
        Ответы обрабатываются в браузере. Помощник применяет только заранее заданные правила и не дописывает факты или правовые основания.
      </p>

      {!decision && field ? (
        <form className="mt-6" onSubmit={advance}>
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-zinc-600">
            <span>Вопрос {safeStep + 1} из {fields.length}</span>
            <span>{Math.round(((safeStep + 1) / fields.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
            <div className="h-full bg-trust" style={{ width: `${((safeStep + 1) / fields.length) * 100}%` }} />
          </div>
          <div className="mt-6">
            <HelperField field={field} onChange={setField} value={values[field.name] ?? ""} values={values} cities={cities} />
            {fieldError ? <p className="mt-2 text-sm text-rose-700" role="alert">{fieldError}</p> : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {safeStep > 0 ? <button type="button" onClick={goBack} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/30">Назад</button> : null}
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
              {safeStep === fields.length - 1 ? "Подготовить документ" : "Продолжить"}
            </button>
          </div>
        </form>
      ) : null}

      {decision?.outputMode === "urgent" ? (
        <div className="mt-6 border-l-4 border-red-600 bg-red-50 p-5 text-red-950" aria-live="assertive">
          <p className="text-sm font-semibold uppercase">Срочная ситуация</p>
          <h3 className="mt-2 text-2xl font-semibold">Не откладывайте обращение ради документа</h3>
          {decision.notices.map((item) => <p key={item} className="mt-3 text-sm leading-6">{item}</p>)}
          <ol className="mt-4 grid gap-2 text-sm leading-6">{decision.filingSteps.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="tel:112" className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-700 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500/40">Позвонить 112</a>
            <a href={decision.officialFormUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-red-500/40">Официальная инструкция МЧС</a>
          </div>
        </div>
      ) : null}

      {decision && decision.outputMode !== "urgent" ? (
        <div className="mt-6" aria-live="polite">
          <div className={`border p-4 text-sm leading-6 ${decision.requiresLegalReview || decision.issues.length ? "border-amber-300 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
            <p className="font-semibold">{decision.resultLabel}</p>
            <p className="mt-2"><strong>Результат:</strong> {decision.documentTitle}</p>
            <p className="mt-2">{decision.filingReady ? "Результат можно использовать по инструкции ниже." : "Это не готовый официальный бланк. Перед подачей выполните указанные шаги и, когда отмечено, пройдите юридическую проверку."}</p>
            {decision.notices.map((item) => <p key={item} className="mt-2">{item}</p>)}
            {decision.issues.length ? (
              <div className="mt-3 border-t border-amber-300 pt-3">
                <p className="font-semibold">Что требует уточнения:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">{decision.issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}</ul>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ResultFact title="Пошлина и расходы" text={decision.fee} />
            <ResultFact title="Срок" text={decision.deadline} />
          </div>

          {decision.preparedData.length ? (
            <section className="mt-6 border-t border-line pt-5">
              <h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3>
              <dl className="mt-3 grid gap-3 text-sm leading-6">
                {decision.preparedData.map((item) => (
                  <div key={item.label} className="border-l-2 border-line pl-3">
                    <dt className="font-semibold text-ink">{item.label}</dt>
                    <dd className="whitespace-pre-wrap text-zinc-700">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <DocumentGroup title="Предоставляет заявитель" items={decision.providedDocuments} />
          <DocumentGroup title="Орган получает межведомственно" items={decision.interagencyInformation} />
          <StringGroup title="Оригиналы" items={decision.originals} />
          <StringGroup title="Копии" items={decision.copies} />
          <StringGroup title="Зависит от региона" items={decision.regionalDocuments} />
          <StringGroup title="Дополнительно по вашим ответам" items={decision.additionalDocuments} />

          <section className="mt-6 border-t border-line pt-5">
            <h3 className="text-xl font-semibold text-ink">Что делать дальше</h3>
            <ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{decision.filingSteps.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol>
          </section>

          {decision.outputMode === "official-helper" && decision.officialFormUrl && !decision.issues.length ? (
            <a href={decision.officialFormUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">
              {decision.officialFormLinkLabel ?? "Открыть официальный источник формы"}
            </a>
          ) : null}

          {draft && !decision.issues.length ? (
            <section className="mt-6 border border-amber-300 bg-amber-50 p-4">
              <p className="font-semibold text-amber-950">ЧЕРНОВИК — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА</p>
              <textarea aria-label="Текст черновика" value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-4 min-h-[28rem] w-full border border-line bg-white p-4 font-mono text-sm leading-6 text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={copyDraft} className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Копировать черновик</button>
                <button type="button" onClick={downloadDraft} className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Скачать черновик DOCX</button>
                <button type="button" onClick={printDraft} className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-trust/30">Печатная версия</button>
              </div>
            </section>
          ) : null}

          {decision.pdfAvailable ? (
            <section className="mt-6 border-t border-line pt-6">
              <h3 className="text-xl font-semibold text-ink">Итоговый результат</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700">PDF содержит маркировку типа результата, персональный перечень документов и алгоритм дальнейших действий.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
                  <Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF
                </button>
                {decision.lawyerReviewAvailable ? (
                  <button type="button" onClick={() => setReviewOpen((current) => !current)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-trust/30">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Проверить у юриста
                  </button>
                ) : null}
              </div>
              {notice ? <p className="mt-3 text-sm text-zinc-700">{notice}</p> : null}
            </section>
          ) : null}

          {reviewOpen && decision.lawyerReviewAvailable ? (
            <form onSubmit={submitForReview} className="mt-5 grid gap-4 border border-line bg-zinc-50 p-5">
              <div>
                <h3 className="text-lg font-semibold text-ink">Передать PDF на проверку</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-700">Платформа сохранит заявку и закрытый PDF в очереди на назначение. Отправка формы не означает, что конкретный юрист уже назначен или получил файл.</p>
                <p className="mt-1 text-sm leading-6 text-zinc-700">Срок закрытого хранения PDF — до {DOCUMENT_REVIEW_RETENTION_DAYS} дней. Согласие можно отозвать после отправки: файл будет удалён сразу.</p>
                <p className="mt-1 text-sm leading-6 text-zinc-700">После закрытия страницы запрос на отзыв можно отправить на <a href="mailto:admin@pravopoisk.ru" className="font-semibold text-trust underline underline-offset-4">admin@pravopoisk.ru</a>, указав имя и телефон или email из заявки.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-zinc-700">Имя<input name="name" required minLength={2} className="min-h-11 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></label>
                <label className="grid gap-1 text-sm font-medium text-zinc-700">Телефон<input name="phone" required minLength={6} className="min-h-11 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></label>
              </div>
              <label className="grid gap-1 text-sm font-medium text-zinc-700">Email<input name="email" type="email" className="min-h-11 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></label>
              <label className="grid gap-1 text-sm font-medium text-zinc-700">Комментарий<textarea name="documentsNote" rows={3} maxLength={1200} className="min-h-24 rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /></label>
              <label className="flex items-start gap-2 text-sm leading-6 text-zinc-700">
                <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />
                <span>Согласен на обработку персональных данных. <Link href="/legal/personal-data-consent/" className="font-semibold text-trust underline underline-offset-4">Условия согласия</Link>.</span>
              </label>
              <label className="flex items-start gap-2 text-sm leading-6 text-zinc-700">
                <input name="contactTransferConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />
                <span>Отдельно соглашаюсь передать сформированный PDF и мои контакты юристу для проверки этого результата.</span>
              </label>
              <button type="submit" disabled={["submitting", "success", "withdrawing", "withdrawn"].includes(reviewStatus)} className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {reviewStatus === "submitting" ? "Отправляем заявку" : reviewStatus === "success" ? "Заявка принята" : "Проверить у юриста"}
              </button>
              {reviewReceipt ? (
                <button type="button" onClick={withdrawReviewConsent} disabled={reviewStatus === "withdrawing"} className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink disabled:opacity-60">
                  {reviewStatus === "withdrawing" ? "Удаляем PDF" : "Отозвать согласие и удалить PDF"}
                </button>
              ) : null}
              {reviewMessage ? <p role="status" className={`text-sm font-medium ${reviewStatus === "error" ? "text-red-700" : "text-leaf"}`}>{reviewMessage}</p> : null}
            </form>
          ) : null}

          <button type="button" onClick={goBack} className="mt-6 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">Изменить ответы</button>
        </div>
      ) : null}
    </section>
  );
}

function HelperField({ field, onChange, value, values, cities }: { field: GuardianshipField; onChange: (name: string, value: string) => void; value: string; values: GuardianshipValues; cities: GuardianshipCity[] }) {
  const id = `guardianship-${field.name}`;
  const territorialOptions = field.type === "territory-region"
    ? getGuardianshipRegionOptions()
    : field.type === "territory-municipality"
      ? getGuardianshipMunicipalityOptions(values.region, cities)
      : field.type === "guardianship-authority"
        ? getGuardianshipAuthorityOptions(values.municipality)
        : [];
  const isTerritorialField = ["territory-region", "territory-municipality", "guardianship-authority"].includes(field.type ?? "");
  const selectedAuthority = field.type === "guardianship-authority"
    ? findGuardianshipTerritory(values.region, values.municipality, value).authority
    : undefined;
  return (
    <div className="grid gap-2 text-sm font-semibold text-ink">
      <label htmlFor={id}>{field.label}{field.required ? <span className="sr-only"> (обязательно)</span> : null}</label>
      {isTerritorialField ? (
        <SearchableSelect
          id={id}
          label={field.label}
          options={territorialOptions}
          value={value}
          onChange={(selectedValue) => onChange(field.name, selectedValue)}
          required={field.required}
          disabled={field.type === "territory-municipality" ? !values.region : field.type === "guardianship-authority" ? !values.municipality || values.municipality === TERRITORY_NOT_FOUND_ID : false}
          placeholder={field.type === "territory-region" ? "Выберите регион" : field.type === "territory-municipality" ? "Выберите муниципальное образование" : "Выберите орган опеки"}
          searchPlaceholder={field.type === "territory-region" ? "Поиск региона" : field.type === "territory-municipality" ? "Поиск муниципального образования" : "Поиск органа опеки"}
        />
      ) : field.type === "select" ? (
        <select id={id} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20">
          <option value="">Выберите вариант</option>
          {getFieldOptions(field, values).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea id={id} rows={5} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-32 w-full rounded-md border border-line bg-white px-3 py-3 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
      ) : (
        <input id={id} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(field.name, event.target.value)} className="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" />
      )}
      {field.hint ? <span className="text-xs font-normal leading-5 text-zinc-600">{field.hint}</span> : null}
      {isTerritorialField ? <span className="text-xs font-normal leading-5 text-zinc-600">Справочник не считается полным. Проверка данных: {GUARDIANSHIP_DIRECTORY_METADATA.lastVerifiedAt}.</span> : null}
      {value === TERRITORY_NOT_FOUND_ID ? (
        <div className="border border-amber-300 bg-amber-50 p-3 text-sm font-normal leading-6 text-amber-950">
          <p>Нужного значения пока нет во внутреннем списке. Помощник не отправляет на сторонний сайт и не сформирует документ с неподтверждённым адресатом.</p>
        </div>
      ) : null}
      {selectedAuthority ? (
        <div className="border-l-2 border-trust pl-3 text-xs font-normal leading-5 text-zinc-600">
          <p>{selectedAuthority.address}</p>
          <a href={selectedAuthority.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-trust/30">
            {selectedAuthority.sourceName}
          </a>
          <p>Проверено: {selectedAuthority.lastVerifiedAt}.</p>
        </div>
      ) : null}
    </div>
  );
}

function getFieldOptions(field: GuardianshipField, values: GuardianshipValues) {
  if (field.name !== "operationType" || values.propertyAction !== "real-estate") return field.options ?? [];
  return (field.options ?? []).filter((option) => [
    "real-estate-sale",
    "real-estate-exchange",
    "pledge-rent",
    "waiver-division",
    "unsure"
  ].includes(option.value));
}

function DocumentGroup({ items, title }: { items: GuardianshipDocumentItem[]; title: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-6 border-t border-line pt-5">
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <div className="mt-3 grid gap-3">{items.map((item) => (
        <article key={`${item.title}-${item.source}`} className="border-l-2 border-line pl-3 text-sm leading-6 text-zinc-700">
          <p className="font-semibold text-ink">{item.title}</p>
          <p>{item.purpose}</p><p><strong>Формат:</strong> {item.format}.</p>
          <p><strong>Кто выдаёт или составляет:</strong> {item.issuedBy}.</p>
          {item.validity ? <p><strong>Срок действия:</strong> {item.validity}.</p> : null}
          <p><strong>Кто предоставляет:</strong> {item.selfProvision}.</p>
          <p><strong>Основание:</strong> {item.source}.</p>
        </article>
      ))}</div>
    </section>
  );
}

function StringGroup({ items, title }: { items: string[]; title: string }) {
  if (!items.length) return null;
  return <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">{title}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{items.map((item) => <li key={item}>- {item}</li>)}</ul></section>;
}

function ResultFact({ text, title }: { text: string; title: string }) {
  return <section className="border-t-4 border-zinc-300 bg-white p-4 shadow-sm"><h3 className="font-semibold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p></section>;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] ?? character));
}

