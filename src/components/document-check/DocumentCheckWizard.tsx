"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode, type RefObject } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, FileText, LockKeyhole, RefreshCw, Send, ShieldCheck, Trash2, UploadCloud, type LucideIcon } from "lucide-react";
import {
  analyzeDocumentCheck,
  documentCheckGoalOptions,
  documentCheckSenderOptions,
  documentCheckUrgencyOptions,
  documentReviewCheckOptions,
  documentReviewStatuses,
  supportedDocumentTypeOptions,
  type DocumentCheckGoal,
  type DocumentCheckSender,
  type DocumentCheckUrgency
} from "@/lib/document-check";

const acceptedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const maxFileSizeBytes = 15 * 1024 * 1024;

type Step = "upload" | "clarify" | "result";

export function DocumentCheckWizard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [sender, setSender] = useState<DocumentCheckSender | "">("");
  const [goal, setGoal] = useState<DocumentCheckGoal | "">("understand");
  const [urgency, setUrgency] = useState<DocumentCheckUrgency | "">("");
  const [knownType, setKnownType] = useState("");
  const [error, setError] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewContact, setReviewContact] = useState("");
  const [reviewNeed, setReviewNeed] = useState(documentReviewCheckOptions[0]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewConsent, setReviewConsent] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const analysis = useMemo(
    () =>
      analyzeDocumentCheck({
        description,
        fileName: file?.name,
        goal,
        knownType,
        sender,
        urgency
      }),
    [description, file?.name, goal, knownType, sender, urgency]
  );

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  }

  function handleFile(selectedFile: File) {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError("");
    setReviewSubmitted(false);
    setStep("clarify");
  }

  function handleTextMode() {
    setFile(null);
    setError("");
    setReviewSubmitted(false);
    setStep("clarify");
  }

  function handleDeleteDocument() {
    setFile(null);
    setDescription("");
    setSender("");
    setGoal("understand");
    setUrgency("");
    setKnownType("");
    setReviewSubmitted(false);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleShowResult() {
    if (!file && !description.trim()) {
      setError("Загрузите документ или кратко опишите его словами.");
      return;
    }

    setError("");
    setStep("result");
  }

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewConsent) {
      setError("Перед отправкой документа юристу нужно согласие на обработку персональных данных.");
      return;
    }

    if (!reviewContact.trim()) {
      setError("Укажите email или телефон для ответа юриста.");
      return;
    }

    setError("");
    setReviewSubmitted(true);
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
      {step === "upload" ? (
        <UploadStep
          error={error}
          fileInputRef={fileInputRef}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
          onTextMode={handleTextMode}
        />
      ) : null}

      {step === "clarify" ? (
        <ClarifyStep
          description={description}
          error={error}
          file={file}
          goal={goal}
          knownType={knownType}
          onBack={() => setStep("upload")}
          onDeleteDocument={handleDeleteDocument}
          onDescriptionChange={setDescription}
          onGoalChange={setGoal}
          onKnownTypeChange={setKnownType}
          onSenderChange={setSender}
          onShowResult={handleShowResult}
          onUrgencyChange={setUrgency}
          sender={sender}
          urgency={urgency}
        />
      ) : null}

      {step === "result" ? (
        <ResultStep
          analysis={analysis}
          error={error}
          file={file}
          onBack={() => setStep("clarify")}
          onDeleteDocument={handleDeleteDocument}
          onReviewSubmit={handleReviewSubmit}
          reviewComment={reviewComment}
          reviewConsent={reviewConsent}
          reviewContact={reviewContact}
          reviewName={reviewName}
          reviewNeed={reviewNeed}
          reviewSubmitted={reviewSubmitted}
          setReviewComment={setReviewComment}
          setReviewConsent={setReviewConsent}
          setReviewContact={setReviewContact}
          setReviewName={setReviewName}
          setReviewNeed={setReviewNeed}
        />
      ) : null}
    </div>
  );
}

