"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { DocumentField, DocumentGeneratorTemplate, DocumentGeneratorVariant } from "@/lib/types";
import { downloadGeneratedDocumentPdf } from "@/lib/document-export";
import { judicialOrderDebtRoute } from "@/lib/judicial-order-flow";

type FormValue = string | boolean;
type FormValues = Record<string, FormValue>;
type PdfStatus = "idle" | "error" | "opened";

type DocumentGeneratorFormProps = {
  initialValues?: FormValues;
  instructionHref?: string;
  reviewHref?: string;
  template: DocumentGeneratorTemplate;
  variant: DocumentGeneratorVariant;
};

type FieldSection = {
  title: string;
  description: string;
  fieldNames: string[];
};

type GeneratedDocumentMeta = {
  description: string;
  warnings: string[];
  attachments: string[];
  paymentInfo: string[];
  submissionSteps: string[];
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
      fieldNames: ["courtName", "judgeName", "courtAddress"]
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
  ],
  "zayavlenie-v-zags": [
    {
      title: "Куда подаёте",
      description: "Не указывайте вымышленные реквизиты: если точный ЗАГС неизвестен, оставьте поле пустым и заполните при подаче.",
      fieldNames: ["zagsOffice", "applicationDate"]
    },
    {
      title: "Заявитель",
      description: "Данные заявителя нужны для форм 8, 20, 23 и 26.",
      fieldNames: ["applicantName", "applicantBirthDate", "applicantBirthPlace", "applicantCitizenship", "applicantNationality", "applicantAddress", "applicantPhone", "applicantIdentityDocument", "applicantIdentitySeriesNumber", "applicantIdentityIssuer", "applicantIdentityIssueDate"]
    },
    {
      title: "Заключение брака",
      description: "Для совместного заявления используется форма N 7, если один заявитель не может лично подать заявление — форма N 8.",
      fieldNames: ["marriageApplicationMode", "partner1Name", "partner1BirthDate", "partner1BirthPlace", "partner1Citizenship", "partner1Nationality", "partner1Residence", "partner1IdentityDocument", "partner1IdentityDetails", "partner1MaritalStatus", "partner1PreviousMarriageDoc", "partner1RequestedSurname", "partner2Name", "partner2BirthDate", "partner2BirthPlace", "partner2Citizenship", "partner2Nationality", "partner2Residence", "partner2IdentityDocument", "partner2IdentityDetails", "partner2MaritalStatus", "partner2PreviousMarriageDoc", "partner2RequestedSurname", "commonMinorChildrenCount", "requestedRegistrationDate", "requestEarlyRegistration", "earlyRegistrationReason", "earlyRegistrationDocument"]
    },
    {
      title: "Перемена имени",
      description: "Форма N 20 применяется для отдельной процедуры перемены фамилии, имени или отчества.",
      fieldNames: ["newSurname", "newName", "newPatronymic", "birthActNumber", "birthActDate", "birthActOffice", "nameChangeFamilyStatus", "familyStatusDocument", "minorChildrenInfo", "nameChangeReason", "recordsToChange", "recordsNotToChange", "ageGroup", "minorConsentBasis"]
    },
    {
      title: "Повторный документ или справка",
      description: "Форма N 26 применяется к документам о заключении или расторжении брака. Для справки об отсутствии факта регистрации используется форма N 24.",
      fieldNames: ["requestedRepeatDocument", "marriageCurrentStatus", "spouseMaleName", "spouseFemaleName", "marriageActOffice", "marriageActDate", "marriageActNumber", "documentPurpose", "absenceCheckPeriod", "requestedOtherDetails", "documentDeliveryOffice", "requesterRelation"]
    },
    {
      title: "Исправление записи",
      description: "Форма N 23 заполняется, когда нужно внести исправление или изменение в актовую запись.",
      fieldNames: ["recordActType", "recordActNumber", "recordActDate", "recordActOffice", "recordPersonName", "correctionFieldName", "currentRecordValue", "correctRecordValue", "correctionReason", "errorMadeByZags", "affectsThirdPartyRights", "hasWrittenRefusal", "refusalDetails", "exchangeDocuments", "basisDocuments"]
    },
    {
      title: "Приложения",
      description: "Можно добавить свой список документов, если он уже известен.",
      fieldNames: ["attachments"]
    }
  ]
};

