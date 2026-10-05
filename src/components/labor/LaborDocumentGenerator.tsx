"use client";

import { Download, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { LegalReviewLawyers } from "@/components/lawyers/LegalReviewLawyers";
import type { LaborDocumentScenario } from "@/data/labor-documents";
import type { LaborLegalRule } from "@/data/labor-legal-sources";
import type { NavigatorDocument } from "@/data/documents";
import type { LaborDocumentResponse } from "@/lib/labor-document-contract";
import { createLaborDocumentPdfBlob, laborDocumentFilename } from "@/lib/labor-document-export";

type GeneratedVersion = LaborDocumentResponse & { answers: Record<string, string> };
type Field = { key: string; label: string; hint: string };

export function LaborDocumentGenerator({ document, selected, rules }: { document: NavigatorDocument; selected: LaborDocumentScenario; rules: LaborLegalRule[] }) {
  const fields = useMemo(() => buildFields(selected), [selected]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [version, setVersion] = useState<GeneratedVersion | null>(null);
  const [editing, setEditing] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewPending, setReviewPending] = useState(false);

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
      const body = await response.json().catch(() => null) as { result?: LaborDocumentResponse; message?: string } | null;
      if (!response.ok || !body?.result) throw new Error(body?.message || "Не удалось сформировать документ.");
      setVersion({ ...body.result, answers: { ...answers } });
      setEditing(false);
      setStatus("idle");
      setMessage("Новая версия документа сформирована.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось сформировать документ. Введенные данные сохранены.");
    }
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
      reviewedAt: version.legalRegistryReviewedAt
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
        route: selected.route.slug,
        scenarioId: selected.scenario.key,
        documentSlug: document.slug,
        documentVersionId: version.versionId,
        generatorVersion: version.generatorVersion,
        legalRegistryReviewedAt: version.legalRegistryReviewedAt,
        filingReady: version.filingReady,
        requiresLegalReview: version.requiresLegalReview,
        consentTextVersion: "document-review-2026-10-05"
      }));
      payload.set("attachment", new File([blob], laborDocumentFilename(document.slug, "pdf"), { type: "application/pdf" }));
      const response = await fetch("/api/leads/", { method: "POST", body: payload });
      const body = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(body?.message || "Не удалось передать документ.");
      setReviewMessage("Сформированный PDF и указанные контакты приняты для назначения профильного юриста.");
      event.currentTarget.reset();
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : "Не удалось передать документ.");
    } finally {
      setReviewPending(false);
    }
  }

  return <section id="fill-online" className="mt-8 scroll-mt-28">
    {editing ? <section aria-labelledby="labor-document-form-title">
      <h2 id="labor-document-form-title" className="text-2xl font-semibold text-ink">{version ? "Редактирование сведений" : "Подготовка документа"}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">Заполните только подтвержденные сведения. Текущая сформированная версия не изменится, пока вы явно не сформируете новую.</p>
      <div className="mt-5 grid gap-5">
        {fields.map((field) => <label key={field.key} className="grid gap-2 font-semibold text-ink">{field.label}<textarea value={answers[field.key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))} rows={field.key === "circumstances" || field.key === "attachments" ? 4 : 2} className="w-full rounded-md border border-line px-3 py-3 font-normal text-ink outline-none focus:border-trust focus:ring-2 focus:ring-trust/20" /><span className="text-xs font-normal text-zinc-500">{field.hint}</span></label>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <button type="button" onClick={generate} disabled={status === "loading"} className="inline-flex min-h-11 items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{status === "loading" ? "Формируем документ" : version ? "Сформировать новый документ" : "Сформировать документ"}</button>
        {version ? <button type="button" onClick={cancelEditing} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Отменить редактирование</button> : null}
      </div>
    </section> : null}
    {message ? <p className={`mt-3 text-sm ${status === "error" ? "text-red-800" : "text-zinc-700"}`} role={status === "error" ? "alert" : "status"}>{message}</p> : null}

    {version ? <div className={editing ? "mt-10 border-t border-line pt-7" : ""} aria-live="polite">
      <section className="border-l-4 border-amber-400 bg-amber-50 p-4 text-amber-950">
        <p className="font-semibold">ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА</p>
        <h2 className="mt-2 text-2xl font-semibold">{version.documentTitle}</h2>
        <p className="mt-2 text-sm leading-6">Готовность к подаче не подтверждена. Проверьте адресат, срок, требования, расчет и приложения.</p>
      </section>

      <section className="mt-6 border border-line bg-white p-5" aria-labelledby="generated-document-title">
        <h3 id="generated-document-title" className="text-xl font-semibold text-ink">Сформированный документ</h3>
        <pre className="mt-4 whitespace-pre-wrap font-serif text-base leading-7 text-ink">{version.draftText}</pre>
      </section>

      <section className="mt-6 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3><button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Редактировать данные</button></div>
        <dl className="mt-4 grid gap-3 text-sm leading-6">{fields.map((field) => <div key={field.key} className="border-l-2 border-line pl-3"><dt className="font-semibold text-ink">{field.label}</dt><dd className="whitespace-pre-wrap text-zinc-700">{version.answers[field.key]}</dd></div>)}</dl>
      </section>

      <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Что делать дальше</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{selected.scenario.nextSteps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}</ol></section>

      <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><div className="mt-4 grid gap-4">{rules.filter((rule) => version.usedRuleIds.includes(rule.id)).map((rule) => <article key={rule.id} className="border-l-2 border-line pl-4"><p className="font-semibold text-ink">{rule.act}, {rule.provisions.join(", ")}</p><p className="mt-1 text-sm leading-6 text-zinc-700">{rule.statement}</p><p className="mt-1 text-xs leading-5 text-zinc-500">Ограничение: {rule.limitations}</p><a href={rule.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Официальный источник</a></article>)}</div></section>

      <LegalReviewLawyers context={{ route: `/documents/${document.slug}/`, scenario: selected.scenario.key, documentTitle: version.documentTitle }} serviceSlug="trudovye-spory" />

      <section className="mt-6 border-t border-line pt-6"><h3 className="text-xl font-semibold text-ink">Итоговый результат</h3><p className="mt-2 text-sm leading-6 text-zinc-600">Для проверки передаются только текущий PDF и указанные вами контакты после отдельного согласия.</p>
        <form onSubmit={submitReview} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3"><label className="grid gap-1 text-sm font-semibold text-ink">Имя<input name="name" required minLength={2} className="min-h-11 rounded-md border border-line px-3 font-normal" /></label><label className="grid gap-1 text-sm font-semibold text-ink">Телефон<input name="phone" required minLength={6} className="min-h-11 rounded-md border border-line px-3 font-normal" /></label><label className="grid gap-1 text-sm font-semibold text-ink">Email<input name="email" type="email" className="min-h-11 rounded-md border border-line px-3 font-normal" /></label></div>
          <label className="grid gap-1 text-sm font-semibold text-ink">Комментарий юристу<textarea name="documentsNote" rows={2} className="rounded-md border border-line px-3 py-2 font-normal" /></label>
          <label className="flex gap-3 text-sm leading-6 text-zinc-700"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />Согласен на обработку указанных данных для проверки этой версии документа.</label>
          <label className="flex gap-3 text-sm leading-6 text-zinc-700"><input name="contactTransferConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" />Согласен на передачу контактов назначенному одобренному юристу.</label>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white"><Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF</button><button type="submit" disabled={reviewPending} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust disabled:opacity-60"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{reviewPending ? "Отправляем" : "Отправить на проверку юристу"}</button></div>
        </form>
        {reviewMessage ? <p className="mt-3 text-sm text-zinc-700" role="status">{reviewMessage}</p> : null}
      </section>
    </div> : null}
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
    { key: "documentDate", label: "Дата документа", hint: "В формате ДД.ММ.ГГГГ." }
  ];
  return [...common, ...selected.scenario.questions.map((label, index) => ({ key: `scenario-${index + 1}`, label, hint: "Ответьте по имеющимся документам или переписке." }))];
}