function UploadStep({
  error,
  fileInputRef,
  onDrop,
  onFileInput,
  onTextMode
}: {
  error: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onTextMode: () => void;
}) {
  return (
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="rounded-lg border-2 border-dashed border-line bg-zinc-50 p-6 text-center transition hover:border-trust sm:p-8"
      >
        <UploadCloud className="mx-auto h-10 w-10 text-trust" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold text-ink">Перетащите файл сюда или выберите на устройстве</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">PDF, DOC, DOCX, JPG, PNG до 15 МБ.</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
          Можно загрузить судебный приказ, постановление пристава, претензию, договор, заявление или другой юридический документ.
        </p>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={onFileInput} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink"
        >
          Загрузить документ
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onTextMode} className="text-left text-sm font-semibold text-trust hover:text-ink">
          Описать документ словами
        </button>
        <p className="text-sm leading-6 text-zinc-600">Загрузка нужна только для разбора и проверки документа.</p>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}

      <PrivacyNotice />
    </div>
  );
}

function ClarifyStep({
  description,
  error,
  file,
  goal,
  knownType,
  onBack,
  onDeleteDocument,
  onDescriptionChange,
  onGoalChange,
  onKnownTypeChange,
  onSenderChange,
  onShowResult,
  onUrgencyChange,
  sender,
  urgency
}: {
  description: string;
  error: string;
  file: File | null;
  goal: DocumentCheckGoal | "";
  knownType: string;
  onBack: () => void;
  onDeleteDocument: () => void;
  onDescriptionChange: (value: string) => void;
  onGoalChange: (value: DocumentCheckGoal | "") => void;
  onKnownTypeChange: (value: string) => void;
  onSenderChange: (value: DocumentCheckSender | "") => void;
  onShowResult: () => void;
  onUrgencyChange: (value: DocumentCheckUrgency | "") => void;
  sender: DocumentCheckSender | "";
  urgency: DocumentCheckUrgency | "";
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">{file ? "Документ загружен" : "Описание документа"}</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">Уточните несколько деталей</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">Сейчас мы попробуем определить тип документа и показать, на что обратить внимание.</p>

      {file ? <FileSummary file={file} onDeleteDocument={onDeleteDocument} /> : null}

      <div className="mt-5 grid gap-4">
        <SelectField label="Если знаете тип документа" value={knownType} onChange={onKnownTypeChange} options={supportedDocumentTypeOptions} />
        <SelectField label="Кто прислал документ?" value={sender} onChange={(value) => onSenderChange(value as DocumentCheckSender | "")} options={[{ value: "", label: "Выберите вариант" }, ...documentCheckSenderOptions]} />
        <SelectField label="Что вы хотите сделать?" value={goal} onChange={(value) => onGoalChange(value as DocumentCheckGoal | "")} options={[{ value: "", label: "Выберите вариант" }, ...documentCheckGoalOptions]} />
        <SelectField label="Есть ли срочность?" value={urgency} onChange={(value) => onUrgencyChange(value as DocumentCheckUrgency | "")} options={[{ value: "", label: "Выберите вариант" }, ...documentCheckUrgencyOptions]} />
        <label className="block">
          <span className="text-sm font-semibold text-ink">Что написано в документе или что вас смущает?</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.currentTarget.value)}
            rows={5}
            placeholder="Например: пришёл судебный приказ на 48 000 руб., получил 12.06.2026, не согласен с долгом"
            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
          />
        </label>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onShowResult} className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
          Показать разбор
        </button>
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
          Заменить файл
        </button>
      </div>
    </div>
  );
}

