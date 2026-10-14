"use client";

import { Download, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { LegalReviewLawyers } from "@/components/lawyers/LegalReviewLawyers";
import { DocumentResultSummary } from "@/components/documents/DocumentResultSummary";
import { LegalFormField } from "@/components/documents/LegalFormField";
import { DocumentVersionHistory } from "@/components/documents/DocumentVersionHistory";
import { addDocumentVersion } from "@/lib/document-version-history";
import { createLaborDocumentResult, documentResultReviewMetadata, documentResultSchema, type DocumentResultV1 } from "@/lib/document-result-contract";
import type { LaborDocumentScenario } from "@/data/labor-documents";
import type { LaborLegalRule } from "@/data/labor-legal-sources";
import type { LaborDocumentResponse } from "@/lib/labor-document-contract";
import { createLaborDocumentPdfBlob, laborDocumentFilename } from "@/lib/labor-document-export";

type GeneratedVersion = LaborDocumentResponse & { answers: Record<string, string>; documentResult: DocumentResultV1 };
type Field = { key: string; label: string; hint: string; kind?: "date" | "textarea" };
type ReviewReceipt = { leadId: string; withdrawalToken: string; versionId: string };

export function LaborDocumentGenerator({ document, selected, rules }: { document: { slug: string }; selected: LaborDocumentScenario; rules: LaborLegalRule[] }) {
  const fields = useMemo(() => buildFields(selected), [selected]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [version, setVersion] = useState<GeneratedVersion | null>(null);
  const [versions, setVersions] = useState<Array<{ documentResult: DocumentResultV1; payload: GeneratedVersion }>>([]);
  const [editing, setEditing] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewReceipts, setReviewReceipts] = useState<ReviewReceipt[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  async function generate() {
    const missing = fields.filter((field) => !answers[field.key]?.trim());
    if (missing.length) {
      setMessage(`Заполните обязательные сведения: ${missing.map((field) => field.label).join(", ")}.`);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/labor-documents/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeSlug: selected.route.slug,
          scenarioKey: selected.scenario.key,
          documentSlug: selected.scenario.documentSlug,
          facts: fields.map((field) => ({ key: field.key, label: field.label, value: answers[field.key].trim() }))
        })
      });
      const body = await response.json().catch(() => null) as { result?: LaborDocumentResponse; documentResult?: DocumentResultV1; message?: string } | null;
      if (!response.ok || !body?.result) throw new Error(body?.message || "Не удалось сформировать документ.");
      const commonResult = body.documentResult
        ? documentResultSchema.parse(body.documentResult)
        : createLaborDocumentResult({
          routeSlug: selected.route.slug,
          scenarioKey: selected.scenario.key,
          documentSlug: document.slug,
          result: body.result
        });
      if (commonResult.versionId !== body.result.versionId || commonResult.documentText !== body.result.draftText || commonResult.documentSlug !== document.slug) {
        throw new Error("Несоответствие версии документа. Попробуйте сформировать документ заново.");
      }
      const snapshot = { ...body.result, answers: { ...answers }, documentResult: commonResult };
      setVersion(snapshot);
      setVersions((history) => addDocumentVersion(history, { documentResult: commonResult, payload: snapshot }));
      setEditing(false);
      setReviewOpen(false);
      setReviewMessage("");
      setStatus("idle");
      setMessage("Новая версия документа сформирована.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось сформировать документ. Введенные данные сохранены.");
    }
  }

  function openVersion(versionId: string) {
    const snapshot = versions.find((item) => item.documentResult.versionId === versionId)?.payload;
    if (!snapshot) return;
    setVersion(snapshot);
    setAnswers({ ...snapshot.answers });
    setEditing(false);
    setReviewOpen(false);
    setReviewMessage("");
    setMessage("Выбрана ранее сформированная версия. PDF будет создан из неё.");
  }

  function cancelEditing() {
    if (version) setAnswers({ ...version.answers });
    setEditing(false);
    setMessage("");
  }

  async function createPdf() {
    if (!version) throw new Error("Сначала сформируйте документ.");
    return createLaborDocumentPdfBlob({
      statusLabel: "ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА",
      documentTitle: version.documentTitle,
      documentText: version.draftText,
      rules: rules.filter((rule) => version.usedRuleIds.includes(rule.id)),
      nextSteps: selected.scenario.nextSteps,
      reviewedAt: version.legalRegistryReviewedAt,
      versionId: version.documentResult.versionId
    });
  }

  async function downloadPdf() {
    try {
      const blob = await createPdf();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = laborDocumentFilename(document.slug, "pdf");
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("PDF сформирован из текущей версии документа.");
    } catch {
      setMessage("PDF не сформирован. Попробуйте еще раз.");
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!version) return;
    setReviewPending(true);
    setReviewMessage("");
    const input = new FormData(event.currentTarget);
    try {
      const blob = await createPdf();
      const payload = new FormData();
      payload.set("name", String(input.get("name") ?? ""));
      payload.set("phone", String(input.get("phone") ?? ""));
      payload.set("email", String(input.get("email") ?? ""));
      payload.set("message", `Проверка сформированной версии документа «${version.documentTitle}».`);
      payload.set("documentsNote", String(input.get("documentsNote") ?? ""));
      payload.set("sourcePage", window.location.pathname);
      payload.set("sourceType", "DOCUMENT_REVIEW");
      payload.set("format", "online");
      payload.set("consent", input.get("consent") === "on" ? "true" : "false");
      payload.set("contactTransferConsent", input.get("contactTransferConsent") === "on" ? "true" : "false");
      payload.set("structuredPayload", JSON.stringify({
        ...documentResultReviewMetadata(version.documentResult),
        consentTextVersion: "document-review-2026-10-05"
      }));
      payload.set("attachment", new File([blob], laborDocumentFilename(document.slug, "pdf"), { type: "application/pdf" }));
      const response = await fetch("/api/leads/", { method: "POST", body: payload });
      const body = await response.json().catch(() => null) as { id?: string; withdrawalToken?: string; message?: string } | null;
      if (!response.ok) throw new Error(body?.message || "Не удалось передать документ.");
      if (body?.id && body.withdrawalToken) {
        setReviewReceipts((current) => [...current, { leadId: body.id!, withdrawalToken: body.withdrawalToken!, versionId: version.documentResult.versionId }]);
      }
      setReviewMessage("Сформированный PDF и указанные контакты приняты для назначения профильного юриста.");
      event.currentTarget.reset();
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "Не удалось передать документ.");
    } finally {
      setReviewPending(false);
    }
  }

  async function withdrawReviewConsent(receipt: ReviewReceipt) {
    setWithdrawingId(receipt.leadId);
    setReviewMessage("");
    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(receipt.leadId)}/document-review/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: receipt.withdrawalToken })
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message || "Не удалось отозвать согласие.");
      setReviewReceipts((current) => current.filter((item) => item.leadId !== receipt.leadId));
      setReviewMessage(result?.message || "Согласие отозвано, PDF удалён.");
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "Не удалось отозвать согласие.");
    } finally {
      setWithdrawingId(null);
    }
  }

  return <section id="fill-online" className="mt-8 scroll-mt-28">
    {editing ? <section aria-labelledby="labor-document-form-title">
      <h2 id="labor-document-form-title" className="text-2xl font-semibold text-ink">{version ? "Редактирование сведений" : "Подготовка документа"}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">Заполните только подтвержденные сведения. Текущая сформированная версия не изменится, пока вы явно не сформируете новую.</p>
      <div className="mt-5 grid gap-5">
        {fields.map((field) => <LegalFormField key={field.key}
          id={`labor-${selected.route.slug}-${selected.scenario.key}-${field.key}`}
          label={field.label} hint={field.hint} required
          kind={field.kind ?? "textarea"}
          rows={field.key === "circumstances" || field.key === "attachments" ? 4 : 2}
          value={answers[field.key] ?? ""}
          onChange={(next) => setAnswers((current) => ({ ...current, [field.key]: next }))}
        />)}
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <button type="button" onClick={generate} disabled={status === "loading"} className="inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{status === "loading" ? "Формируем документ" : version ? "Сформировать новый документ" : "Сформировать документ"}</button>
        {version ? <button type="button" onClick={cancelEditing} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Отменить редактирование</button> : null}
      </div>
    </section> : null}
    {message ? <p className={`mt-3 text-sm ${status === "error" ? "text-red-800" : "text-zinc-700"}`} role={status === "error" ? "alert" : "status"}>{message}</p> : null}

    {version ? <div className={editing ? "mt-10 border-t border-line pt-7" : ""} aria-live="polite">
      <DocumentResultSummary result={version.documentResult}>
        <p className="mt-2 text-sm">Проверьте адресат, срок, требования, расчёт и приложения.</p>
      </DocumentResultSummary>

      <section className="mt-6 border border-line bg-white p-5" aria-labelledby="generated-document-title" data-result-section="generated-document">
        <h3 id="generated-document-title" className="text-xl font-semibold text-ink">Сформированный документ</h3>
        <pre className="mt-4 whitespace-pre-wrap font-serif text-base leading-7 text-ink">{version.draftText}</pre>
      </section>

      <section className="mt-6 border-t border-line pt-6" data-result-section="final-actions">
        <h3 className="text-xl font-semibold text-ink">Итоговый результат</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Для проверки передаются только текущий PDF и указанные вами контакты после отдельного согласия.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white"><Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF</button>
          <button type="button" onClick={() => setReviewOpen((current) => !current)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Отправить на проверку юристу</button>
        </div>
        {reviewOpen ? <form onSubmit={submitReview} className="mt-5 grid gap-4 border border-line bg-zinc-50 p-5">
          <div><h4 className="text-lg font-semibold text-ink">Передать PDF на проверку</h4><p className="mt-1 text-sm leading-6 text-zinc-700">Форма относится только к текущей сформированной версии документа.</p></div>
          <div className="grid gap-4 md:grid-cols-3"><label className="grid gap-1 text-sm font-semibold text-ink">Имя<input name="name" required minLength={2} className="min-h-11 rounded-md border border-line bg-white px-3 font-normal" /></label><label className="grid gap-1 text-sm font-semibold text-ink">Телефон<input name="phone" required minLength={6} className="min-h-11 rounded-md border border-line bg-white px-3 font-normal" /></label><label className="grid gap-1 text-sm font-semibold text-ink">Email<input name="email" type="email" className="min-h-11 rounded-md border border-line bg-white px-3 font-normal" /></label></div>
          <label className="grid gap-1 text-sm font-semibold text-ink">Комментарий юристу<textarea name="documentsNote" rows={2} className="rounded-md border border-line bg-white px-3 py-2 font-normal" /></label>
          <label className="flex gap-3 text-sm leading-6 text-zinc-700"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />Согласен на обработку указанных данных для проверки этой версии документа.</label>
          <label className="flex gap-3 text-sm leading-6 text-zinc-700"><input name="contactTransferConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />Согласен на передачу сформированного PDF и контактов назначенному одобренному юристу.</label>
          <button type="submit" disabled={reviewPending} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{reviewPending ? "Отправляем" : "Передать PDF юристу"}</button>
          {reviewMessage ? <p className="text-sm text-zinc-700" role="status">{reviewMessage}</p> : null}
        </form> : null}
      </section>

      <section className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3><button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Редактировать данные</button></div>
        <dl className="mt-4 grid gap-3 text-sm leading-6">{fields.map((field) => <div key={field.key} className="border-l-2 border-line pl-3"><dt className="font-semibold text-ink">{field.label}</dt><dd className="whitespace-pre-wrap text-zinc-700">{version.answers[field.key]}</dd></div>)}</dl>
      </section>

      <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Что делать дальше</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{selected.scenario.nextSteps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section>

      <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><div className="mt-4 grid gap-4">{rules.filter((rule) => version.usedRuleIds.includes(rule.id)).map((rule) => <article key={rule.id} className="border-l-2 border-line pl-4"><p className="font-semibold text-ink">{rule.act}, {rule.provisions.join(", ")}</p><p className="mt-1 text-sm leading-6 text-zinc-700">{rule.statement}</p><p className="mt-1 text-xs leading-5 text-zinc-500">Ограничение: {rule.limitations}</p><a href={rule.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Официальный источник</a></article>)}</div></section>

      <LegalReviewLawyers context={{ route: `/documents/${document.slug}/`, scenario: selected.scenario.key, documentTitle: version.documentTitle }} serviceSlug="trudovye-spory" />
    </div> : null}
    <DocumentVersionHistory versions={versions.map((item) => item.documentResult)} currentVersionId={version?.documentResult.versionId ?? null} onSelect={openVersion} />
    {reviewReceipts.length ? <section className="mt-8 border-t border-line pt-5" aria-label="Отзыв согласия на предыдущие PDF">
      <h2 className="text-xl font-semibold text-ink">Ранее отправленные версии PDF</h2>
      <p className="mt-2 text-sm text-zinc-600">Каждую ранее отправленную версию можно удалить отдельно, не меняя текущий документ. Квитанции хранятся только в открытой вкладке.</p>
      <div className="mt-4 grid gap-3">
        {reviewReceipts.map((receipt) => <div key={receipt.leadId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3">
          <span className="break-all text-xs text-zinc-600">Версия: {receipt.versionId}</span>
          <button type="button" onClick={() => void withdrawReviewConsent(receipt)} disabled={withdrawingId !== null} className="min-h-11 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink disabled:opacity-60">{withdrawingId === receipt.leadId ? "Удаляем PDF" : "Отозвать согласие и удалить PDF"}</button>
        </div>)}
      </div>
    </section> : null}
  </section>;
}

function buildFields(selected: LaborDocumentScenario): Field[] {
  const common: Field[] = [
    { key: "applicant", label: "ФИО работника или заявителя", hint: "Полностью, как в документах." },
    { key: "applicantContacts", label: "Адрес и контакты заявителя", hint: "Укажите только сведения, необходимые для документа и обратной связи." },
    { key: "employer", label: "Работодатель", hint: "Полное наименование организации или ФИО работодателя." },
    { key: "employerAddress", label: "Адрес работодателя", hint: "Юридический или подтвержденный адрес для направления документа." },
    { key: "recipient", label: "Подтвержденный адресат", hint: `Допустимый класс адресата: ${selected.scenario.authority.join(", ")}. Для суда или органа укажите точное наименование.` },
    { key: "recipientAddress", label: "Адрес получателя", hint: "Не указывайте предполагаемый адрес." },
    { key: "circumstances", label: "Подтвержденные обстоятельства", hint: "Краткая хронология с датами и документами без правовых предположений." },
    { key: "requestedOutcome", label: "Просьба или требования", hint: "Что именно должен сделать адресат." },
    { key: "attachments", label: "Приложения", hint: "Каждый документ с новой строки; если приложений нет, укажите это прямо." },
    { key: "documentDate", label: "Дата документа", hint: "Выберите дату. В генератор передаётся календарная дата в формате ГГГГ-ММ-ДД.", kind: "date" }
  ];
  return [...common, ...selected.scenario.questions.map((label, index) => ({ key: `scenario-${index + 1}`, label, hint: "Ответьте по имеющимся документам или переписке." }))];
}
