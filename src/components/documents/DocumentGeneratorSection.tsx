"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DocumentGeneratorForm } from "@/components/documents/DocumentGeneratorForm";
import type { DocumentGeneratorTemplate, DocumentGeneratorVariant } from "@/lib/types";
import { judicialOrderDebtRoute } from "@/lib/judicial-order-flow";

type Props = {
  template: DocumentGeneratorTemplate;
  instructionHref: string;
};

// Онлайн-генератор прямо на странице документа (страница /generator/ удалена).
// Форма универсальная: карточки вариантов скрыты, чтобы пользователь сразу заполнял документ.
export function DocumentGeneratorSection({ template, instructionHref }: Props) {
  const [initialValues, setInitialValues] = useState<Record<string, string | boolean>>({});
  const selectedVariant = useMemo(() => getUniversalVariant(template), [template]);

  // Поддержка ссылок с ?variant=... остаётся только как якорь к форме: выбор вариантов
  // больше не показываем пользователю.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("variant");
    if (key) requestAnimationFrame(() => document.getElementById("fill-online")?.scrollIntoView({ block: "start" }));
    setInitialValues(readInitialValuesFromUrl());
  }, []);

  if (template.slug === "zayavlenie-v-zags") {
    return <ZagsOfficialApplicationSection template={template} instructionHref={instructionHref} />;
  }

  return (
    <section id="fill-online" className="scroll-mt-24">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Онлайн-заполнение</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Сформировать документ онлайн</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Заполните универсальную форму — сервис соберёт готовый текст документа, учтёт ваше пояснение и подготовит PDF.
          </p>
        </div>
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Сформированный документ является шаблоном и не заменяет индивидуальную юридическую консультацию. Перед подачей проверьте реквизиты, сроки, факты, суммы и приложения.
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Для подготовки итогового текста данные формы и пояснение передаются на сервер обработки. Не указывайте лишние сведения, если они не нужны для документа.</p>
      </div>

      <div className="mt-6">
        <DocumentGeneratorForm
          key={`${selectedVariant.key}-${JSON.stringify(initialValues)}`}
          initialValues={initialValues}
          instructionHref={instructionHref}
          reviewHref={
            template.slug === judicialOrderDebtRoute.documentSlug
              ? `${judicialOrderDebtRoute.reviewUrl}?route_id=${judicialOrderDebtRoute.routeId}&document=${template.slug}`
              : "/document-check/"
          }
          template={template}
          variant={selectedVariant}
        />
      </div>
    </section>
  );
}

const zagsVariantDetails: Record<string, {
  form: string;
  documents: string[];
  deadline: string;
  fee: string;
  submit: string;
  officialHref: string;
}> = {
  marriage: {
    form: "Форма N 7. Если один заявитель не может лично подать совместное заявление — форма N 8 с удостоверенной подписью.",
    documents: ["Паспорта будущих супругов.", "Документ о прекращении предыдущего брака, если он был.", "Разрешение на вступление в брак до брачного возраста, если применимо.", "Документы, подтверждающие основание для регистрации раньше месяца или в день подачи."],
    deadline: "Регистрация — по истечении месяца и не позднее 12 месяцев; при уважительных причинах возможно раньше, при особых обстоятельствах — в день подачи.",
    fee: "Госпошлина за регистрацию брака — 350 руб.",
    submit: "В любой орган ЗАГС по выбору будущих супругов, через МФЦ или официальный электронный сервис, если он доступен.",
    officialHref: "https://do.gosuslugi.ru/services/3500000010000003610/"
  },
  "name-change": {
    form: "Форма N 20 — заявление о перемене имени. Выбор фамилии при заключении брака оформляется в заявлении о браке, а не по форме N 20.",
    documents: ["Паспорт заявителя.", "Свидетельство о рождении.", "Свидетельство о браке или расторжении брака, если оно связано с переменой имени.", "Свидетельства о рождении несовершеннолетних детей, если они есть.", "Согласие родителей, усыновителей или попечителя для заявителя 14-18 лет либо решение суда."],
    deadline: "Заявление рассматривается 1 месяц; при уважительных причинах срок может быть увеличен не более чем на 2 месяца.",
    fee: "Госпошлина за перемену имени — 5000 руб.",
    submit: "В орган ЗАГС. После регистрации перемены имени паспорт нужно заменить в пределах 90 дней; СНИЛС и ИНН как номера не меняются.",
    officialHref: "https://base.garant.ru/72066626/53f89421bbdaf741eb2d1ecc4ddb4c33/"
  },
  "repeat-document": {
    form: "Форма N 26 — для повторного свидетельства о заключении брака, свидетельства о расторжении брака, справки о заключении или расторжении брака.",
    documents: ["Паспорт заявителя.", "Документы, подтверждающие право на получение повторного документа.", "Доверенность, если обращается представитель.", "Документ об оплате госпошлины, если сведения об оплате не поступили автоматически."],
    deadline: "При личном обращении документ выдаётся в день обращения, если запись есть в ЕГР ЗАГС.",
    fee: "Повторное свидетельство — 500 руб.; справка из архива ЗАГС — 350 руб.",
    submit: "В орган ЗАГС, через МФЦ или официальный электронный сервис. Разведённому лицу повторное свидетельство о заключении брака не выдаётся — нужна справка или иной подтверждающий документ.",
    officialHref: "https://do.gosuslugi.ru/services/3500000000197508937/"
  },
  "record-correction": {
    form: "Форма N 23 — заявление о внесении исправления или изменения в запись акта гражданского состояния.",
    documents: ["Паспорт заявителя.", "Свидетельство, которое нужно обменять из-за исправления.", "Документы, подтверждающие основание исправления или изменения.", "Документ об оплате госпошлины.", "Письменный отказ ЗАГС, если он уже есть."],
    deadline: "Заявление рассматривается 1 месяц; при уважительных причинах срок может быть увеличен не более чем на 2 месяца.",
    fee: "Госпошлина за исправление или изменение записи — 700 руб.",
    submit: "В орган ЗАГС. Если есть спор между заинтересованными лицами, ЗАГС не решает его сам — может потребоваться судебное решение.",
    officialHref: "https://base.garant.ru/72066626/53f89421bbdaf741eb2d1ecc4ddb4c33/"
  }
};