function ResultStep({
  analysis,
  error,
  file,
  onBack,
  onDeleteDocument,
  onReviewSubmit,
  reviewComment,
  reviewConsent,
  reviewContact,
  reviewName,
  reviewNeed,
  reviewSubmitted,
  setReviewComment,
  setReviewConsent,
  setReviewContact,
  setReviewName,
  setReviewNeed
}: {
  analysis: ReturnType<typeof analyzeDocumentCheck>;
  error: string;
  file: File | null;
  onBack: () => void;
  onDeleteDocument: () => void;
  onReviewSubmit: (event: FormEvent<HTMLFormElement>) => void;
  reviewComment: string;
  reviewConsent: boolean;
  reviewContact: string;
  reviewName: string;
  reviewNeed: string;
  reviewSubmitted: boolean;
  setReviewComment: (value: string) => void;
  setReviewConsent: (value: boolean) => void;
  setReviewContact: (value: string) => void;
  setReviewName: (value: string) => void;
  setReviewNeed: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Автоматический разбор</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Что видно по документу</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Разбор помогает понять содержание документа и возможные следующие шаги, но не является индивидуальной юридической консультацией.
          </p>
        </div>
        <button type="button" onClick={onDeleteDocument} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-red-300 hover:text-red-700">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Удалить документ
        </button>
      </div>

      {file ? <FileSummary file={file} onDeleteDocument={onDeleteDocument} compact /> : null}

      <div className="mt-5 grid gap-4">
        <AnalysisBlock icon={FileCheck2} title="Что это за документ">
          <p>{analysis.whatIs}</p>
          <p className="mt-2 text-sm text-zinc-600">Уверенность распознавания: {confidenceLabel(analysis.confidence)}.</p>
          {analysis.isUnknown ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              Мы не смогли точно определить тип документа. Вы можете описать ситуацию или отправить документ юристу на проверку.
            </p>
          ) : null}
        </AnalysisBlock>

        <AnalysisBlock icon={FileText} title="Что от вас могут ожидать">
          <p>{analysis.expectedAction}</p>
        </AnalysisBlock>

        <AnalysisBlock icon={Clock3} title="Какие сроки проверить">
          <p>{analysis.termText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={analysis.typeId === "court_order" ? "/tools/sudebnyy-prikaz-deadline/" : "/problems/"} className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Проверить срок
            </Link>
            <Link href="/questions/#question" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Спросить юриста о сроках
            </Link>
          </div>
        </AnalysisBlock>

        <AnalysisListBlock icon={AlertTriangle} items={analysis.risks} title="Какие риски есть" />
        <AnalysisListBlock icon={CheckCircle2} items={analysis.nextSteps} ordered title="Что можно сделать дальше" />

        {analysis.detectedFacts.length ? (
          <AnalysisListBlock icon={ShieldCheck} items={analysis.detectedFacts} title="Что удалось выделить" />
        ) : (
          <AnalysisBlock icon={ShieldCheck} title="Что удалось выделить">
            <p>Мы не нашли явную дату, сумму или номер. Если они есть в документе, проверьте их вручную перед ответом или подачей.</p>
          </AnalysisBlock>
        )}

        <section className="rounded-lg border border-line bg-zinc-50 p-4">
          <h3 className="text-lg font-semibold text-ink">Документы, которые могут понадобиться</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {analysis.relatedDocuments.map((document) => (
              <Link key={`${document.href}-${document.title}`} href={document.href} className="rounded-lg border border-line bg-white p-4 hover:border-trust">
                <p className="text-base font-semibold text-ink">{document.title}</p>
                <p className="mt-3 inline-flex text-sm font-semibold text-trust">{document.label}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/documents/" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Открыть шаблоны
            </Link>
            <Link href="/questions/#question" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
              Проверить у юриста
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-line bg-white p-4">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-semibold text-ink">Хотите проверить документ у юриста?</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Юрист посмотрит документ, сроки, формулировки и подскажет, что лучше сделать дальше. Это особенно важно, если срок уже идёт, деньги списали, документ непонятен или вы собираетесь отправлять ответ в суд, приставам, работодателю или другой организации.
            </p>
          </div>
        </div>

        <form onSubmit={onReviewSubmit} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Имя" value={reviewName} onChange={setReviewName} placeholder="Как к вам обращаться" />
            <InputField label="Email или телефон" value={reviewContact} onChange={setReviewContact} placeholder="Для ответа юриста" required />
          </div>
          <SelectField label="Что нужно проверить?" value={reviewNeed} onChange={setReviewNeed} options={documentReviewCheckOptions.map((item) => ({ value: item, label: item }))} />
          <label className="block">
            <span className="text-sm font-semibold text-ink">Комментарий для юриста</span>
            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.currentTarget.value)}
              rows={4}
              placeholder="Опишите, что именно нужно проверить: срок, сумму, ответ, ошибки, риски"
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
            />
          </label>
          <label className="flex gap-3 rounded-lg border border-line bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
            <input type="checkbox" checked={reviewConsent} onChange={(event) => setReviewConsent(event.currentTarget.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-line text-trust" />
            <span>
              Я согласен на обработку персональных данных и передачу документа юристу для проверки.{" "}
              <Link href="/legal/personal-data-consent/" className="font-semibold text-trust hover:text-ink">
                Согласие на обработку персональных данных
              </Link>
            </span>
          </label>

          {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              <Send className="h-4 w-4" aria-hidden="true" />
              Отправить на проверку
            </button>
            <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Задать вопрос по документу
            </Link>
            <Link href="/login/?next=%2Fdocument-check%2F" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Сохранить в кабинет
            </Link>
          </div>
        </form>

        {reviewSubmitted ? <ReviewStatusTimeline /> : null}
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Изменить данные
        </button>
      </div>
    </div>
  );
}

function FileSummary({ compact = false, file, onDeleteDocument }: { compact?: boolean; file: File; onDeleteDocument: () => void }) {
  return (
    <div className={compact ? "mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-zinc-50 p-3" : "mt-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-zinc-50 p-4"}>
      <div className="flex min-w-0 items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
          <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button type="button" onClick={onDeleteDocument} className="shrink-0 text-sm font-semibold text-zinc-500 hover:text-red-700">
        Удалить
      </button>
    </div>
  );
}

function AnalysisBlock({ children, icon: Icon, title }: { children: ReactNode; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-1 h-5 w-5 shrink-0 text-trust" aria-hidden="true" />
        <div className="min-w-0 text-sm leading-6 text-zinc-700">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

function AnalysisListBlock({ icon, items, ordered = false, title }: { icon: LucideIcon; items: string[]; ordered?: boolean; title: string }) {
  return (
    <AnalysisBlock icon={icon} title={title}>
      {ordered ? (
        <ol className="grid gap-2">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{index + 1}. {item}</li>
          ))}
        </ol>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      )}
    </AnalysisBlock>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust">
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  onChange,
  placeholder,
  required = false,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
      />
    </label>
  );
}

function ReviewStatusTimeline() {
  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">Заявка на проверку подготовлена</p>
      <div className="mt-3 grid gap-2">
        {documentReviewStatuses.slice(0, 4).map((status, index) => (
          <div key={status} className="flex items-center gap-2 text-sm text-emerald-900">
            <span className={index <= 1 ? "h-2.5 w-2.5 rounded-full bg-emerald-700" : "h-2.5 w-2.5 rounded-full bg-emerald-200"} aria-hidden="true" />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div className="mt-5 rounded-lg border border-line bg-white p-4 text-sm leading-6 text-zinc-600">
      <p>
        Документы могут содержать персональные данные. Загружайте только те файлы, которые относятся к вашей ситуации. Мы используем документ для разбора, подготовки ответа и передачи юристу, если вы выберете такую опцию.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/legal/privacy/" className="font-semibold text-trust hover:text-ink">
          Политика конфиденциальности
        </Link>
        <Link href="/legal/personal-data-consent/" className="font-semibold text-trust hover:text-ink">
          Согласие на обработку персональных данных
        </Link>
        <Link href="/legal/terms/" className="font-semibold text-trust hover:text-ink">
          Пользовательское соглашение
        </Link>
      </div>
    </div>
  );
}

function validateFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!acceptedExtensions.includes(extension)) {
    return "Поддерживаются только PDF, DOC, DOCX, JPG и PNG.";
  }

  if (file.size > maxFileSizeBytes) {
    return "Файл слишком большой. Максимальный размер — 15 МБ.";
  }

  return "";
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  if (size >= 1024) return `${Math.round(size / 1024)} КБ`;
  return `${size} Б`;
}

function confidenceLabel(value: "high" | "medium" | "low") {
  if (value === "high") return "высокая";
  if (value === "medium") return "средняя";
  return "низкая";
}
