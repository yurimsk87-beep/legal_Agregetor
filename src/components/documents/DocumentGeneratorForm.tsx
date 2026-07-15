"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { DocumentField, DocumentGeneratorTemplate, DocumentGeneratorVariant } from "@/lib/types";
import { downloadGeneratedDocumentDocx, downloadGeneratedDocumentPdf } from "@/lib/document-export";

type FormValue = string | boolean;
type FormValues = Record<string, FormValue>;
type ActionStatus = "idle" | "success" | "error";
type PdfStatus = ActionStatus | "opened";

type DocumentGeneratorFormProps = {
  instructionHref?: string;
  template: DocumentGeneratorTemplate;
  variant: DocumentGeneratorVariant;
};

type FieldSection = {
  title: string;
  description: string;
  fieldNames: string[];
};

const fieldSectionsByTemplate: Record<string, FieldSection[]> = {
  "vozrazhenie-na-sudebnyy-prikaz": [
    {
      title: "Что вы получили",
      description: "Сначала уточните, действительно ли речь о судебном приказе и как вы о нем узнали.",
      fieldNames: ["receivedWay"]
    },
    {
      title: "Дата получения",
      description: "Дата получения может влиять на срок подачи возражений.",
      fieldNames: ["receivedDateStatus", "receivedDate"]
    },
    {
      title: "Суд",
      description: "Укажите суд, который вынес судебный приказ.",
      fieldNames: ["courtName", "courtAddress"]
    },
    {
      title: "Ваши данные",
      description: "Укажите данные лица, в отношении которого вынесен судебный приказ.",
      fieldNames: ["applicantName", "applicantAddress", "applicantPhone", "applicantEmail"]
    },
    {
      title: "Взыскатель",
      description: "Перепишите данные взыскателя из судебного приказа, если они известны.",
      fieldNames: ["claimantName", "claimantAddress"]
    },
    {
      title: "Судебный приказ",
      description: "Даты и номер дела нужны для проверки срока и точного текста заявления.",
      fieldNames: ["caseNumber", "orderDate", "claimAmountOrSubject"]
    },
    {
      title: "Возражения",
      description: "Кратко зафиксируйте, почему вы не согласны с исполнением судебного приказа.",
      fieldNames: ["objectionReason", "objectionComment", "requestTermRestoration", "missedTermReason"]
    }
  ],
  "pretenziya-prodavcu-o-vozvrate-deneg": [
    {
      title: "Адресат",
      description: "Укажите продавца, организацию или ИП, которому направляете претензию.",
      fieldNames: ["sellerName", "sellerAddress", "sellerInnOrOgrn"]
    },
    {
      title: "Покупатель",
      description: "Укажите данные покупателя и адрес для ответа.",
      fieldNames: ["buyerName", "buyerAddress", "buyerPhone", "buyerEmail"]
    },
    {
      title: "Покупка",
      description: "Опишите покупку, стоимость, дату и реквизиты заказа или чека.",
      fieldNames: ["purchaseDate", "productName", "purchasePrice", "paymentMethod", "orderNumber"]
    },
    {
      title: "Проблема и требование",
      description: "Опишите, что произошло, и выберите основное требование к продавцу.",
      fieldNames: ["problemDescription", "demandType", "responseDeadlineDays"]
    },
    {
      title: "Дополнительно",
      description: "Укажите приложения и дополнительные пояснения, если они нужны.",
      fieldNames: ["attachments", "additionalComment"]
    }
  ],
  "zhaloba-na-sudebnogo-pristava": [
    {
      title: "Адресат",
      description: "Укажите орган или должностное лицо ФССП, которому направляете жалобу.",
      fieldNames: ["authorityName", "authorityAddress"]
    },
    {
      title: "Заявитель",
      description: "Укажите данные лица, которое подает жалобу.",
      fieldNames: ["applicantName", "applicantAddress", "applicantPhone", "applicantEmail"]
    },
    {
      title: "Исполнительное производство",
      description: "Укажите номер производства, отдел и пристава, если эти сведения известны.",
      fieldNames: ["enforcementNumber", "bailiffName", "departmentName", "debtorOrCreditorRole"]
    },
    {
      title: "Нарушение",
      description: "Опишите постановление, действие или бездействие пристава и желаемый результат.",
      fieldNames: ["complaintReason", "factsDescription", "violationDate", "desiredResult", "attachments"]
    }
  ],
  "zhaloba-v-trudovuyu-inspekciyu": [
    {
      title: "Адресат",
      description: "Укажите трудовую инспекцию, в которую направляете жалобу.",
      fieldNames: ["inspectionName", "inspectionRegion"]
    },
    {
      title: "Работник",
      description: "Укажите данные заявителя для ответа по обращению.",
      fieldNames: ["employeeName", "employeeAddress", "employeePhone", "employeeEmail"]
    },
    {
      title: "Работодатель",
      description: "Укажите известные данные работодателя.",
      fieldNames: ["employerName", "employerAddress", "employerInnOrOgrn"]
    },
    {
      title: "Работа",
      description: "Опишите должность и оформление трудовых отношений.",
      fieldNames: ["position", "employmentStartDate", "employmentContractExists"]
    },
    {
      title: "Нарушение",
      description: "Опишите нарушение, период, сумму и просьбы к инспекции.",
      fieldNames: ["complaintReason", "factsDescription", "violationDates", "amountDue", "requestedActions", "attachments"]
    }
  ],
  "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza": [
    {
      title: "Суд и приказ",
      description: "Укажите суд, номер дела и дату приказа, если она известна.",
      fieldNames: ["courtName", "courtAddress", "caseNumber", "orderDate"]
    },
    {
      title: "Ваши данные",
      description: "Укажите только данные, которые нужны для заявления и ответа суда.",
      fieldNames: ["applicantName", "applicantAddress", "applicantPhone", "applicantEmail"]
    },
    {
      title: "Взыскатель и срок",
      description: "Опишите, когда узнали о приказе и почему срок мог быть пропущен.",
      fieldNames: ["claimantName", "receivedDate", "missedTermReason", "proofDocuments", "attachments"]
    }
  ],
  "zayavlenie-o-snyatii-aresta-so-scheta": [
    {
      title: "Адресат",
      description: "Укажите пристава, отдел ФССП или банк, куда направляете заявление.",
      fieldNames: ["authorityName", "authorityAddress"]
    },
    {
      title: "Ваши данные",
      description: "Укажите данные заявителя для ответа.",
      fieldNames: ["applicantName", "applicantAddress", "applicantPhone", "applicantEmail"]
    },
    {
      title: "Арест и счет",
      description: "Опишите производство, счет и основание для снятия ареста.",
      fieldNames: ["enforcementNumber", "bailiffName", "bankName", "arrestDate", "reasonToRemove", "desiredResult", "attachments"]
    }
  ],
  "pretenziya-v-upravlyayuschuyu-kompaniyu": [
    {
      title: "Адресат",
      description: "Укажите управляющую организацию, ТСЖ или другую обслуживающую организацию.",
      fieldNames: ["companyName", "companyAddress"]
    },
    {
      title: "Заявитель и квартира",
      description: "Укажите данные для ответа и адрес помещения.",
      fieldNames: ["applicantName", "applicantAddress", "applicantPhone", "applicantEmail"]
    },
    {
      title: "Проблема и требование",
      description: "Опишите залив, протечку, ущерб или бездействие и сформулируйте требование.",
      fieldNames: ["incidentDate", "problemDescription", "damageDescription", "demandText", "responseDeadlineDays", "attachments"]
    }
  ],
  "zayavlenie-o-vzyskanii-alimentov": [
    {
      title: "Суд и заявитель",
      description: "Укажите суд и данные родителя, который обращается за алиментами.",
      fieldNames: ["courtName", "claimantName", "claimantAddress", "claimantPhone"]
    },
    {
      title: "Второй родитель и ребенок",
      description: "Укажите данные второго родителя и ребенка.",
      fieldNames: ["respondentName", "respondentAddress", "childName", "childBirthDate", "childLivesWith"]
    },
    {
      title: "Требование",
      description: "Опишите, как просите взыскать алименты, и приложите документы.",
      fieldNames: ["respondentIncomeInfo", "demandText", "attachments"]
    }
  ]
};