function ZagsOfficialApplicationSection({ instructionHref, template }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedVariant = template.variants.find((variant) => variant.key === selectedKey) ?? null;
  const selectedDetails = selectedVariant ? zagsVariantDetails[selectedVariant.key] : null;

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("variant");
    if (key && template.variants.some((variant) => variant.key === key)) setSelectedKey(key);
  }, [template.variants]);

  function selectVariant(key: string) {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", key);
    url.hash = "fill-online";
    window.history.replaceState(null, "", url);
  }

  function resetVariant() {
    setSelectedKey(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("variant");
    url.hash = "fill-online";
    window.history.replaceState(null, "", url);
  }

  return (
    <section id="fill-online" className="scroll-mt-24">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Заявление в ЗАГС</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Выберите официальный вариант заявления</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Для ЗАГС нельзя использовать один свободный текст заявления. Выберите цель обращения — покажем установленную форму, документы, срок, госпошлину и безопасный способ подачи.
        </p>
      </div>

      {!selectedVariant ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {template.variants.map((variant) => (
            <button
              key={variant.key}
              type="button"
              onClick={() => selectVariant(variant.key)}
              className="min-h-11 rounded-lg border border-line bg-white p-5 text-left shadow-sm outline-none hover:border-trust focus:border-trust focus:ring-2 focus:ring-trust/20"
            >
              <span className="text-lg font-semibold text-ink">{variant.title}</span>
              <span className="mt-2 block text-sm leading-6 text-zinc-600">{variant.description}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedVariant && selectedDetails ? (
        <article className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-trust">Выбранный вариант</p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">{selectedVariant.title}</h3>
            </div>
            <button type="button" onClick={resetVariant} className="min-h-11 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:border-trust focus:outline-none">
              Выбрать другой
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <InfoPanel title="Форма" text={selectedDetails.form} />
            <InfoPanel title="Куда подать" text={selectedDetails.submit} />
            <InfoPanel title="Срок и пошлина" text={`${selectedDetails.deadline} ${selectedDetails.fee}`} />
            <div className="rounded-lg border border-line bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-ink">Документы</p>
              <ul className="mt-2 grid gap-1 text-sm leading-6 text-zinc-700">
                {selectedDetails.documents.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            {selectedVariant.generatedTextHints?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Что проверить перед подачей</p>
                <ul className="mt-2 grid gap-1">
                  {selectedVariant.generatedTextHints.map((hint) => (
                    <li key={hint}>- {hint}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={selectedDetails.officialHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink focus:outline-none focus:ring-2 focus:ring-trust/30">
              Перейти к подаче заявления
            </a>
            <Link href={instructionHref} className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-trust focus:outline-none focus:ring-2 focus:ring-trust/20">
              Вернуться к маршруту
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}

function InfoPanel({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-lg border border-line bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}

function getUniversalVariant(template: DocumentGeneratorTemplate): DocumentGeneratorVariant {
  const base = template.variants[0] ?? {
    key: "universal",
    title: "Универсальный документ",
    description: template.description
  };
  return {
    ...base,
    title: "Универсальный документ",
    description: "Одна форма для подготовки документа без выбора отдельного сценария применения.",
    extraFields: [],
    generatedTextHints: []
  };
}

function readInitialValuesFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const values: Record<string, string | boolean> = {};
  [
    "receivedWay",
    "receivedDateStatus",
    "receivedDate",
    "claimantName",
    "objectionReason",
    "objectionComment",
    "creditContractInfo"
  ].forEach((key) => {
    const value = params.get(key);
    if (value) values[key] = value;
  });
  if (params.get("requestTermRestoration") === "true") values.requestTermRestoration = true;
  return values;
}
