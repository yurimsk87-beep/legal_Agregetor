"use client";

import Link from "next/link";
import { Download, Pencil, ShieldCheck } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { LegalReviewLawyers } from "@/components/lawyers/LegalReviewLawyers";
import { DocumentResultSummary } from "@/components/documents/DocumentResultSummary";
import { LegalFormField } from "@/components/documents/LegalFormField";
import { DocumentVersionHistory } from "@/components/documents/DocumentVersionHistory";
import { addDocumentVersion } from "@/lib/document-version-history";
import { OfficialCourtHelp } from "@/components/forms/OfficialCourtHelp";
import { DOCUMENT_REVIEW_RETENTION_DAYS } from "@/data/document-review-policy";
import { FAMILY_ADDITIVE_LEGAL_REVIEWED_AT, getFamilyAdditiveLegalRules } from "@/data/family-additive-legal-review";
import { getFamilyAdditiveScenario, type FamilyAdditiveField, type FamilyAdditiveRouteSlug } from "@/data/family-additive-routes";
import { sendAnalyticsEvent } from "@/lib/analytics-client";
import { createFamilyAdditiveDocumentResult, documentResultReviewMetadata, type DocumentResultV1 } from "@/lib/document-result-contract";
import { buildFamilyAdditiveDocument, getFamilyAdditivePdfFilename } from "@/lib/family-additive-document";
import { createFamilyAdditivePdfBlob } from "@/lib/family-additive-pdf";
import { validateFamilyAdditiveScenario, type FamilyAdditiveDecision, type FamilyAdditiveValues } from "@/lib/family-additive-validator";

type ReviewStatus = "idle" | "submitting" | "success" | "withdrawing" | "withdrawn" | "error";
type ReviewReceipt = { leadId: string; withdrawalToken: string; versionId: string };