export function DocumentGeneratorForm({ instructionHref = "/problems/", template, variant }: DocumentGeneratorFormProps) {
  const fields = useMemo(() => [...template.baseFields, ...(variant.extraFields ?? [])], [template.baseFields, variant.extraFields]);
  const [values, setValues] = useState<FormValues>(() => getInitialValues(fields));
  const [generatedText, setGeneratedText] = useState("");
  const [copyStatus, setCopyStatus] = useState<ActionStatus>("idle");
  const [docxStatus, setDocxStatus] = useState<ActionStatus>("idle");
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>("idle");

  const fieldSections = getFieldSections(template.slug);
  const visibleFields = fields.filter((field) => shouldShowField(field, values));
  const variantFields = visibleFields.filter((field) => variant.extraFields?.some((extraField) => extraField.name === field.name));
  const sectionFieldNames = new Set(fieldSections.flatMap((section) => section.fieldNames));
  const unsectionedBaseFields = visibleFields.filter((field) => !sectionFieldNames.has(field.name) && !variant.extraFields?.some((extraField) => extraField.name === field.name));
  const previewTitle = template.documentType === "objection" ? "Текст возражений" : "Текст документа";
  const resultMeta = useMemo(() => getGeneratedDocumentMeta(template, variant, values), [template, values, variant]);
  const emptyPreviewText =
    template.documentType === "objection"
      ? "Заполните поля слева и нажмите «Подготовить черновик». Здесь появится образец возражений относительно исполнения судебного приказа."
      : "Заполните поля слева и нажмите «Подготовить черновик». Здесь появится черновик документа.";

  function updateValue(field: DocumentField, value: FormValue) {
    setValues((current) => ({ ...current, [field.name]: value }));
    setCopyStatus("idle");
    setDocxStatus("idle");
    setPdfStatus("idle");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneratedText(buildDocumentText(template, variant, values));
    setCopyStatus("idle");
    setDocxStatus("idle");
    setPdfStatus("idle");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  async function handleDownloadDocx() {
    if (!generatedText) return;

    try {
      await downloadGeneratedDocumentDocx({
        title: template.title,
        fileName: buildDocumentFileName(template.slug, variant.key),
        content: generatedText
      });
      setDocxStatus("success");
    } catch {
      setDocxStatus("error");
    }
  }

  function handleDownloadPdf() {
    if (!generatedText) return;

    try {
      downloadGeneratedDocumentPdf({
        title: template.title,
        content: generatedText
      });
      setPdfStatus("opened");
    } catch {
      setPdfStatus("error");
    }
  }

  function handleClearForm() {
    setValues(getInitialValues(fields));
    setGeneratedText("");
    setCopyStatus("idle");
    setDocxStatus("idle");
    setPdfStatus("idle");
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form onSubmit={handleSubmit} className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Выбранный вариант</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{variant.title}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{variant.description}</p>
        </div>

        <div className="mt-6 grid gap-6">
          {fieldSections.map((section) => {
            const sectionFields = visibleFields.filter((field) => section.fieldNames.includes(field.name));
            if (!sectionFields.length) return null;

            return (
              <fieldset key={section.title} className="rounded-lg border border-line bg-zinc-50 p-4">
                <legend className="px-1 text-lg font-semibold text-ink">{section.title}</legend>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{section.description}</p>
                <div className="mt-4 grid gap-4">
                  {sectionFields.map((field) => (
                    <GeneratorField key={field.name} field={field} value={values[field.name]} onChange={(value) => updateValue(field, value)} />
                  ))}
                </div>
              </fieldset>
            );
          })}

          {variantFields.length ? (
            <fieldset className="rounded-lg border border-line bg-zinc-50 p-4">
              <legend className="px-1 text-lg font-semibold text-ink">Дополнительно для варианта</legend>
              <p className="mt-1 text-sm leading-6 text-zinc-600">Эти поля уточняют выбранную ситуацию, но не меняют базовую структуру документа.</p>
              <div className="mt-4 grid gap-4">
                {variantFields.map((field) => (
                  <GeneratorField key={field.name} field={field} value={values[field.name]} onChange={(value) => updateValue(field, value)} />
                ))}
              </div>
            </fieldset>
          ) : null}

          {unsectionedBaseFields.length ? (
            <fieldset className="rounded-lg border border-line bg-zinc-50 p-4">
              <legend className="px-1 text-lg font-semibold text-ink">Дополнительные поля</legend>
              <div className="mt-4 grid gap-4">
                {unsectionedBaseFields.map((field) => (
                  <GeneratorField key={field.name} field={field} value={values[field.name]} onChange={(value) => updateValue(field, value)} />
                ))}
              </div>
            </fieldset>
          ) : null}

          {variant.generatedTextHints?.length ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Что дополнительно проверить</p>
              <ul className="mt-2 grid gap-1">
                {variant.generatedTextHints.map((hint) => (
                  <li key={hint}>- {hint}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink sm:w-auto"
        >
          Подготовить черновик
        </button>
      </form>

      <aside className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-trust">Итоговый документ</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{previewTitle}</h2>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!generatedText}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:flex-none"
            >
              Скопировать текст
            </button>
            {generatedText ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink sm:flex-none"
                >
                  Скачать DOCX
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust sm:flex-none"
                >
                  Скачать PDF
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust sm:flex-none"
            >
              Очистить форму
            </button>
          </div>
        </div>
        {generatedText ? (
          <p className="mt-3 text-xs leading-5 text-zinc-500">Файл сформируется на вашем устройстве. Данные не отправляются на сервер.</p>
        ) : null}
        {copyStatus === "success" ? <p className="mt-3 text-sm font-semibold text-trust">Текст скопирован</p> : null}
        {copyStatus === "error" ? (
          <p className="mt-3 text-sm font-semibold text-red-700">Не удалось скопировать автоматически. Выделите текст вручную.</p>
        ) : null}
        {docxStatus === "success" ? <p className="mt-3 text-sm font-semibold text-trust">Файл .docx сформирован</p> : null}
        {docxStatus === "error" ? (
          <p className="mt-3 text-sm font-semibold text-red-700">Не удалось сформировать .docx. Скопируйте текст вручную.</p>
        ) : null}
        {pdfStatus === "opened" ? <p className="mt-3 text-sm font-semibold text-trust">Открыто окно печати: выберите «Сохранить как PDF».</p> : null}
        {pdfStatus === "error" ? (
          <p className="mt-3 text-sm font-semibold text-red-700">Не удалось открыть PDF. Проверьте, не заблокировано ли всплывающее окно.</p>
        ) : null}
        {generatedText ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Документ сформирован</p>
              <h3 className="mt-1 text-xl font-semibold text-ink">{template.title}</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-950">{resultMeta.description}</p>
            </div>

            {resultMeta.warnings.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Перед отправкой проверьте срок</p>
                <ul className="mt-2 grid gap-1">
                  {resultMeta.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
                <Link href="/document-check/" className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink hover:text-trust">
                  Проверить сроки и формулировки
                </Link>
              </div>
            ) : null}

            <ResultList title="Приложения" items={resultMeta.attachments} />
            <ResultList title="Как подать документ" items={resultMeta.submissionSteps} ordered />

            <div className="rounded-lg border border-line bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-ink">Следующий шаг</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={instructionHref} className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
                Открыть инструкцию
              </Link>
              <Link href="/document-check/" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
                Отправить на проверку юристу
              </Link>
              <Link href="/login/?next=%2Fdocument-check%2F" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
                Сохранить в кабинет
              </Link>
              <Link href="/lawyers/" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
                Посмотреть юристов
              </Link>
            </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Сохраните документ в кабинете, чтобы вернуться к нему позже, проверить статус и получить ответ юриста.
              </p>
            </div>
          </div>
        ) : null}
        <pre className="mt-5 min-h-[520px] whitespace-pre-wrap rounded-lg border border-line bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
          {generatedText || emptyPreviewText}
        </pre>
      </aside>
    </section>
  );
}

function ResultList({ items, ordered = false, title }: { items: string[]; ordered?: boolean; title: string }) {
  const visibleItems = items.map(cleanListItem).filter(Boolean);
  if (!visibleItems.length) return null;

  const listClassName = "mt-2 grid gap-1 text-sm leading-6 text-zinc-700";

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {ordered ? (
        <ol className={listClassName}>
          {visibleItems.map((item, index) => (
            <li key={`${item}-${index}`}>{index + 1}. {item}</li>
          ))}
        </ol>
      ) : (
        <ul className={listClassName}>
          {visibleItems.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function cleanListItem(item: string) {
  return item.trim().replace(/^\d+\.\s*/, "");
}

function GeneratorField({
  field,
  onChange,
  value
}: {
  field: DocumentField;
  onChange: (value: FormValue) => void;
  value: FormValue | undefined;
}) {
  const inputId = `document-field-${field.name}`;

  if (field.type === "checkbox") {
    return (
      <label htmlFor={inputId} className="flex gap-3 rounded-md border border-line bg-white p-3 text-sm leading-6 text-zinc-700">
        <input
          id={inputId}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-line text-trust"
        />
        <span>
          <span className="block font-semibold text-ink">{field.label}</span>
          {field.helpText ? <span className="mt-1 block text-zinc-600">{field.helpText}</span> : null}
        </span>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">
        {field.label}
        {field.required ? <span className="text-red-700"> *</span> : null}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={inputId}
          required={field.required}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={4}
          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
        />
      ) : field.type === "select" ? (
        <select
          id={inputId}
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
        >
          <option value="">Выберите вариант</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
        />
      )}
      {field.helpText ? <p className="mt-1 text-xs leading-5 text-zinc-500">{field.helpText}</p> : null}
    </div>
  );
}

function getInitialValues(fields: DocumentField[]): FormValues {
  return fields.reduce<FormValues>((acc, field) => {
    acc[field.name] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});
}

function shouldShowField(field: DocumentField, values: FormValues) {
  if (!field.showWhen) return true;
  return values[field.showWhen.field] === field.showWhen.equals;
}

function getFieldSections(templateSlug: string) {
  return fieldSectionsByTemplate[templateSlug] ?? [];
}

function getGeneratedDocumentMeta(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const customAttachments = splitLines(values.attachments);
  const deadlineWarning = getDeadlineWarning(template.slug, values);
  const commonSubmissionSteps = [
    "Проверьте данные в документе.",
    "Распечатайте и подпишите документ.",
    "Приложите копии нужных документов.",
    "Подайте документ нужному адресату.",
    "Сохраните подтверждение отправки."
  ];

  if (template.slug === "vozrazhenie-na-sudebnyy-prikaz") {
    return {
      description: "Черновик возражений готов. Проверьте дату получения приказа, номер дела, суд, взыскателя и список приложений.",
      warnings: [
        deadlineWarning,
        Boolean(values.requestTermRestoration)
          ? "Если срок подачи возражения пропущен, суд может не принять документ без заявления о восстановлении срока."
          : ""
      ].filter(Boolean),
      attachments: customAttachments.length ? customAttachments : getDefaultJudicialOrderAttachments(Boolean(values.requestTermRestoration), stringValue(values.receivedDateStatus)),
      submissionSteps: [
        "Подайте документ в суд, который вынес судебный приказ.",
        "Если срок спорный, приложите заявление о восстановлении срока и подтверждающие документы.",
        "Сохраните отметку суда, почтовую квитанцию или электронное подтверждение отправки.",
        "Отслеживайте определение суда об отмене приказа.",
        "Если уже есть приставы или списания, передайте определение об отмене приставу или банку."
      ]
    };
  }

  if (template.slug === "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza") {
    return {
      description: "Заявление о восстановлении срока готово. Его обычно подают вместе с возражениями на судебный приказ.",
      warnings: ["Перед отправкой проверьте, достаточно ли документов, подтверждающих дату получения приказа или причину пропуска срока."],
      attachments: customAttachments.length ? customAttachments : getDefaultTermRestorationAttachments(splitLines(values.proofDocuments)),
      submissionSteps: [
        "Подайте заявление в суд, который вынес судебный приказ.",
        "Приложите возражения на судебный приказ и доказательства причины пропуска срока.",
        "Сохраните подтверждение подачи.",
        "Отслеживайте ответ суда и определение по заявлению."
      ]
    };
  }

  if (template.slug === "zhaloba-na-sudebnogo-pristava" || template.slug === "zayavlenie-o-snyatii-aresta-so-scheta") {
    return {
      description: "Документ для ФССП готов. Перед подачей проверьте номер исполнительного производства, данные пристава, счет и подтверждающие документы.",
      warnings: ["Если деньги уже списаны или срок обжалования спорный, лучше проверить документ у юриста перед отправкой."],
      attachments: customAttachments.length ? customAttachments : template.slug === "zhaloba-na-sudebnogo-pristava" ? getDefaultBailiffAttachments() : getDefaultArrestRemovalAttachments(),
      submissionSteps: [
        "Подайте документ приставу, старшему приставу или в соответствующий отдел ФССП.",
        "Приложите постановления, выписки, справки о доходах или подтверждение оплаты долга.",
        "Сохраните входящий номер, почтовую квитанцию или электронное подтверждение.",
        "Контролируйте ответ ФССП и повторные списания."
      ]
    };
  }

  if (template.slug === "zhaloba-v-trudovuyu-inspekciyu") {
    return {
      description: "Жалоба в трудовую инспекцию готова. Проверьте работодателя, период нарушения, сумму и доказательства трудовых отношений.",
      warnings: ["По трудовым спорам сроки обращения могут быть ограничены. Если срок близко, параллельно проверьте судебный порядок."],
      attachments: customAttachments.length ? customAttachments : getDefaultLaborAttachments(),
      submissionSteps: [
        "Подайте жалобу через онлайн-приемную Роструда, Госуслуги, почтой или лично.",
        "Приложите трудовой договор, расчетные листки, выписки, переписку и другие доказательства.",
        "Сохраните подтверждение отправки или номер обращения.",
        "Отслеживайте ответ инспекции и при необходимости готовьте обращение в прокуратуру или суд."
      ]
    };
  }

  if (template.slug === "pretenziya-prodavcu-o-vozvrate-deneg" || template.slug === "pretenziya-v-upravlyayuschuyu-kompaniyu") {
    return {
      description: "Претензия готова. Проверьте адресата, факты, требование, срок ответа и доказательства.",
      warnings: [],
      attachments: customAttachments.length
        ? customAttachments
        : template.slug === "pretenziya-prodavcu-o-vozvrate-deneg"
          ? getDefaultConsumerAttachments()
          : getDefaultManagementCompanyAttachments(),
      submissionSteps: [
        "Направьте претензию адресату лично, почтой с описью вложения или через электронную приемную, если она есть.",
        "Приложите чеки, договоры, акты, фото, переписку или другие доказательства.",
        "Сохраните подтверждение отправки.",
        "Если ответа нет или он отрицательный, проверьте следующий шаг: жалоба или суд."
      ]
    };
  }

  if (template.slug === "zayavlenie-o-vzyskanii-alimentov") {
    return {
      description: "Заявление по алиментам готово. Проверьте выбранный порядок, данные ребенка, второго родителя и приложения.",
      warnings: [variant.key !== "court-order" ? "Если есть спор о ребенке, доходах или твердой сумме, лучше проверить формулировки с юристом." : ""].filter(Boolean),
      attachments: customAttachments.length ? customAttachments : getDefaultAlimonyAttachments(),
      submissionSteps: [
        "Подайте заявление в суд по правилам подсудности.",
        "Приложите свидетельство о рождении ребенка и документы, подтверждающие обстоятельства.",
        "Сохраните подтверждение подачи.",
        "Отслеживайте судебный акт и порядок получения исполнительного документа."
      ]
    };
  }

  return {
    description: "Документ готов. Проверьте данные, сроки, адресата и приложения перед подачей.",
    warnings: [deadlineWarning].filter(Boolean),
    attachments: customAttachments,
    submissionSteps: commonSubmissionSteps
  };
}

function getDeadlineWarning(templateSlug: string, values: FormValues) {
  if (templateSlug !== "vozrazhenie-na-sudebnyy-prikaz") return "";

  const receivedDateStatus = stringValue(values.receivedDateStatus);
  if (receivedDateStatus === "unknown" || receivedDateStatus === "after_withdrawal") {
    return "Дата получения может влиять на срок подачи возражения. Если точной даты нет или вы узнали о приказе после списания, срок лучше проверить отдельно.";
  }

  const receivedDate = parseInputDate(values.receivedDate);
  if (!receivedDate) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysPassed = Math.floor((today.getTime() - receivedDate.getTime()) / 86_400_000);

  if (daysPassed > 10) {
    return "Похоже, срок может быть спорным или пропущенным. Вместе с возражением может понадобиться заявление о восстановлении срока.";
  }

  if (daysPassed >= 8) return "Срок может быть близко. Проверьте дату получения и способ подачи до отправки документа.";

  return "";
}

function getDefaultJudicialOrderAttachments(requestTermRestoration: boolean, receivedDateStatus: string) {
  return [
    "Копия судебного приказа, если есть.",
    receivedDateStatus === "unknown" ? "Документы, которые помогают подтвердить дату, когда вы узнали о приказе." : "Документы, подтверждающие дату получения судебного приказа.",
    requestTermRestoration ? "Заявление о восстановлении срока и документы, подтверждающие причины пропуска." : "",
    "Доверенность, если документ подает представитель.",
    "Иные документы, если есть особые обстоятельства."
  ].filter(Boolean);
}

function buildDocumentText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  if (template.slug === "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza") {
    return buildTermRestorationApplicationText(variant, values);
  }

  if (template.slug === "zayavlenie-o-snyatii-aresta-so-scheta") {
    return buildAccountArrestRemovalText(variant, values);
  }

  if (template.slug === "pretenziya-v-upravlyayuschuyu-kompaniyu") {
    return buildManagementCompanyClaimText(template, variant, values);
  }

  if (template.slug === "zayavlenie-o-vzyskanii-alimentov") {
    return buildAlimonyApplicationText(variant, values);
  }

  if (template.slug === "zhaloba-v-trudovuyu-inspekciyu") {
    return buildLaborInspectionComplaintText(template, variant, values);
  }

  if (template.slug === "zhaloba-na-sudebnogo-pristava") {
    return buildBailiffComplaintText(template, variant, values);
  }

  if (template.slug === "pretenziya-prodavcu-o-vozvrate-deneg") {
    return buildConsumerClaimText(template, variant, values);
  }

  if (template.slug === "vozrazhenie-na-isk") {
    return buildLawsuitObjectionText(template, variant, values);
  }

  if (template.slug === "hodataystvo-o-primenenii-sroka-iskovoy-davnosti") {
    return buildLimitationPetitionText(values);
  }

  if (template.slug === "pretenziya-v-bank-o-vozvrate-spisannyh-deneg") {
    return buildBankRefundClaimText(template, values);
  }

  if (template.slug === "isk-o-vzyskanii-zarabotnoy-platy") {
    return buildSalaryLawsuitText(variant, values);
  }

  if (template.slug === "zayavlenie-o-vozvrate-izlishne-uderzhannyh-deneg") {
    return buildOverheldRefundText(template, values);
  }

  return buildJudicialOrderObjectionText(template, variant, values);
}

function buildLawsuitObjectionText(template: DocumentGeneratorTemplate, _variant: DocumentGeneratorVariant, values: FormValues) {
  const reason = getOptionLabel(template.baseFields, "disagreementReason", stringValue(values.disagreementReason));
  const applyLimitation = Boolean(values.requestApplyLimitation);
  const attachments = splitLines(values.attachments);
  return [
    `В ${requiredText(values.courtName)}`,
    "",
    `Ответчик: ${requiredText(values.defendantName)}`,
    `Адрес: ${requiredText(values.defendantAddress)}`,
    stringValue(values.defendantPhone) ? `Телефон: ${stringValue(values.defendantPhone)}` : "",
    "",
    `Истец: ${requiredText(values.plaintiffName)}`,
    `Дело N ${requiredText(values.caseNumber)}`,
    "",
    "ВОЗРАЖЕНИЯ на исковое заявление",
    "",
    `В производстве суда находится гражданское дело N ${requiredText(values.caseNumber)} по иску ${requiredText(values.plaintiffName)}. Истец требует: ${requiredText(values.claimSubject)}.`,
    "",
    "С заявленными требованиями не согласен(на) по следующим основаниям.",
    reason ? `Основание несогласия: ${reason}.` : "",
    stringValue(values.objectionDetails) ? stringValue(values.objectionDetails) : "",
    applyLimitation
      ? `\nКроме того, заявляю о пропуске истцом срока исковой давности. ${stringValue(values.limitationDetails) || "С момента, когда истец узнал или должен был узнать о нарушении права, прошло более трёх лет."} В силу пункта 2 статьи 199 Гражданского кодекса Российской Федерации истечение срока исковой давности, о применении которой заявлено стороной, является самостоятельным основанием для отказа в иске.`
      : "",
    "",
    "На основании изложенного, руководствуясь статьёй 35 Гражданского процессуального кодекса Российской Федерации,",
    "",
    "ПРОШУ:",
    applyLimitation
      ? "1. Применить последствия пропуска срока исковой давности.\n2. В удовлетворении исковых требований отказать в полном объёме."
      : "1. В удовлетворении исковых требований отказать полностью либо в части необоснованных требований.",
    "",
    "Приложения:",
    ...(attachments.length
      ? attachments.map((item, index) => `${index + 1}. ${item}.`)
      : ["1. Копия возражений для истца.", "2. Документы, подтверждающие доводы возражений."]),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildLimitationPetitionText(values: FormValues) {
  const attachments = splitLines(values.attachments);
  return [
    `В ${requiredText(values.courtName)}`,
    "",
    `Ответчик: ${requiredText(values.defendantName)}`,
    `Адрес: ${requiredText(values.defendantAddress)}`,
    "",
    `Истец: ${requiredText(values.plaintiffName)}`,
    `Дело N ${requiredText(values.caseNumber)}`,
    "",
    "ХОДАТАЙСТВО о применении срока исковой давности",
    "",
    `В производстве суда находится дело N ${requiredText(values.caseNumber)} по иску ${requiredText(values.plaintiffName)}. Предмет требований: ${requiredText(values.claimSubject)}.`,
    `Право требования возникло (истцу стало известно о нарушении) ${formatDateValue(requiredText(values.rightViolationDate))}.`,
    stringValue(values.lastActionDate) ? `Последний платёж (действие) по обязательству: ${formatDateValue(values.lastActionDate)}.` : "",
    stringValue(values.claimFilingDate) ? `Иск подан в суд ${formatDateValue(values.claimFilingDate)}.` : "",
    "",
    "Общий срок исковой давности составляет три года и исчисляется со дня, когда лицо узнало или должно было узнать о нарушении своего права (статьи 196, 200 Гражданского кодекса Российской Федерации). На момент обращения истца в суд указанный срок истёк.",
    stringValue(values.comment) ? stringValue(values.comment) : "",
    "",
    "В соответствии с пунктом 2 статьи 199 Гражданского кодекса Российской Федерации истечение срока исковой давности, о применении которой заявлено стороной в споре, является основанием к вынесению судом решения об отказе в иске.",
    "",
    "ПРОШУ:",
    "1. Применить срок исковой давности к требованиям истца.",
    "2. В удовлетворении исковых требований отказать в полном объёме в связи с пропуском срока исковой давности.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((item, index) => `${index + 1}. ${item}.`) : ["1. Копия ходатайства для истца."]),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildBankRefundClaimText(template: DocumentGeneratorTemplate, values: FormValues) {
  const reason = getOptionLabel(template.baseFields, "writeOffReason", stringValue(values.writeOffReason));
  const attachments = splitLines(values.attachments);
  return [
    `В ${requiredText(values.bankName)}`,
    stringValue(values.bankAddress) ? `Адрес: ${stringValue(values.bankAddress)}` : "",
    "",
    `От: ${requiredText(values.applicantName)}`,
    `Адрес: ${requiredText(values.applicantAddress)}`,
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    "",
    "ПРЕТЕНЗИЯ о возврате денежных средств",
    "",
    `${formatDateValue(requiredText(values.writeOffDate))} с моего счёта (карты) ${requiredText(values.accountOrCard)} были списаны денежные средства в размере ${requiredText(values.writeOffAmount)} руб.`,
    reason ? `Характер операции: ${reason}.` : "",
    stringValue(values.details) ? stringValue(values.details) : "",
    "",
    "Списание денежных средств со счёта производится по распоряжению клиента; без распоряжения клиента списание допускается только в случаях, предусмотренных законом или договором (статья 854 Гражданского кодекса Российской Федерации). По операциям, совершённым без согласия клиента, применяется порядок возмещения, установленный статьёй 9 Федерального закона «О национальной платёжной системе».",
    "",
    "ПРОШУ:",
    `1. ${requiredText(values.demandText)}`,
    "2. Рассмотреть претензию и дать письменный ответ в установленный срок.",
    "",
    "В случае отказа или оставления претензии без ответа оставляю за собой право обратиться в Банк России, Роспотребнадзор и в суд с требованием о возврате денежных средств, взыскании неустойки, компенсации морального вреда и штрафа.",
    "",
    "Приложения:",
    ...(attachments.length
      ? attachments.map((item, index) => `${index + 1}. ${item}.`)
      : ["1. Выписка по счёту.", "2. Копии обращений в банк."]),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildSalaryLawsuitText(variant: DocumentGeneratorVariant, values: FormValues) {
  const withCompensation = Boolean(values.includeCompensation);
  const withMoral = Boolean(values.includeMoralHarm);
  const attachments = splitLines(values.attachments);
  const isNoContract = variant.key === "no-contract";
  const demands: string[] = [];
  let index = 1;
  if (isNoContract) {
    demands.push(
      `${index++}. Установить факт трудовых отношений между мной и ${requiredText(values.employerName)}${
        stringValue(values.workPeriod) ? ` в период ${stringValue(values.workPeriod)}` : ""
      }.`
    );
  }
  demands.push(
    `${index++}. Взыскать с ответчика задолженность по заработной плате за ${requiredText(values.debtPeriod)} в размере ${requiredText(values.debtAmount)} руб.`
  );
  if (withCompensation) {
    demands.push(`${index++}. Взыскать компенсацию за задержку выплаты по статье 236 Трудового кодекса Российской Федерации по день фактического расчёта.`);
  }
  if (withMoral) {
    demands.push(`${index++}. Взыскать компенсацию морального вреда в размере ${stringValue(values.moralHarmAmount) || "___"} руб.`);
  }
  return [
    `В ${requiredText(values.courtName)}`,
    "",
    `Истец: ${requiredText(values.plaintiffName)}`,
    `Адрес: ${requiredText(values.plaintiffAddress)}`,
    stringValue(values.plaintiffPhone) ? `Телефон: ${stringValue(values.plaintiffPhone)}` : "",
    "",
    `Ответчик: ${requiredText(values.employerName)}`,
    `Адрес: ${requiredText(values.employerAddress)}`,
    "",
    "Госпошлина: не уплачивается (статья 393 ТК РФ, подпункт 1 пункта 1 статьи 333.36 НК РФ).",
    "",
    "ИСКОВОЕ ЗАЯВЛЕНИЕ о взыскании заработной платы",
    "",
    `Я работал(а) у ответчика${stringValue(values.position) ? ` в должности ${stringValue(values.position)}` : ""}${
      stringValue(values.workPeriod) ? ` (${stringValue(values.workPeriod)})` : ""
    }.`,
    isNoContract
      ? "Трудовой договор в письменном виде не оформлялся, однако я был(а) фактически допущен(а) к работе с ведома работодателя, что в силу статьи 67 Трудового кодекса Российской Федерации свидетельствует о заключении трудового договора."
      : "",
    `За период ${requiredText(values.debtPeriod)} заработная плата в размере ${requiredText(values.debtAmount)} руб. мне не выплачена.`,
    stringValue(values.details) ? stringValue(values.details) : "",
    "",
    "Согласно статьям 22 и 136 Трудового кодекса Российской Федерации работодатель обязан выплачивать заработную плату в полном размере и в установленные сроки. При нарушении срока выплаты работодатель несёт материальную ответственность по статье 236 Трудового кодекса Российской Федерации.",
    "",
    "На основании изложенного, руководствуясь статьями 22, 136, 236, 392 Трудового кодекса Российской Федерации, статьями 131, 132 Гражданского процессуального кодекса Российской Федерации,",
    "",
    "ПРОШУ:",
    ...demands,
    "",
    "Приложения:",
    ...(attachments.length
      ? attachments.map((item, itemIndex) => `${itemIndex + 1}. ${item}.`)
      : ["1. Копия искового заявления для ответчика.", "2. Документы, подтверждающие трудовые отношения и размер задолженности."]),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildOverheldRefundText(template: DocumentGeneratorTemplate, values: FormValues) {
  const reason = getOptionLabel(template.baseFields, "reason", stringValue(values.reason));
  const attachments = splitLines(values.attachments);
  return [
    `В ${requiredText(values.bailiffDept)}`,
    stringValue(values.bailiffName) ? `Судебному приставу-исполнителю ${stringValue(values.bailiffName)}` : "",
    "",
    `От должника: ${requiredText(values.applicantName)}`,
    `Адрес: ${requiredText(values.applicantAddress)}`,
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    "",
    "ЗАЯВЛЕНИЕ о возврате излишне удержанных денежных средств",
    "",
    `В отношении меня ведётся исполнительное производство N ${requiredText(values.enforcementCaseNumber)}.`,
    `${stringValue(values.overheldDate) ? formatDateValue(values.overheldDate) + " " : ""}с меня удержаны денежные средства в размере ${requiredText(values.overheldAmount)} руб. сверх допустимого.`,
    reason ? `Основание: ${reason}.` : "",
    stringValue(values.details) ? stringValue(values.details) : "",
    "",
    "В соответствии со статьёй 99 Федерального закона от 02.10.2007 N 229-ФЗ «Об исполнительном производстве» размер удержания из заработной платы и иных доходов не может превышать 50 процентов (в отдельных случаях — 70 процентов). Статья 101 того же закона устанавливает перечень выплат, на которые не может быть обращено взыскание. Излишне удержанные суммы подлежат возврату должнику.",
    "",
    "ПРОШУ:",
    `1. Возвратить излишне удержанные денежные средства в размере ${requiredText(values.overheldAmount)} руб.`,
    "2. Перечислить денежные средства по следующим реквизитам:",
    requiredText(values.refundRequisites),
    "",
    "Приложения:",
    ...(attachments.length
      ? attachments.map((item, index) => `${index + 1}. ${item}.`)
      : ["1. Выписка по счёту.", "2. Документы, подтверждающие характер и размер удержанных сумм."]),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildDocumentFileName(templateSlug: string, variantKey: string) {
  return `${templateSlug}-${variantKey}.docx`;
}

function buildJudicialOrderObjectionText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const requestTermRestoration = Boolean(values.requestTermRestoration);
  const objectionReason = getOptionLabel(template.baseFields, "objectionReason", stringValue(values.objectionReason));
  const extraDetails = getVariantExtraDetails(variant, values);
  const contactLines = [
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    stringValue(values.applicantEmail) ? `Email: ${stringValue(values.applicantEmail)}` : ""
  ].filter(Boolean);

  return [
    `В ${requiredText(values.courtName)}`,
    stringValue(values.courtAddress) ? `Адрес суда: ${stringValue(values.courtAddress)}` : "",
    "",
    `От: ${requiredText(values.applicantName)}`,
    `Адрес: ${requiredText(values.applicantAddress)}`,
    ...contactLines,
    "",
    `Взыскатель: ${requiredText(values.claimantName)}`,
    stringValue(values.claimantAddress) ? `Адрес взыскателя: ${stringValue(values.claimantAddress)}` : "",
    "",
    "Возражения относительно исполнения судебного приказа",
    "",
    `Судом вынесен судебный приказ по делу N ${requiredText(values.caseNumber)} по заявлению взыскателя ${requiredText(values.claimantName)} о взыскании ${stringValue(values.claimAmountOrSubject) || "заявленных требований"}.`,
    stringValue(values.orderDate) ? `Дата вынесения судебного приказа: ${formatDateValue(values.orderDate)}.` : "",
    "",
    `Копию судебного приказа я получил(а) ${formatDateValue(requiredText(values.receivedDate))}.`,
    "",
    "С требованиями взыскателя и исполнением судебного приказа не согласен(на).",
    `Возражения связаны с требованиями категории: ${variant.title}.`,
    objectionReason ? `Причина возражений: ${objectionReason}.` : "",
    extraDetails.length ? `Дополнительные сведения по выбранному варианту: ${extraDetails.join("; ")}.` : "",
    "",
    "На основании статей 128 и 129 Гражданского процессуального кодекса Российской Федерации прошу отменить судебный приказ.",
    stringValue(values.objectionComment) ? `\nДополнительно сообщаю: ${stringValue(values.objectionComment)}` : "",
    requestTermRestoration
      ? `\nТакже прошу восстановить срок подачи возражений относительно исполнения судебного приказа, поскольку срок был пропущен по следующим причинам: ${stringValue(values.missedTermReason) || "причины будут подтверждены приложенными документами"}.\n\nНа основании статьи 112 Гражданского процессуального кодекса Российской Федерации прошу восстановить пропущенный процессуальный срок.`
      : "",
    "",
    "ПРОШУ:",
    requestTermRestoration
      ? "1. Восстановить срок подачи возражений относительно исполнения судебного приказа.\n2. Принять настоящие возражения.\n3. Отменить судебный приказ по делу N " + requiredText(values.caseNumber) + "."
      : "1. Принять настоящие возражения относительно исполнения судебного приказа.\n2. Отменить судебный приказ по делу N " + requiredText(values.caseNumber) + ".",
    "",
    "Приложения:",
    "1. Копия судебного приказа.",
    "2. Документы, подтверждающие дату получения судебного приказа.",
    "3. Документы, подтверждающие уважительность причин пропуска срока, если срок пропущен.",
    "4. Иные документы, подтверждающие обстоятельства заявления.",
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function buildTermRestorationApplicationText(variant: DocumentGeneratorVariant, values: FormValues) {
  const contactLines = [
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    stringValue(values.applicantEmail) ? `Email: ${stringValue(values.applicantEmail)}` : ""
  ].filter(Boolean);
  const attachments = splitLines(values.attachments);
  const proofDocuments = splitLines(values.proofDocuments);

  return [
    `В ${requiredText(values.courtName)}`,
    stringValue(values.courtAddress) ? `Адрес суда: ${stringValue(values.courtAddress)}` : "",
    "",
    `От: ${requiredText(values.applicantName)}`,
    `Адрес: ${requiredText(values.applicantAddress)}`,
    ...contactLines,
    "",
    `Взыскатель: ${requiredText(values.claimantName)}`,
    "",
    "ЗАЯВЛЕНИЕ",
    "о восстановлении срока подачи возражений относительно исполнения судебного приказа",
    "",
    `Судом вынесен судебный приказ по делу N ${requiredText(values.caseNumber)}.`,
    stringValue(values.orderDate) ? `Дата судебного приказа: ${formatDateValue(values.orderDate)}.` : "",
    stringValue(values.receivedDate) ? `О судебном приказе я узнал(а) или получил(а) его ${formatDateValue(values.receivedDate)}.` : "",
    `Ситуация: ${variant.title}.`,
    "",
    "Срок подачи возражений мог быть пропущен по следующим причинам:",
    requiredText(values.missedTermReason),
    proofDocuments.length ? `Подтверждающие документы: ${proofDocuments.join("; ")}.` : "",
    "",
    "Считаю причины пропуска срока уважительными. Одновременно с настоящим заявлением подаю возражения относительно исполнения судебного приказа.",
    "",
    "ПРОШУ:",
    `1. Восстановить срок подачи возражений относительно исполнения судебного приказа по делу N ${requiredText(values.caseNumber)}.`,
    "2. Принять возражения относительно исполнения судебного приказа.",
    "3. Рассмотреть вопрос об отмене судебного приказа в установленном порядке.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultTermRestorationAttachments(proofDocuments)),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getDefaultTermRestorationAttachments(proofDocuments: string[]) {
  return [
    "1. Копия судебного приказа при наличии.",
    "2. Возражения относительно исполнения судебного приказа.",
    ...(proofDocuments.length
      ? proofDocuments.map((item, index) => `${index + 3}. ${item}.`)
      : ["3. Документы, подтверждающие дату получения судебного приказа или уважительность причины пропуска срока."])
  ];
}

function buildAccountArrestRemovalText(variant: DocumentGeneratorVariant, values: FormValues) {
  const extraDetails = getVariantExtraDetails(variant, values);
  const contactLines = [
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    stringValue(values.applicantEmail) ? `Email: ${stringValue(values.applicantEmail)}` : ""
  ].filter(Boolean);
  const attachments = splitLines(values.attachments);

  return [
    `В ${requiredText(values.authorityName)}`,
    stringValue(values.authorityAddress) ? `Адрес: ${stringValue(values.authorityAddress)}` : "",
    "",
    `От: ${requiredText(values.applicantName)}`,
    `Адрес: ${requiredText(values.applicantAddress)}`,
    ...contactLines,
    "",
    "ЗАЯВЛЕНИЕ",
    "о снятии ареста со счета и проверке удержаний",
    "",
    `В рамках исполнительного производства N ${requiredText(values.enforcementNumber)} наложен арест или ограничение на счет: ${requiredText(values.bankName)}.`,
    stringValue(values.bailiffName) ? `Судебный пристав-исполнитель: ${stringValue(values.bailiffName)}.` : "",
    stringValue(values.arrestDate) ? `Об аресте или списании мне стало известно ${formatDateValue(values.arrestDate)}.` : "",
    `Ситуация: ${variant.title}.`,
    extraDetails.length ? `Дополнительные сведения: ${extraDetails.join("; ")}.` : "",
    "",
    "Основания для снятия ареста или изменения порядка удержаний:",
    requiredText(values.reasonToRemove),
    "",
    "ПРОШУ:",
    `1. Проверить законность ареста, списаний и ограничений по исполнительному производству N ${requiredText(values.enforcementNumber)}.`,
    `2. ${requiredText(values.desiredResult)}`,
    "3. При наличии оснований вынести постановление о снятии ареста, прекращении удержаний или возврате излишне удержанных сумм.",
    "4. Направить мне письменный ответ по результатам рассмотрения заявления.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultArrestRemovalAttachments()),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getDefaultArrestRemovalAttachments() {
  return [
    "1. Банковская выписка по счету или карте.",
    "2. Постановление судебного пристава при наличии.",
    "3. Документы о происхождении поступлений или подтверждение оплаты долга.",
    "4. Иные документы, подтверждающие основания для снятия ареста."
  ];
}

function buildManagementCompanyClaimText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const responseDeadline = getOptionLabel(template.baseFields, "responseDeadlineDays", stringValue(values.responseDeadlineDays));
  const contactLines = [
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    stringValue(values.applicantEmail) ? `Email: ${stringValue(values.applicantEmail)}` : ""
  ].filter(Boolean);
  const attachments = splitLines(values.attachments);

  return [
    `Кому: ${requiredText(values.companyName)}`,
    stringValue(values.companyAddress) ? `Адрес: ${stringValue(values.companyAddress)}` : "",
    "",
    `От: ${requiredText(values.applicantName)}`,
    `Адрес помещения: ${requiredText(values.applicantAddress)}`,
    ...contactLines,
    "",
    "ПРЕТЕНЗИЯ",
    "по вопросу управления и содержания дома",
    "",
    stringValue(values.incidentDate) ? `Дата обнаружения проблемы: ${formatDateValue(values.incidentDate)}.` : "",
    `Ситуация: ${variant.title}.`,
    "",
    "Описание проблемы:",
    requiredText(values.problemDescription),
    stringValue(values.damageDescription) ? `\nПоследствия и ущерб: ${stringValue(values.damageDescription)}` : "",
    "",
    "ПРОШУ:",
    `1. ${requiredText(values.demandText)}`,
    `2. Провести проверку изложенных обстоятельств и дать письменный ответ ${responseDeadline ? `в срок ${responseDeadline}` : "в установленный срок"}.`,
    "3. Сообщить, какие меры приняты для устранения причины проблемы и ее последствий.",
    "",
    "Если требование не будет рассмотрено добровольно, я оставляю за собой право обратиться в жилищную инспекцию, Роспотребнадзор или суд.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultManagementCompanyAttachments()),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getDefaultManagementCompanyAttachments() {
  return [
    "1. Акт о заливе, осмотре или выявленной проблеме при наличии.",
    "2. Фото, видео, переписка, заявки или ответы управляющей организации.",
    "3. Расчет ущерба, смета, чеки или заключение специалиста при наличии."
  ];
}

function buildAlimonyApplicationText(variant: DocumentGeneratorVariant, values: FormValues) {
  const extraDetails = getVariantExtraDetails(variant, values);
  const attachments = splitLines(values.attachments);
  const documentTitle = variant.key === "court-order" ? "ЗАЯВЛЕНИЕ о вынесении судебного приказа о взыскании алиментов" : "ИСКОВОЕ ЗАЯВЛЕНИЕ о взыскании алиментов";

  return [
    `В ${requiredText(values.courtName)}`,
    "",
    `Заявитель: ${requiredText(values.claimantName)}`,
    `Адрес: ${requiredText(values.claimantAddress)}`,
    stringValue(values.claimantPhone) ? `Телефон: ${stringValue(values.claimantPhone)}` : "",
    "",
    `Должник / ответчик: ${requiredText(values.respondentName)}`,
    stringValue(values.respondentAddress) ? `Адрес: ${stringValue(values.respondentAddress)}` : "",
    "",
    documentTitle,
    "",
    `Ребенок: ${requiredText(values.childName)}, дата рождения: ${formatDateValue(requiredText(values.childBirthDate))}.`,
    `Ребенок ${requiredText(values.childLivesWith)}.`,
    stringValue(values.respondentIncomeInfo) ? `Сведения о доходах второго родителя: ${stringValue(values.respondentIncomeInfo)}.` : "",
    `Ситуация: ${variant.title}.`,
    extraDetails.length ? `Дополнительные сведения: ${extraDetails.join("; ")}.` : "",
    "",
    "Второй родитель обязан участвовать в содержании ребенка. Добровольно вопрос содержания ребенка не урегулирован либо требуется закрепить порядок взыскания алиментов.",
    "",
    "ПРОШУ:",
    `1. ${requiredText(values.demandText)}`,
    "2. Направить исполнительный документ для исполнения в установленном порядке либо выдать его заявителю после вступления судебного акта в силу.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultAlimonyAttachments()),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getDefaultAlimonyAttachments() {
  return [
    "1. Копия свидетельства о рождении ребенка.",
    "2. Документы, подтверждающие проживание ребенка с заявителем.",
    "3. Копии документов для второго родителя или суда.",
    "4. Документы о доходах и расходах при наличии."
  ];
}

function buildLaborInspectionComplaintText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const contractStatus = getOptionLabel(template.baseFields, "employmentContractExists", stringValue(values.employmentContractExists));
  const reason = getOptionLabel(template.baseFields, "complaintReason", stringValue(values.complaintReason));
  const extraDetails = getVariantExtraDetails(variant, values);
  const contactLines = [
    stringValue(values.employeePhone) ? `Телефон: ${stringValue(values.employeePhone)}` : "",
    stringValue(values.employeeEmail) ? `Email: ${stringValue(values.employeeEmail)}` : ""
  ].filter(Boolean);
  const employerLines = [
    `Работодатель: ${requiredText(values.employerName)}`,
    `Адрес работодателя: ${requiredText(values.employerAddress)}`,
    stringValue(values.employerInnOrOgrn) ? `ИНН/ОГРН работодателя: ${stringValue(values.employerInnOrOgrn)}` : ""
  ].filter(Boolean);
  const attachments = splitLines(values.attachments);

  return [
    `В ${requiredText(values.inspectionName)}`,
    stringValue(values.inspectionRegion) ? `Регион: ${stringValue(values.inspectionRegion)}` : "",
    "",
    `От: ${requiredText(values.employeeName)}`,
    `Адрес: ${requiredText(values.employeeAddress)}`,
    ...contactLines,
    "",
    ...employerLines,
    "",
    "ЖАЛОБА",
    "о нарушении трудовых прав",
    "",
    `Я работаю у ${requiredText(values.employerName)} в должности ${requiredText(values.position)}.`,
    stringValue(values.employmentStartDate) ? `Дата начала работы: ${formatDateValue(values.employmentStartDate)}.` : "",
    contractStatus ? `Оформление трудовых отношений: ${contractStatus}.` : "",
    "",
    `Причина жалобы: ${reason || variant.title}.`,
    stringValue(values.violationDates) ? `Период или даты нарушения: ${stringValue(values.violationDates)}.` : "",
    stringValue(values.amountDue) ? `Сумма задолженности или спорных выплат: ${stringValue(values.amountDue)}.` : "",
    "",
    "Обстоятельства:",
    requiredText(values.factsDescription),
    extraDetails.length ? `Дополнительные сведения: ${extraDetails.join("; ")}.` : "",
    "",
    "Считаю, что действия или бездействие работодателя нарушают мои трудовые права и требуют проверки.",
    "",
    "ПРОШУ:",
    "1. Провести проверку изложенных обстоятельств.",
    `2. ${requiredText(values.requestedActions)}`,
    "3. При наличии оснований выдать работодателю предписание об устранении нарушений.",
    "4. Сообщить мне о результатах рассмотрения обращения в установленном порядке.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultLaborAttachments()),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getDefaultLaborAttachments() {
  return [
    "Копия трудового договора или документов, подтверждающих работу, при наличии",
    "Расчетные листки, банковские выписки, графики, табели или переписка",
    "Копии приказов, заявлений и ответов работодателя при наличии"
  ];
}

function buildBailiffComplaintText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const role = getOptionLabel(template.baseFields, "debtorOrCreditorRole", stringValue(values.debtorOrCreditorRole));
  const reason = getOptionLabel(template.baseFields, "complaintReason", stringValue(values.complaintReason));
  const extraDetails = getVariantExtraDetails(variant, values);
  const contactLines = [
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    stringValue(values.applicantEmail) ? `Email: ${stringValue(values.applicantEmail)}` : ""
  ].filter(Boolean);
  const attachments = splitLines(values.attachments);

  return [
    `В ${requiredText(values.authorityName)}`,
    stringValue(values.authorityAddress) ? `Адрес: ${stringValue(values.authorityAddress)}` : "",
    "",
    `От: ${requiredText(values.applicantName)}`,
    `Адрес: ${requiredText(values.applicantAddress)}`,
    ...contactLines,
    "",
    "ЖАЛОБА",
    "на постановление, действие или бездействие судебного пристава-исполнителя",
    "",
    `Я являюсь участником исполнительного производства N ${requiredText(values.enforcementNumber)}${role ? ` в статусе: ${role}` : ""}.`,
    stringValue(values.departmentName) ? `Исполнительное производство находится в ${stringValue(values.departmentName)}.` : "",
    stringValue(values.bailiffName) ? `Судебный пристав-исполнитель: ${stringValue(values.bailiffName)}.` : "",
    stringValue(values.violationDate) ? `О нарушении мне стало известно ${formatDateValue(values.violationDate)}.` : "",
    "",
    `Причина жалобы: ${reason || variant.title}.`,
    "Обстоятельства:",
    requiredText(values.factsDescription),
    extraDetails.length ? `Дополнительные сведения: ${extraDetails.join("; ")}.` : "",
    "",
    "Считаю, что указанное постановление, действие или бездействие нарушает мои права и требует проверки в порядке, предусмотренном законодательством об исполнительном производстве.",
    "",
    "ПРОШУ:",
    `1. Рассмотреть настоящую жалобу по исполнительному производству N ${requiredText(values.enforcementNumber)}.`,
    `2. Проверить законность действий, бездействия или постановления судебного пристава-исполнителя по ситуации: ${variant.title}.`,
    `3. ${requiredText(values.desiredResult)}`,
    "4. Направить мне письменный ответ по результатам рассмотрения жалобы.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultBailiffAttachments()),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getDefaultBailiffAttachments() {
  return [
    "Копия постановления судебного пристава при наличии",
    "Документы, подтверждающие списание, удержание, арест или иное нарушение",
    "Копии заявлений, обращений и ответов ФССП при наличии"
  ];
}

function buildConsumerClaimText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const demandType = stringValue(values.demandType);
  const responseDeadline = getOptionLabel(template.baseFields, "responseDeadlineDays", stringValue(values.responseDeadlineDays));
  const demandText = getConsumerDemandText(demandType, values);
  const extraDetails = getVariantExtraDetails(variant, values);
  const contactLines = [
    stringValue(values.buyerPhone) ? `Телефон: ${stringValue(values.buyerPhone)}` : "",
    stringValue(values.buyerEmail) ? `Email: ${stringValue(values.buyerEmail)}` : ""
  ].filter(Boolean);
  const sellerLines = [
    `Кому: ${requiredText(values.sellerName)}`,
    stringValue(values.sellerAddress) ? `Адрес: ${stringValue(values.sellerAddress)}` : "",
    stringValue(values.sellerInnOrOgrn) ? `ИНН/ОГРН: ${stringValue(values.sellerInnOrOgrn)}` : ""
  ].filter(Boolean);
  const attachments = splitLines(values.attachments);

  return [
    ...sellerLines,
    "",
    `От: ${requiredText(values.buyerName)}`,
    `Адрес для ответа: ${requiredText(values.buyerAddress)}`,
    ...contactLines,
    "",
    "ПРЕТЕНЗИЯ",
    "о защите прав потребителя",
    "",
    `${formatDateValue(requiredText(values.purchaseDate))} я приобрел(а) у ${requiredText(values.sellerName)} ${requiredText(values.productName)} стоимостью ${requiredText(values.purchasePrice)}.`,
    stringValue(values.paymentMethod) ? `Способ оплаты: ${stringValue(values.paymentMethod)}.` : "",
    stringValue(values.orderNumber) ? `Номер заказа, чека или договора: ${stringValue(values.orderNumber)}.` : "",
    "",
    "После покупки возникла следующая проблема:",
    requiredText(values.problemDescription),
    "",
    `Выбранный вариант ситуации: ${variant.title}.`,
    extraDetails.length ? `Дополнительные сведения: ${extraDetails.join("; ")}.` : "",
    stringValue(values.additionalComment) ? `Дополнительный комментарий: ${stringValue(values.additionalComment)}.` : "",
    "",
    "Считаю, что мои права как потребителя нарушены. Прошу рассмотреть претензию и урегулировать ситуацию в добровольном порядке.",
    "",
    "ПРОШУ:",
    `1. ${demandText}`,
    `2. Направить письменный ответ ${responseDeadline ? `в срок ${responseDeadline}` : "в установленный законом срок"} по адресу, указанному в претензии.`,
    "3. При необходимости сообщить порядок передачи товара, проведения проверки качества или возврата денежных средств.",
    "",
    "Если требование не будет рассмотрено добровольно, я оставляю за собой право обратиться за защитой прав в уполномоченные органы или суд.",
    "",
    "Приложения:",
    ...(attachments.length ? attachments.map((attachment, index) => `${index + 1}. ${attachment}.`) : getDefaultConsumerAttachments()),
    "",
    "Дата: ____________________",
    "Подпись: ____________________"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function getConsumerDemandText(demandType: string, values: FormValues) {
  if (demandType === "replace") return "Заменить товар на товар надлежащего качества.";
  if (demandType === "repair") return "Безвозмездно устранить недостатки товара, работы или услуги.";
  if (demandType === "reduce_price") return "Соразмерно уменьшить цену и вернуть соответствующую часть уплаченной суммы.";
  if (demandType === "reimburse_expenses") return "Возместить понесенные расходы, подтвержденные документами.";
  if (demandType === "other") {
    return stringValue(values.additionalComment) || "Исполнить заявленное потребительское требование с учетом описанных обстоятельств.";
  }
  return `Вернуть уплаченную сумму в размере ${requiredText(values.purchasePrice)}.`;
}

function getDefaultConsumerAttachments() {
  return [
    "Копия чека, квитанции, договора или иного подтверждения покупки",
    "Копии переписки, обращений или ответа продавца при наличии",
    "Фото, акт, заключение сервиса или иные доказательства недостатка при наличии"
  ];
}

function getOptionLabel(fields: DocumentField[], fieldName: string, value: string) {
  const field = fields.find((item) => item.name === fieldName);
  return field?.options?.find((option) => option.value === value)?.label ?? "";
}

function getVariantExtraDetails(variant: DocumentGeneratorVariant, values: FormValues) {
  return (variant.extraFields ?? [])
    .map((field) => {
      const value = stringValue(values[field.name]);
      if (!value) return "";
      return `${field.label}: ${value}`;
    })
    .filter(Boolean);
}

function requiredText(value: FormValue | undefined) {
  return stringValue(value) || "[не указано]";
}

function stringValue(value: FormValue | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function splitLines(value: FormValue | undefined) {
  return stringValue(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim().replace(/[.;]+$/, ""))
    .filter(Boolean);
}

function formatDateValue(value: FormValue | undefined) {
  const rawValue = stringValue(value);
  if (!rawValue) return "[не указано]";
  const parts = rawValue.split("-");
  if (parts.length !== 3) return rawValue;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function parseInputDate(value: FormValue | undefined) {
  const rawValue = stringValue(value);
  if (!rawValue) return null;

  const date = new Date(`${rawValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}