export function DocumentGeneratorForm({ initialValues, reviewHref = "/document-review/", template, variant }: DocumentGeneratorFormProps) {
  const isZagsApplication = template.slug === "zayavlenie-v-zags";
  const fields = useMemo(() => [...template.baseFields], [template.baseFields]);
  const [values, setValues] = useState<FormValues>(() => getInitialValues(fields, initialValues));
  const [generatedText, setGeneratedText] = useState("");
  const [userSituationComment, setUserSituationComment] = useState("");
  const [generationStatus, setGenerationStatus] = useState<"idle" | "loading" | "fallback">("idle");
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>("idle");
  const resultRef = useRef<HTMLPreElement>(null);

  const fieldSections = getFieldSections(template.slug);
  const visibleFields = fields.filter((field) => shouldShowField(field, values));
  const sectionFieldNames = new Set(fieldSections.flatMap((section) => section.fieldNames));
  const unsectionedBaseFields = visibleFields.filter((field) => !sectionFieldNames.has(field.name));
  const previewTitle = isZagsApplication ? "Официальная форма" : template.documentType === "objection" ? "Текст возражений" : "Текст документа";
  const resultMeta = useMemo(() => getGeneratedDocumentMeta(template, variant, values), [template, values, variant]);
  const emptyPreviewText =
    isZagsApplication
      ? "Заполните поля слева и нажмите «Подготовить документ». Здесь появится текст выбранной официальной формы ЗАГС."
      : template.documentType === "objection"
      ? "Заполните поля слева и нажмите «Подготовить черновик». Здесь появится образец возражений относительно исполнения судебного приказа."
      : "Заполните поля слева и нажмите «Подготовить черновик». Здесь появится черновик документа.";

  function updateValue(field: DocumentField, value: FormValue) {
    setValues((current) => ({ ...current, [field.name]: value }));
    setPdfStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valuesWithComment = { ...values, userSituationComment };
    const draftText = buildDocumentText(template, variant, valuesWithComment);
    let text = draftText;

    if (isZagsApplication) {
      setGeneratedText(text);
      saveDocumentReviewDraft(template, variant, valuesWithComment, text);
      setGenerationStatus("idle");
      setPdfStatus("idle");
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
      return;
    }

    setGenerationStatus("loading");
    try {
      const response = await fetch("/api/document-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: template.slug,
          templateTitle: template.title,
          variantKey: variant.key,
          values: valuesWithComment,
          userComment: userSituationComment,
          draftText
        })
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; text?: string; llmStatus?: string } | null;
      if (response.ok && result?.ok && result.text) {
        text = result.text;
        setGenerationStatus(result.llmStatus === "success" ? "idle" : "fallback");
      } else {
        setGenerationStatus("fallback");
      }
    } catch {
      setGenerationStatus("fallback");
    }

    setGeneratedText(text);
    saveDocumentReviewDraft(template, variant, valuesWithComment, text);
    setPdfStatus("idle");
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
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

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form onSubmit={handleSubmit} className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">{isZagsApplication ? "Официальная форма" : "Универсальная форма"}</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{template.title}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {isZagsApplication
              ? "Заполните поля выбранной формы. Подпись не подставляется автоматически: её ставят при подаче или удостоверяют в предусмотренных случаях."
              : "Заполните известные поля и добавьте пояснение, если важные детали не помещаются в стандартную форму."}
          </p>
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

          <fieldset className="rounded-lg border border-line bg-zinc-50 p-4">
            <legend className="px-1 text-lg font-semibold text-ink">Пояснение к ситуации</legend>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              {isZagsApplication
                ? "Укажите детали для проверки юристом. В официальный бланк ЗАГС попадут только поля, предусмотренные выбранной формой."
                : "Укажите детали, которые не отражены в полях выше: спорную сумму, платежи, переписку, ошибки взыскателя, действия пристава или другое важное обстоятельство."}
            </p>
            <textarea
              value={userSituationComment}
              onChange={(event) => setUserSituationComment(event.currentTarget.value)}
              rows={5}
              maxLength={2000}
              placeholder={isZagsApplication ? "Например: один заявитель не может прийти лично, нужна регистрация раньше месяца, ошибка допущена в записи о браке..." : "Например: с суммой не согласен, часть долга была оплачена, расчёт взыскателя не приложен, о приказе узнал только после уведомления банка..."}
              className="mt-4 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-trust"
            />
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {isZagsApplication ? "Комментарий сохранится для проверки, но не заменяет официальные поля формы." : "ИИ учтёт это пояснение при подготовке итогового текста документа."}
            </p>
          </fieldset>

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
          disabled={generationStatus === "loading"}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-wait disabled:bg-zinc-400 sm:w-auto"
        >
          {generationStatus === "loading" ? "Формируем документ..." : "Подготовить документ"}
        </button>
      </form>

      <aside className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-trust">Итоговый документ</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{previewTitle}</h2>
          </div>
        </div>
        {generatedText ? (
          <p className="mt-3 text-xs leading-5 text-zinc-500">Данные используются для формирования документа и проверки текста. Не добавляйте лишние сведения, если они не нужны для документа.</p>
        ) : null}
        {generationStatus === "fallback" ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            Документ сформирован по шаблону. ИИ-доработка сейчас недоступна или заняла слишком много времени.
          </p>
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
                <p className="font-semibold">Перед отправкой проверьте</p>
                <ul className="mt-2 grid gap-1">
                  {resultMeta.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
                <Link href={reviewHref} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-ink hover:text-trust">
                  Проверить сроки и формулировки
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
        <pre ref={resultRef} className="mt-5 min-h-[520px] scroll-mt-24 whitespace-pre-wrap rounded-lg border border-line bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
          {generatedText || emptyPreviewText}
        </pre>
        {generatedText ? (
          <div className="mt-4 rounded-lg border border-line bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-ink">Следующий шаг</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={reviewHref} className="inline-flex min-h-10 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink">
                Проверить документ у юриста
              </Link>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust"
              >
                Скачать PDF
              </button>
              <Link href="/login/?next=%2Faccount%2Fdocuments%2F" className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
                Сохранить в кабинет
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Сохраните документ в кабинете, чтобы вернуться к нему позже, проверить статус и получить ответ юриста.
            </p>
          </div>
        ) : null}
        {generatedText ? (
          <div className="mt-4 grid gap-4">
            <ResultList title="Госпошлина" items={resultMeta.paymentInfo} />
            <ResultList title="Приложения" items={resultMeta.attachments} />
            <ResultList title="Как подать документ" items={resultMeta.submissionSteps} ordered />
          </div>
        ) : null}
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

function getInitialValues(fields: DocumentField[], initialValues: FormValues = {}): FormValues {
  return fields.reduce<FormValues>((acc, field) => {
    acc[field.name] = acc[field.name] ?? (field.type === "checkbox" ? false : "");
    return acc;
  }, { ...initialValues });
}

function saveDocumentReviewDraft(
  template: DocumentGeneratorTemplate,
  variant: DocumentGeneratorVariant,
  values: FormValues,
  generatedText: string
) {
  try {
    const caseContext = sessionStorage.getItem("pravopoisk:judicial-order-case");
    sessionStorage.setItem(
      "pravopoisk:document-review",
      JSON.stringify({
        source: "document_generator",
        routeId: isJudicialOrderDebtDocument(template, variant) ? judicialOrderDebtRoute.routeId : null,
        documentSlug: template.slug,
        documentTitle: template.title,
        documentVariant: variant.key,
        generatedText,
        values,
        caseContext: caseContext ? JSON.parse(caseContext) : null,
        createdAt: new Date().toISOString()
      })
    );
  } catch {
    // Проверку можно продолжить вручную даже если браузер запретил sessionStorage.
  }
}

function isJudicialOrderDebtDocument(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant) {
  return template.slug === judicialOrderDebtRoute.documentSlug && variant.key === judicialOrderDebtRoute.documentVariant;
}

function shouldShowField(field: DocumentField, values: FormValues) {
  if (!field.showWhen) return true;
  return values[field.showWhen.field] === field.showWhen.equals;
}

function getFieldSections(templateSlug: string) {
  return fieldSectionsByTemplate[templateSlug] ?? [];
}

function getGeneratedDocumentMeta(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues): GeneratedDocumentMeta {
  const customAttachments = splitLines(values.attachments);
  const deadlineWarning = getDeadlineWarning(template.slug, values);
  const commonSubmissionSteps = [
    "Проверьте данные в документе.",
    "Распечатайте и подпишите документ.",
    "Приложите копии нужных документов.",
    "Подайте документ нужному адресату.",
    "Сохраните подтверждение отправки."
  ];

  if (template.slug === "zayavlenie-v-zags") {
    return {
      description: getZagsResultDescription(variant, values),
      warnings: getZagsWarnings(variant, values),
      attachments: customAttachments.length ? customAttachments : getZagsDefaultAttachments(variant, values),
      paymentInfo: getZagsPaymentInfo(variant, values),
      submissionSteps: getZagsSubmissionSteps(variant, values)
    };
  }

  if (template.slug === "vozrazhenie-na-sudebnyy-prikaz") {
    return {
      description: "Черновик возражений готов. Проверьте дату получения приказа, номер дела, суд, взыскателя и список приложений.",
      warnings: [
        deadlineWarning,
        Boolean(values.requestTermRestoration)
          ? "Если срок подачи возражения пропущен, суд может не принять документ без заявления о восстановлении срока."
          : "",
        "Отмена судебного приказа не списывает долг: взыскатель вправе затем обратиться в суд с иском."
      ].filter(Boolean),
      attachments: customAttachments.length ? customAttachments : getDefaultJudicialOrderAttachments(Boolean(values.requestTermRestoration), stringValue(values.receivedDateStatus)),
      paymentInfo: [],
      submissionSteps: [
        "Подайте документ тому же мировому судье или в тот судебный участок, который вынес судебный приказ.",
        "Можно подать лично через канцелярию, заказным письмом с описью вложения или электронно через ГАС «Правосудие», если доступна подача.",
        "Если срок спорный, приложите просьбу о восстановлении срока и подтверждающие документы.",
        "Сохраните отметку суда, почтовую квитанцию, опись вложения, трек-номер или электронное подтверждение отправки.",
        "Отслеживайте определение суда об отмене приказа: после принятия возражений суд уведомляет стороны, обычно в течение нескольких дней.",
        "Если уже есть приставы или списания, передайте определение об отмене приставу или банку."
      ]
    };
  }

  if (template.slug === "zayavlenie-o-vosstanovlenii-sroka-na-otmenu-sudebnogo-prikaza") {
    return {
      description: "Заявление о восстановлении срока готово. Его обычно подают вместе с возражениями на судебный приказ.",
      warnings: ["Перед отправкой проверьте, достаточно ли документов, подтверждающих дату получения приказа или причину пропуска срока."],
      attachments: customAttachments.length ? customAttachments : getDefaultTermRestorationAttachments(splitLines(values.proofDocuments)),
      paymentInfo: [],
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
      paymentInfo: [],
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
      paymentInfo: [],
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
      paymentInfo: [],
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
      paymentInfo: [],
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
    paymentInfo: [],
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
  if (template.slug === "zayavlenie-v-zags") {
    return buildZagsApplicationText(variant, values);
  }

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

const ZAGS_LAST_REVIEWED_AT = "21.07.2026";

const ZAGS_OPTION_LABELS: Record<string, Record<string, string>> = {
  marriageApplicationMode: {
    joint: "совместное заявление лиц, вступающих в брак",
    separate_absent: "отдельное заявление лица, которое не может лично обратиться"
  },
  earlyRegistrationReason: {
    pregnancy: "беременность",
    child_birth: "рождение ребёнка",
    life_threat: "непосредственная угроза жизни одной из сторон",
    other: "другое особое или уважительное обстоятельство"
  },
  partner1MaritalStatus: {
    never_married: "в браке не состоял",
    divorced: "разведён",
    widowed: "вдовец",
    other: "иное"
  },
  partner2MaritalStatus: {
    never_married: "в браке не состояла",
    divorced: "разведена",
    widowed: "вдова",
    other: "иное"
  },
  nameChangeFamilyStatus: {
    never_married: "в браке не состоял(а)",
    married: "состою в браке",
    divorced: "разведён(а)",
    widowed: "вдовец (вдова)",
    other: "иное"
  },
  ageGroup: {
    adult: "18 лет и старше",
    minor14to18: "от 14 до 18 лет"
  },
  minorConsentBasis: {
    representatives_consent: "согласие родителей, усыновителей или попечителя",
    court_decision: "решение суда",
    full_capacity: "полная дееспособность до 18 лет"
  },
  requestedRepeatDocument: {
    repeat_marriage_certificate: "повторное свидетельство о заключении брака",
    marriage_reference: "справку о заключении брака",
    no_marriage_record_reference: "справку об отсутствии факта государственной регистрации заключения брака"
  },
  marriageCurrentStatus: {
    active: "брак не расторгнут и не признан недействительным",
    divorced: "брак расторгнут",
    invalidated: "брак признан недействительным",
    unknown: "статус нужно уточнить"
  },
  requesterRelation: {
    self: "за себя",
    deceased_relative: "за умершего родственника",
    representative: "по доверенности",
    other: "иное подтверждённое право"
  },
  recordActType: {
    marriage: "заключение брака",
    divorce: "расторжение брака",
    birth: "рождение",
    death: "смерть",
    name_change: "перемена имени",
    other: "иная запись акта гражданского состояния"
  }
};

export function buildZagsApplicationText(variant: DocumentGeneratorVariant, values: FormValues) {
  if (variant.key === "marriage") return buildZagsMarriageText(values);
  if (variant.key === "name-change") return buildZagsNameChangeText(values);
  if (variant.key === "repeat-document") return buildZagsRepeatDocumentText(values);
  if (variant.key === "record-correction") return buildZagsRecordCorrectionText(values);
  return "";
}

function buildZagsMarriageText(values: FormValues) {
  if (stringValue(values.marriageApplicationMode) === "separate_absent") {
    return [
      "Форма N 8",
      "ЗАЯВЛЕНИЕ О ЗАКЛЮЧЕНИИ БРАКА",
      "(заполняется лицом, вступающим в брак и не имеющим возможности лично обратиться для подачи заявления)",
      "",
      `В ${requiredText(values.zagsOffice)}`,
      `Заявитель: ${requiredText(values.partner1Name)}`,
      `Контактный телефон: ${requiredText(values.applicantPhone)}`,
      "",
      "Прошу произвести государственную регистрацию заключения брака в порядке, предусмотренном пунктом 2 статьи 26 Федерального закона от 15.11.1997 N 143-ФЗ \"Об актах гражданского состояния\".",
      "Подтверждаю добровольное согласие на заключение брака и отсутствие обстоятельств, препятствующих заключению брака, указанных в статье 14 Семейного кодекса Российской Федерации.",
      "",
      "О лице, с которым заключается брак:",
      `Фамилия, имя, отчество: ${requiredText(values.partner2Name)}`,
      `Дата рождения: ${formatDateValue(values.partner2BirthDate)}`,
      "",
      "О себе:",
      `Фамилия, имя, отчество: ${requiredText(values.partner1Name)}`,
      `Дата рождения: ${formatDateValue(values.partner1BirthDate)}`,
      `Место рождения: ${requiredText(values.partner1BirthPlace)}`,
      `Гражданство: ${requiredText(values.partner1Citizenship)}`,
      stringValue(values.partner1Nationality) ? `Национальность: ${stringValue(values.partner1Nationality)}` : "",
      `Место жительства: ${requiredText(values.partner1Residence)}`,
      `Документ, удостоверяющий личность: ${requiredText(values.partner1IdentityDocument)}; ${requiredText(values.partner1IdentityDetails)}`,
      `Семейное положение до вступления в брак: ${zagsOptionLabel("partner1MaritalStatus", values.partner1MaritalStatus) || "[не указано]"}`,
      stringValue(values.partner1PreviousMarriageDoc) ? `Документ, подтверждающий прекращение предыдущего брака: ${stringValue(values.partner1PreviousMarriageDoc)}` : "",
      `Количество общих детей, не достигших совершеннолетия: ${stringValue(values.commonMinorChildrenCount) || "0"}`,
      `Прошу после заключения брака присвоить мне фамилию: ${requiredText(values.partner1RequestedSurname)}`,
      "",
      `Дата: ${zagsSignatureDate(values)}`,
      "Подпись заявителя: ____________________",
      "",
      "Важно: лицо, которое обращается лично, представляет совместное заявление по форме N 7 и это отдельное заявление по форме N 8. Подпись на форме N 8 должна быть удостоверена в предусмотренном порядке, если заявление не направляется через ЕПГУ.",
      buildEarlyMarriageRequestText(values)
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "Форма N 7",
    "ЗАЯВЛЕНИЕ О ЗАКЛЮЧЕНИИ БРАКА",
    "(заполняется лицами, вступающими в брак)",
    "",
    `В ${requiredText(values.zagsOffice)}`,
    `Государственную регистрацию просим назначить на: ${formatDateValue(values.requestedRegistrationDate)}`,
    "",
    "Просим произвести государственную регистрацию заключения брака.",
    "Подтверждаем взаимное добровольное согласие на заключение брака и отсутствие обстоятельств, препятствующих заключению брака, указанных в статье 14 Семейного кодекса Российской Федерации.",
    "",
    "Сведения о лицах, вступающих в брак:",
    "",
    "Он",
    ...buildMarriagePersonLines(values, "partner1"),
    "",
    "Она",
    ...buildMarriagePersonLines(values, "partner2"),
    "",
    `Количество общих детей, не достигших совершеннолетия: ${stringValue(values.commonMinorChildrenCount) || "0"}`,
    "",
    "Просим после заключения брака присвоить фамилии:",
    `мужу: ${requiredText(values.partner1RequestedSurname)}`,
    `жене: ${requiredText(values.partner2RequestedSurname)}`,
    "",
    `Дата: ${zagsSignatureDate(values)}`,
    "Подпись его: ____________________",
    "Подпись её: ____________________",
    buildEarlyMarriageRequestText(values)
  ]
    .filter(Boolean)
    .join("\n");
}

function buildZagsNameChangeText(values: FormValues) {
  return [
    "Форма N 20",
    "ЗАЯВЛЕНИЕ О ПЕРЕМЕНЕ ИМЕНИ",
    "",
    `В ${requiredText(values.zagsOffice)}`,
    `Заявитель: ${requiredText(values.applicantName)}`,
    `Контактный телефон: ${requiredText(values.applicantPhone)}`,
    "",
    "Прошу переменить мне:",
    `фамилию на: ${requiredText(values.newSurname)}`,
    `собственно имя на: ${requiredText(values.newName)}`,
    `отчество на: ${requiredText(values.newPatronymic)}`,
    "",
    "Сведения о заявителе:",
    `Фамилия, имя, отчество: ${requiredText(values.applicantName)}`,
    `Дата рождения: ${formatDateValue(values.applicantBirthDate)}`,
    `Место рождения: ${requiredText(values.applicantBirthPlace)}`,
    `Реквизиты записи акта о рождении: запись акта N ${requiredText(values.birthActNumber)} от ${formatDateValue(values.birthActDate)}, ${requiredText(values.birthActOffice)}`,
    `Гражданство: ${requiredText(values.applicantCitizenship)}`,
    stringValue(values.applicantNationality) ? `Национальность: ${stringValue(values.applicantNationality)}` : "",
    `Место жительства: ${requiredText(values.applicantAddress)}`,
    `Документ, удостоверяющий личность: ${formatApplicantIdentity(values)}`,
    `Семейное положение: ${zagsOptionLabel("nameChangeFamilyStatus", values.nameChangeFamilyStatus) || "[не указано]"}`,
    stringValue(values.familyStatusDocument) ? `Документ, подтверждающий семейное положение: ${stringValue(values.familyStatusDocument)}` : "",
    stringValue(values.minorChildrenInfo) ? `Сведения о детях, не достигших совершеннолетия:\n${stringValue(values.minorChildrenInfo)}` : "Сведения о детях, не достигших совершеннолетия: отсутствуют или будут заполнены при приёме заявления.",
    `Причина перемены фамилии, собственно имени, отчества: ${requiredText(values.nameChangeReason)}`,
    "",
    "Документы, прилагаемые к заявлению:",
    ...numberedOrPlaceholder(getZagsDefaultAttachments({ key: "name-change", title: "", description: "" }, values)),
    "",
    stringValue(values.recordsToChange) ? `Прошу внести изменения в следующие записи актов гражданского состояния:\n${stringValue(values.recordsToChange)}` : "Прошу внести изменения в записи актов гражданского состояния, которые определит орган ЗАГС при приёме заявления.",
    stringValue(values.recordsNotToChange) ? `Прошу не вносить изменения в записи актов гражданского состояния:\n${stringValue(values.recordsNotToChange)}` : "",
    "",
    `Дата: ${zagsSignatureDate(values)}`,
    "Подпись заявителя: ____________________"
  ]
    .filter(Boolean)
    .join("\n");
}

function buildZagsRepeatDocumentText(values: FormValues) {
  const documentType = getRepeatDocumentType(values);
  if (documentType === "no_marriage_record_reference") return buildZagsNoMarriageRecordReferenceText(values);

  return [
    "Форма N 26",
    "ЗАЯВЛЕНИЕ",
    "",
    `В ${requiredText(values.zagsOffice)}`,
    `Заявитель: ${requiredText(values.applicantName)}`,
    `Адрес места жительства: ${requiredText(values.applicantAddress)}`,
    `Документ, удостоверяющий личность: ${formatApplicantIdentity(values)}`,
    `Контактный телефон: ${requiredText(values.applicantPhone)}`,
    "",
    "Прошу выдать:",
    markOption("повторное свидетельство о заключении брака", documentType === "repeat_marriage_certificate"),
    markOption("справку о заключении брака", documentType === "marriage_reference"),
    "",
    "Сообщаю следующие сведения о супругах:",
    `он: ${requiredText(values.spouseMaleName)}`,
    `она: ${requiredText(values.spouseFemaleName)}`,
    `Место государственной регистрации: ${requiredText(values.marriageActOffice)}`,
    `Дата государственной регистрации: ${formatDateValue(values.marriageActDate)}`,
    `Номер записи акта: ${requiredText(values.marriageActNumber)}`,
    `Документ прошу выдать в связи с: ${requiredText(values.documentPurpose)}`,
    stringValue(values.requestedOtherDetails) ? `Прошу указать следующие иные сведения: ${stringValue(values.requestedOtherDetails)}` : "",
    `Документ прошу выслать в: ${requiredText(values.documentDeliveryOffice)}`,
    "",
    `Дата: ${zagsSignatureDate(values)}`,
    "Подпись заявителя: ____________________"
  ]
    .filter(Boolean)
    .join("\n");
}

function buildZagsNoMarriageRecordReferenceText(values: FormValues) {
  return [
    "Форма N 24",
    "ЗАЯВЛЕНИЕ",
    "",
    `В ${requiredText(values.zagsOffice)}`,
    `Заявитель: ${requiredText(values.applicantName)}`,
    `Адрес места жительства: ${requiredText(values.applicantAddress)}`,
    `Документ, удостоверяющий личность: ${formatApplicantIdentity(values)}`,
    `Контактный телефон: ${requiredText(values.applicantPhone)}`,
    "",
    "Прошу выдать справку об отсутствии факта государственной регистрации заключения брака.",
    "",
    "Сообщаю следующие сведения о лице, в отношении которого запрашивается документ:",
    `Фамилия, имя, отчество: ${requiredText(values.applicantName)}`,
    `Дата рождения: ${formatDateValue(values.applicantBirthDate)}`,
    `Место рождения: ${requiredText(values.applicantBirthPlace)}`,
    `Документ необходим: ${requiredText(values.documentPurpose)}`,
    `Проверку прошу провести за период: ${requiredText(values.absenceCheckPeriod)}`,
    `Документ прошу выслать в: ${requiredText(values.documentDeliveryOffice)}`,
    "",
    `Дата: ${zagsSignatureDate(values)}`,
    "Подпись заявителя: ____________________"
  ].join("\n");
}

function buildZagsRecordCorrectionText(values: FormValues) {
  return [
    "Форма N 23",
    "ЗАЯВЛЕНИЕ О ВНЕСЕНИИ ИСПРАВЛЕНИЯ ИЛИ ИЗМЕНЕНИЯ В ЗАПИСЬ АКТА ГРАЖДАНСКОГО СОСТОЯНИЯ",
    "",
    `В ${requiredText(values.zagsOffice)}`,
    `Заявитель: ${requiredText(values.applicantName)}, ${formatDateValue(values.applicantBirthDate)}, ${requiredText(values.applicantBirthPlace)}`,
    `Адрес места жительства: ${requiredText(values.applicantAddress)}`,
    `Контактный телефон: ${requiredText(values.applicantPhone)}`,
    `Документ, удостоверяющий личность: ${formatApplicantIdentity(values)}`,
    "",
    "Прошу внести исправления/изменения в запись акта гражданского состояния:",
    `1. ${zagsOptionLabel("recordActType", values.recordActType) || requiredText(values.recordActType)} N ${requiredText(values.recordActNumber)} от ${formatDateValue(values.recordActDate)}`,
    `Орган, которым была произведена государственная регистрация: ${requiredText(values.recordActOffice)}`,
    `В отношении: ${requiredText(values.recordPersonName)}`,
    `${requiredText(values.correctionFieldName)} исправить (изменить): с ${requiredText(values.currentRecordValue)} на ${requiredText(values.correctRecordValue)};`,
    "",
    `Причина исправления/изменения: ${requiredText(values.correctionReason)}`,
    stringValue(values.refusalDetails) ? `Реквизиты письменного отказа ЗАГС: ${stringValue(values.refusalDetails)}` : "",
    "",
    "Документы, прилагаемые к заявлению, подлежащие обмену в связи с внесением исправления/изменения:",
    ...numberedOrPlaceholder(splitLines(values.exchangeDocuments)),
    "",
    "Документы, подтверждающие наличие основания для внесения исправления/изменения:",
    ...numberedOrPlaceholder(splitLines(values.basisDocuments)),
    "",
    `Дата: ${zagsSignatureDate(values)}`,
    "Подпись заявителя: ____________________"
  ].join("\n");
}

function buildMarriagePersonLines(values: FormValues, prefix: "partner1" | "partner2") {
  const maritalStatusField = prefix === "partner1" ? "partner1MaritalStatus" : "partner2MaritalStatus";
  return [
    `Фамилия, имя, отчество: ${requiredText(values[`${prefix}Name`])}`,
    `Дата рождения: ${formatDateValue(values[`${prefix}BirthDate`])}`,
    `Место рождения: ${requiredText(values[`${prefix}BirthPlace`])}`,
    `Гражданство: ${requiredText(values[`${prefix}Citizenship`])}`,
    stringValue(values[`${prefix}Nationality`]) ? `Национальность: ${stringValue(values[`${prefix}Nationality`])}` : "",
    `Место жительства: ${requiredText(values[`${prefix}Residence`])}`,
    `Документ, удостоверяющий личность: ${requiredText(values[`${prefix}IdentityDocument`])}; ${requiredText(values[`${prefix}IdentityDetails`])}`,
    `Семейное положение до вступления в брак: ${zagsOptionLabel(maritalStatusField, values[maritalStatusField]) || "[не указано]"}`,
    stringValue(values[`${prefix}PreviousMarriageDoc`]) ? `Документ, подтверждающий прекращение предыдущего брака: ${stringValue(values[`${prefix}PreviousMarriageDoc`])}` : ""
  ].filter(Boolean);
}

function buildEarlyMarriageRequestText(values: FormValues) {
  if (!values.requestEarlyRegistration) return "";
  return [
    "",
    "ПРИЛОЖЕНИЕ",
    "Просьба об изменении срока государственной регистрации заключения брака",
    "",
    "Это не установленная приказом Минюста форма, а отдельное обращение к заявлению о заключении брака.",
    `Просим назначить государственную регистрацию заключения брака на ${formatDateValue(values.requestedRegistrationDate)} до истечения общего месячного срока.`,
    `Обстоятельство: ${zagsOptionLabel("earlyRegistrationReason", values.earlyRegistrationReason) || requiredText(values.earlyRegistrationReason)}.`,
    `Подтверждающий документ: ${requiredText(values.earlyRegistrationDocument)}.`,
    "",
    `Дата: ${zagsSignatureDate(values)}`,
    "Подписи заявителей: ____________________ / ____________________"
  ].join("\n");
}

function getZagsResultDescription(variant: DocumentGeneratorVariant, values: FormValues) {
  if (variant.key === "marriage") {
    return stringValue(values.marriageApplicationMode) === "separate_absent"
      ? `Готова форма N 8. Дата проверки формы и пошлины: ${ZAGS_LAST_REVIEWED_AT}.`
      : `Готова форма N 7. Дата проверки формы и пошлины: ${ZAGS_LAST_REVIEWED_AT}.`;
  }
  if (variant.key === "name-change") return `Готова форма N 20. Дата проверки формы и пошлины: ${ZAGS_LAST_REVIEWED_AT}.`;
  if (variant.key === "record-correction") return `Готова форма N 23. Дата проверки формы и пошлины: ${ZAGS_LAST_REVIEWED_AT}.`;
  const formNumber = getRepeatDocumentType(values) === "no_marriage_record_reference" ? "N 24" : "N 26";
  return `Готова форма ${formNumber}. Дата проверки формы и пошлины: ${ZAGS_LAST_REVIEWED_AT}.`;
}

function getZagsWarnings(variant: DocumentGeneratorVariant, values: FormValues) {
  const common = ["Подпись не подставляется автоматически: подпишите документ при подаче или удостоверьте подпись, если это требуется для выбранного способа."];
  if (variant.key === "marriage") {
    return [
      ...common,
      stringValue(values.marriageApplicationMode) === "separate_absent" ? "Форма N 8 подаётся вместе с формой N 7, которую представляет второй заявитель." : "",
      values.requestEarlyRegistration ? "Регистрация раньше месяца или в день обращения требует подтверждающих документов и решения органа ЗАГС." : ""
    ].filter(Boolean);
  }
  if (variant.key === "name-change") {
    return [
      ...common,
      stringValue(values.ageGroup) === "minor14to18" ? "Для заявителя 14-18 лет проверьте согласие законных представителей, решение суда или полную дееспособность." : "",
      "После перемены ФИО паспорт нужно заменить в установленный срок; СНИЛС и ИНН как номера не меняются."
    ].filter(Boolean);
  }
  if (variant.key === "repeat-document") {
    return [
      ...common,
      wasMarriageTerminated(values) && stringValue(values.requestedRepeatDocument) === "repeat_marriage_certificate"
        ? "Так как брак расторгнут или признан недействительным, вместо повторного свидетельства о заключении брака сформирована просьба о справке."
        : "",
      getRepeatDocumentType(values) === "no_marriage_record_reference" ? "Для справки об отсутствии факта регистрации заключения брака используется форма N 24, а не форма N 26." : ""
    ].filter(Boolean);
  }
  return [
    ...common,
    values.errorMadeByZags ? "Льгота по госпошлине применяется только если ошибка допущена при государственной регистрации по вине работников ЗАГС." : "",
    values.affectsThirdPartyRights ? "Если есть спор между заинтересованными лицами, ЗАГС может отказать и предложить судебный порядок." : ""
  ].filter(Boolean);
}

function getZagsDefaultAttachments(variant: DocumentGeneratorVariant, values: FormValues) {
  if (variant.key === "marriage") {
    return [
      "Документы, удостоверяющие личности лиц, вступающих в брак.",
      needsPreviousMarriageDocument(values.partner1MaritalStatus) ? "Документ о прекращении предыдущего брака для первого заявителя." : "",
      needsPreviousMarriageDocument(values.partner2MaritalStatus) ? "Документ о прекращении предыдущего брака для второго заявителя." : "",
      values.requestEarlyRegistration ? "Документ, подтверждающий беременность, рождение ребёнка, угрозу жизни или другое особое обстоятельство." : "",
      stringValue(values.marriageApplicationMode) === "separate_absent" ? "Отдельное заявление по форме N 8 с удостоверенной подписью отсутствующего заявителя, если заявление не направляется через ЕПГУ." : "",
      "Сведения об оплате госпошлины или документ об оплате, если сведения не поступили автоматически."
    ].filter(Boolean);
  }
  if (variant.key === "name-change") {
    return [
      "Паспорт заявителя.",
      "Свидетельство о рождении заявителя.",
      stringValue(values.nameChangeFamilyStatus) === "married" ? "Свидетельство о заключении брака или сведения о записи акта о заключении брака." : "",
      stringValue(values.nameChangeFamilyStatus) === "divorced" ? "Свидетельство о расторжении брака или сведения о записи акта о расторжении брака." : "",
      stringValue(values.minorChildrenInfo) ? "Свидетельства о рождении несовершеннолетних детей." : "",
      stringValue(values.ageGroup) === "minor14to18" ? "Согласие родителей, усыновителей или попечителя, решение суда либо документы о полной дееспособности." : "",
      "Сведения об оплате госпошлины или документ об оплате, если сведения не поступили автоматически."
    ].filter(Boolean);
  }
  if (variant.key === "repeat-document") {
    return [
      "Паспорт заявителя.",
      "Документы, подтверждающие право получить свидетельство или справку.",
      stringValue(values.requesterRelation) === "deceased_relative" ? "Документы о родстве и свидетельство о смерти лица, в отношении которого запрашивается документ." : "",
      stringValue(values.requesterRelation) === "representative" ? "Нотариальная доверенность представителя." : "",
      "Сведения об оплате госпошлины, льготе или документ об оплате, если сведения не поступили автоматически."
    ].filter(Boolean);
  }
  return [
    "Паспорт заявителя.",
    "Свидетельство, содержащее ошибку и подлежащее обмену.",
    "Документы, подтверждающие правильные сведения.",
    stringValue(values.requesterRelation) === "representative" ? "Нотариальная доверенность представителя." : "",
    values.hasWrittenRefusal ? "Письменный отказ ЗАГС." : "",
    values.errorMadeByZags ? "Документы, подтверждающие, что ошибка допущена при государственной регистрации по вине работников ЗАГС." : "Сведения об оплате госпошлины или документ об оплате, если сведения не поступили автоматически."
  ].filter(Boolean);
}

export function getZagsPaymentInfo(variant: DocumentGeneratorVariant, values: FormValues) {
  if (variant.key === "marriage") return ["350 руб. за государственную регистрацию заключения брака, включая выдачу свидетельства. Отдельная федеральная пошлина за сокращение срока не указана."];
  if (variant.key === "name-change") return ["5000 руб. за государственную регистрацию перемены имени, включая выдачу свидетельства о перемене имени."];
  if (variant.key === "repeat-document") {
    const documentType = getRepeatDocumentType(values);
    return documentType === "repeat_marriage_certificate"
      ? ["500 руб. за выдачу повторного свидетельства о государственной регистрации акта гражданского состояния."]
      : ["350 руб. за выдачу справки из архива органа ЗАГС или иного уполномоченного органа. Проверьте льготу, если справка нужна для назначения или перерасчёта пенсии либо пособия."];
  }
  return values.errorMadeByZags
    ? ["Госпошлина не уплачивается, если исправление связано с ошибкой, допущенной при государственной регистрации по вине работников ЗАГС."]
    : ["700 руб. за внесение исправлений или изменений в записи актов гражданского состояния, включая выдачу свидетельства."];
}

function getZagsSubmissionSteps(variant: DocumentGeneratorVariant, values: FormValues) {
  if (variant.key === "marriage") {
    return [
      "Подайте заявление в выбранный орган ЗАГС, через ЕПГУ или МФЦ, если такой способ доступен для выбранной услуги.",
      "Если используется форма N 8, второй заявитель представляет форму N 7 и форму N 8 отсутствующего лица.",
      "Регистрация брака проводится по истечении месяца и не позднее 12 месяцев со дня подачи заявления.",
      "При уважительных причинах срок может быть сокращён, при особых обстоятельствах регистрация возможна в день обращения.",
      "На регистрацию брака оба лица должны явиться лично."
    ];
  }
  if (variant.key === "name-change") {
    return [
      "Подайте заявление в орган ЗАГС лично или через доступный официальный электронный сервис.",
      "Заявление рассматривается в месячный срок; при уважительных причинах срок может быть увеличен не более чем на два месяца.",
      "После регистрации выдают свидетельство о перемене имени и вносят изменения в связанные записи актов гражданского состояния.",
      "Замените паспорт в установленный срок; СНИЛС и ИНН как номера не меняются, обновляются персональные данные."
    ];
  }
  if (variant.key === "repeat-document") {
    return [
      "Подайте заявление в орган ЗАГС, через МФЦ, почтой или через официальный электронный сервис, если выбранный способ доступен.",
      getRepeatDocumentType(values) === "no_marriage_record_reference" ? "Для формы N 24 документ направляют в орган ЗАГС по месту жительства или пребывания заявителя." : "В форме N 26 можно попросить выслать документ в выбранный орган ЗАГС.",
      "Если запись найдена и право на получение подтверждено, заявителю выдают повторное свидетельство или справку.",
      "При отказе запросите письменные причины отказа."
    ];
  }
  return [
    "Подайте заявление в орган ЗАГС, в котором хранится запись, либо в иной орган ЗАГС, который примет документы по установленному порядку.",
    "Приложите свидетельство к обмену и документы, подтверждающие правильные сведения.",
    "Заявление рассматривается в месячный срок; при уважительных причинах срок может быть увеличен не более чем на два месяца.",
    "Если есть спор или ЗАГС отказывает, запросите письменный отказ и проверьте судебный порядок."
  ];
}

export function getRepeatDocumentType(values: FormValues) {
  const requested = stringValue(values.requestedRepeatDocument) || "repeat_marriage_certificate";
  if (requested === "repeat_marriage_certificate" && wasMarriageTerminated(values)) return "marriage_reference";
  return requested;
}

function wasMarriageTerminated(values: FormValues) {
  const status = stringValue(values.marriageCurrentStatus);
  return status === "divorced" || status === "invalidated";
}

function needsPreviousMarriageDocument(value: FormValue | undefined) {
  const status = stringValue(value);
  return status === "divorced" || status === "widowed" || status === "other";
}

function zagsOptionLabel(fieldName: string, value: FormValue | undefined) {
  const rawValue = stringValue(value);
  return ZAGS_OPTION_LABELS[fieldName]?.[rawValue] ?? rawValue;
}

function formatApplicantIdentity(values: FormValues) {
  return [
    requiredText(values.applicantIdentityDocument),
    stringValue(values.applicantIdentitySeriesNumber) ? `серия/номер ${stringValue(values.applicantIdentitySeriesNumber)}` : "",
    stringValue(values.applicantIdentityIssuer) ? `выдан ${stringValue(values.applicantIdentityIssuer)}` : "",
    stringValue(values.applicantIdentityIssueDate) ? `дата выдачи ${formatDateValue(values.applicantIdentityIssueDate)}` : ""
  ].filter(Boolean).join(", ");
}

function zagsSignatureDate(values: FormValues) {
  return stringValue(values.applicationDate) ? formatDateValue(values.applicationDate) : "____________________";
}

function markOption(label: string, isActive: boolean) {
  return `${isActive ? "[x]" : "[ ]"} ${label}`;
}

function numberedOrPlaceholder(items: string[]) {
  const visibleItems = items.filter(Boolean);
  return visibleItems.length ? visibleItems.map((item, index) => `${index + 1}. ${item}.`) : ["1. [будет заполнено при подаче]"];
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

function buildJudicialOrderObjectionText(template: DocumentGeneratorTemplate, variant: DocumentGeneratorVariant, values: FormValues) {
  const requestTermRestoration = Boolean(values.requestTermRestoration);
  const objectionReason = getOptionLabel(template.baseFields, "objectionReason", stringValue(values.objectionReason));
  const extraDetails = getVariantExtraDetails(variant, values);
  const attachments = [
    "Копия судебного приказа.",
    "Документы, подтверждающие дату получения судебного приказа.",
    requestTermRestoration ? "Документы, подтверждающие уважительность причин пропуска срока." : "",
    "Копии документов, подтверждающих доводы возражений, если они есть.",
    "Доверенность представителя, если заявление подаёт представитель."
  ].filter(Boolean);
  const contactLines = [
    stringValue(values.applicantPhone) ? `Телефон: ${stringValue(values.applicantPhone)}` : "",
    stringValue(values.applicantEmail) ? `Email: ${stringValue(values.applicantEmail)}` : ""
  ].filter(Boolean);

  return [
    `В ${requiredText(values.courtName)}`,
    stringValue(values.judgeName) ? `Мировому судье: ${stringValue(values.judgeName)}` : "",
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
    "Закон не требует подробно мотивировать такие возражения, однако сообщаю дополнительные обстоятельства, которые прошу учесть при рассмотрении заявления.",
    objectionReason ? `Причина возражений: ${objectionReason}.` : "",
    extraDetails.length ? `Дополнительные сведения по выбранному варианту: ${extraDetails.join("; ")}.` : "",
    "",
    "На основании статей 128 и 129 Гражданского процессуального кодекса Российской Федерации прошу отменить судебный приказ.",
    stringValue(values.objectionComment) ? `\nДополнительно сообщаю: ${stringValue(values.objectionComment)}` : "",
    requestTermRestoration
      ? `\nТакже прошу восстановить срок подачи возражений относительно исполнения судебного приказа, поскольку срок был пропущен по уважительным причинам: ${stringValue(values.missedTermReason) || "причины будут подтверждены приложенными документами"}.\n\nНа основании статьи 112 Гражданского процессуального кодекса Российской Федерации прошу восстановить пропущенный процессуальный срок. Подтверждающие документы прилагаю.`
      : "",
    "",
    "ПРОШУ:",
    requestTermRestoration
      ? "1. Восстановить срок подачи возражений относительно исполнения судебного приказа.\n2. Принять настоящие возражения.\n3. Отменить судебный приказ по делу N " + requiredText(values.caseNumber) + "."
      : "1. Принять настоящие возражения относительно исполнения судебного приказа.\n2. Отменить судебный приказ по делу N " + requiredText(values.caseNumber) + ".",
    "",
    "Приложения:",
    ...attachments.map((item, index) => `${index + 1}. ${item}`),
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