export function FamilyAdditiveDocumentHelper({ routeSlug, scenarioKey }: { routeSlug: FamilyAdditiveRouteSlug; scenarioKey: string }) {
  const scenario = getFamilyAdditiveScenario(routeSlug, scenarioKey);
  if (!scenario) throw new Error("Сценарий не найден.");
  const documentSlug = scenario.documentSlug;
  const rules = getFamilyAdditiveLegalRules(routeSlug);
  const [values, setValues] = useState<FamilyAdditiveValues>({});
  const [decision, setDecision] = useState<FamilyAdditiveDecision | null>(null);
  const [documentResult, setDocumentResult] = useState<DocumentResultV1 | null>(null);
  const [versions, setVersions] = useState<Array<{ documentResult: DocumentResultV1; payload: { decision: FamilyAdditiveDecision; values: FamilyAdditiveValues } }>>([]);
  const documentText = documentResult?.documentText ?? "";
  const [editOpen, setEditOpen] = useState(false);
  const [issues, setIssues] = useState<Array<{ field: string; message: string }>>([]);
  const [notice, setNotice] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("idle");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewReceipt, setReviewReceipt] = useState<ReviewReceipt | null>(null);
  // Keep withdrawal credentials for earlier PDFs while this tab stays open.
  const [reviewReceipts, setReviewReceipts] = useState<ReviewReceipt[]>([]);
  const issueByField = useMemo(() => new Map(issues.map((issue) => [issue.field, issue.message])), [issues]);

  function updateField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setIssues((current) => current.filter((issue) => issue.field !== name));
    setNotice("");
  }

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateFamilyAdditiveScenario(routeSlug, scenarioKey, values);
    if (result.issues.length) {
      setIssues(result.issues);
      setNotice("Заполните обязательные сведения. Ранее сформированный результат не изменён.");
      return;
    }
    const text = buildFamilyAdditiveDocument(result);
    const generated = createFamilyAdditiveDocumentResult({
      decision: result,
      documentSlug,
      documentText: text,
      legalReviewedAt: FAMILY_ADDITIVE_LEGAL_REVIEWED_AT
    });
    setDocumentResult(generated);
    setDecision(result);
    setVersions((history) => addDocumentVersion(history, { documentResult: generated, payload: { decision: result, values: { ...values } } }));
    setIssues([]);
    setEditOpen(false);
    setReviewOpen(false);
    setReviewStatus("idle");
    setReviewMessage("");
    setReviewReceipt(null);
    setNotice("Новая версия сформирована из подтверждённых вами данных.");
  }

  function openVersion(versionId: string) {
    const snapshot = versions.find((item) => item.documentResult.versionId === versionId);
    if (!snapshot) return;
    setDocumentResult(snapshot.documentResult);
    setDecision(snapshot.payload.decision);
    setValues({ ...snapshot.payload.values });
    setEditOpen(false);
    setReviewOpen(false);
    setReviewReceipt(null);
    setReviewStatus("idle");
    setReviewMessage("");
    setNotice("Открыта предыдущая версия результата; PDF будет создан именно из неё.");
  }

  async function createPdf() {
    if (!decision || !documentResult) throw new Error("Сначала сформируйте документ.");
    return createFamilyAdditivePdfBlob(decision, documentResult.documentText, documentResult.versionId);
  }

  async function downloadPdf() {
    if (!decision) return;
    try {
      const blob = await createPdf();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = getFamilyAdditivePdfFilename(decision);
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("PDF сформирован из текущей версии результата.");
    } catch {
      setNotice("PDF не сформирован. Текущая версия результата сохранена, повторите попытку.");
    }
  }

  async function submitForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decision || !documentResult) return;
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
      payload.set("message", `Проверка PDF «${decision.documentTitle}».`);
      payload.set("documentsNote", String(input.get("documentsNote") ?? ""));
      payload.set("sourcePage", window.location.pathname);
      payload.set("sourceType", "DOCUMENT_REVIEW");
      payload.set("format", "online");
      payload.set("consent", input.get("consent") === "on" ? "true" : "false");
      payload.set("contactTransferConsent", input.get("contactTransferConsent") === "on" ? "true" : "false");
      payload.set("structuredPayload", JSON.stringify({ ...documentResultReviewMetadata(documentResult), outcomeKey: decision.outcomeKey, resultStatus: "NOT_READY_FOR_FILING", reviewStatus: "AWAITING_LAWYER_ASSIGNMENT" }));
      payload.set("attachment", new File([blob], getFamilyAdditivePdfFilename(decision), { type: "application/pdf" }));
      const response = await fetch("/api/leads/", { method: "POST", body: payload });
      const result = (await response.json().catch(() => null)) as { id?: string; message?: string; withdrawalToken?: string } | null;
      if (!response.ok) throw new Error(result?.message || "Не удалось передать PDF на проверку.");
      sendAnalyticsEvent({ type: "DOCUMENT_REVIEW_REQUEST_CREATED", sourcePage: window.location.pathname, targetType: "FAMILY_ADDITIVE_OUTCOME", targetId: decision.outcomeKey, payload: { routeSlug, scenarioKey } });
      setReviewStatus("success");
      if (result?.id && result.withdrawalToken) {
        const receipt = { leadId: result.id, withdrawalToken: result.withdrawalToken, versionId: documentResult.versionId };
        setReviewReceipt(receipt);
        setReviewReceipts((current) => [...current, receipt]);
      }
      setReviewMessage("Заявка принята и ожидает назначения юриста. PDF и контакты не публикуются.");
      form.reset();
    } catch (error) {
      setReviewStatus("error");
      setReviewMessage(error instanceof Error ? error.message : "Не удалось передать PDF на проверку.");
    }
  }

  async function withdrawReviewConsent(receipt: ReviewReceipt | null = reviewReceipt) {
    if (!receipt) return;
    setReviewStatus("withdrawing");
    setReviewMessage("");
    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(receipt.leadId)}/document-review/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: receipt.withdrawalToken })
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(result?.message || "Не удалось отозвать согласие.");
      setReviewStatus("withdrawn");
      setReviewReceipt((current) => current?.leadId === receipt.leadId ? null : current);
      setReviewReceipts((current) => current.filter((item) => item.leadId !== receipt.leadId));
      setReviewMessage(result?.message || "Согласие отозвано, PDF удалён.");
    } catch (error) {
      setReviewStatus("error");
      setReviewMessage(error instanceof Error ? error.message : "Не удалось отозвать согласие.");
    }
  }

  return (
    <section id="fill-online" className="scroll-mt-24 border border-line bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase text-trust">Подготовка документа</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">Подготовить {scenario.documentTitle.toLowerCase()}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">Укажите только подтверждённые сведения. Сервис не подставляет неизвестные факты, суд или официальный бланк.</p>

      {!decision || editOpen ? <DocumentForm fields={scenario.helperFields} values={values} issueByField={issueByField} onChange={updateField} onSubmit={generate} submitLabel={decision ? "Сформировать новый документ" : "Сформировать документ"} /> : null}

      {decision ? <div className="mt-7" aria-live="polite">
        {documentResult ? <DocumentResultSummary result={documentResult} label={decision.resultLabel}>
          {decision.notices.map((item) => <p key={item} className="mt-2 text-sm">{item}</p>)}
          {decision.redirectPath ? <Link href={decision.redirectPath} className="mt-3 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Открыть подходящий маршрут</Link> : null}
        </DocumentResultSummary> : null}

        <section className="mt-6 border-t border-line pt-5">
          <h3 className="text-xl font-semibold text-ink">Сформированный документ</h3>
          <div className="mt-4 whitespace-pre-wrap border border-line bg-zinc-50 p-4 font-mono text-sm leading-6 text-ink">{documentText}</div>
          {decision.officialForm ? <a href={decision.officialForm.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4">Открыть официальную форму № {decision.officialForm.number}</a> : null}
        </section>

        <section className="mt-6 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold text-ink">Подготовленные сведения</h3><button type="button" onClick={() => setEditOpen((current) => !current)} className="inline-flex min-h-11 items-center gap-2 font-semibold text-trust underline underline-offset-4"><Pencil className="h-4 w-4" aria-hidden="true" /> Редактировать данные</button></div>
          <dl className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">{decision.preparedData.map((item) => <div key={item.label} className="border-l-2 border-line pl-3"><dt className="font-semibold text-ink">{item.label}</dt><dd className="whitespace-pre-wrap break-words text-zinc-700">{item.value}</dd></div>)}</dl>
        </section>

        <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Что делать дальше</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">{decision.filingSteps.map((item, index) => <li key={item}><strong>{index + 1}.</strong> {item}</li>)}</ol></section>

        <section className="mt-6 border-t border-line pt-5"><h3 className="text-xl font-semibold text-ink">Правовые основания</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{rules.map((rule) => <li key={rule.id}><a href={rule.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-medium text-trust underline underline-offset-4">{rule.act}, {rule.article}</a><span className="block text-zinc-700">{rule.statement}</span><span className="block text-xs text-zinc-600">Ограничение: {rule.limitation}</span></li>)}</ul></section>

        {decision.requiresLegalReview ? <section className="mt-6 border-t border-line pt-5"><LegalReviewLawyers context={{ route: `/documents/${scenario.documentSlug}/`, scenario: scenarioKey, documentTitle: decision.documentTitle }} /></section> : null}

        <section className="mt-6 border-t border-line pt-6">
          <h3 className="text-xl font-semibold text-ink">Итоговый результат</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-700">Для скачивания и проверки используется именно текущая сформированная версия.</p>
          {documentResult ? <p className="mt-1 break-all text-xs text-zinc-500">ID версии: {documentResult.versionId}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink"><Download className="h-4 w-4" aria-hidden="true" /> Скачать PDF</button><button type="button" onClick={() => setReviewOpen((current) => !current)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-trust px-5 py-3 text-sm font-semibold text-trust hover:bg-zinc-50"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Отправить на проверку юристу</button></div>
        </section>

        {reviewOpen ? <ReviewForm status={reviewStatus} message={reviewMessage} hasReceipt={Boolean(reviewReceipt)} onSubmit={submitForReview} onWithdraw={withdrawReviewConsent} /> : null}
      </div> : null}
      <DocumentVersionHistory versions={versions.map((item) => item.documentResult)} currentVersionId={documentResult?.versionId ?? null} onSelect={openVersion} />
      {reviewReceipts.length ? <section className="mt-6 border-t border-line pt-5" aria-label="Отзыв согласия для ранее отправленных PDF">
        <h3 className="text-lg font-semibold text-ink">Ранее отправленные версии PDF</h3>
        <p className="mt-2 text-sm text-zinc-600">Вы можете отозвать согласие для каждой отправленной версии независимо от текущего документа. Данные доступны, пока открыта эта вкладка.</p>
        <div className="mt-3 grid gap-3">
          {reviewReceipts.map((receipt) => <div key={receipt.leadId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3">
            <span className="break-all text-xs text-zinc-700">Версия: {receipt.versionId}</span>
            <button type="button" disabled={reviewStatus === "withdrawing"} onClick={() => void withdrawReviewConsent(receipt)} className="min-h-11 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink disabled:opacity-60">Отозвать согласие и удалить PDF</button>
          </div>)}
        </div>
      </section> : null}
      {notice ? <p className="mt-4 text-sm text-zinc-700" role="status">{notice}</p> : null}
    </section>
  );
}

function DocumentForm({ fields, issueByField, onChange, onSubmit, submitLabel, values }: { fields: FamilyAdditiveField[]; issueByField: Map<string, string>; onChange: (name: string, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitLabel: string; values: FamilyAdditiveValues }) {
  return <form onSubmit={onSubmit} className="mt-6 grid gap-5"><div className="grid gap-5 sm:grid-cols-2">{fields.map((field) => <HelperField key={field.name} field={field} value={values[field.name] ?? ""} error={issueByField.get(field.name)} onChange={onChange} />)}</div><button type="submit" className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">{submitLabel}</button></form>;
}

function HelperField({ error, field, onChange, value }: { error?: string; field: FamilyAdditiveField; onChange: (name: string, value: string) => void; value: string }) {
  return <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
    {field.name === "courtName" ? <OfficialCourtHelp /> : null}
    <LegalFormField
      id={`family-additive-${field.name}`}
      label={field.label} value={value} onChange={(next) => onChange(field.name, next)}
      kind={field.type === "court-name" ? "text" : field.type}
      required={field.required ?? false} hint={field.hint} error={error}
      options={field.options}
    />
  </div>;
}

function ReviewForm({ hasReceipt, message, onSubmit, onWithdraw, status }: { hasReceipt: boolean; message: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onWithdraw: () => void; status: ReviewStatus }) {
  return <form onSubmit={onSubmit} className="mt-5 grid gap-4 border border-line bg-zinc-50 p-5"><div><h3 className="text-lg font-semibold text-ink">Передать PDF на проверку</h3><p className="mt-1 text-sm leading-6 text-zinc-700">Передаются только текущий PDF и указанные контакты. Закрытый PDF хранится до {DOCUMENT_REVIEW_RETENTION_DAYS} дней; согласие можно отозвать.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium text-zinc-700">Имя<input name="name" required minLength={2} className="min-h-11 rounded-md border border-line bg-white px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium text-zinc-700">Телефон<input name="phone" required minLength={6} className="min-h-11 rounded-md border border-line bg-white px-3 py-2" /></label></div><label className="grid gap-1 text-sm font-medium text-zinc-700">Email<input name="email" type="email" className="min-h-11 rounded-md border border-line bg-white px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium text-zinc-700">Комментарий юристу<textarea name="documentsNote" rows={3} maxLength={1200} className="min-h-24 rounded-md border border-line bg-white px-3 py-2" /></label><label className="flex items-start gap-2 text-sm leading-6 text-zinc-700"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" /><span>Согласен на обработку персональных данных. <Link href="/legal/personal-data-consent/" className="font-semibold text-trust underline underline-offset-4">Условия согласия</Link>.</span></label><label className="flex items-start gap-2 text-sm leading-6 text-zinc-700"><input name="contactTransferConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0" /><span>Отдельно соглашаюсь передать текущий PDF и мои контакты назначенному одобренному юристу.</span></label><button type="submit" disabled={["submitting", "success", "withdrawing", "withdrawn"].includes(status)} className="inline-flex min-h-11 w-fit items-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{status === "submitting" ? "Отправляем" : status === "success" ? "Заявка принята" : "Передать PDF юристу"}</button>{hasReceipt ? <button type="button" onClick={onWithdraw} disabled={status === "withdrawing"} className="inline-flex min-h-11 w-fit items-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink disabled:opacity-60">{status === "withdrawing" ? "Удаляем PDF" : "Отозвать согласие и удалить PDF"}</button> : null}{message ? <p role="status" className={`text-sm font-medium ${status === "error" ? "text-red-700" : "text-leaf"}`}>{message}</p> : null}</form>;
}
