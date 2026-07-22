"use client";

import { useEffect, useMemo, useState } from "react";
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
    return <ZagsDocumentGeneratorSection template={template} instructionHref={instructionHref} initialValues={initialValues} />;
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

function ZagsDocumentGeneratorSection({ initialValues, instructionHref, template }: Props & { initialValues: Record<string, string | boolean> }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedVariant = template.variants.find((variant) => variant.key === selectedKey) ?? null;
  const formInitialValues = selectedVariant ? { ...initialValues, zagsProcedure: selectedVariant.key } : initialValues;

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
        <h2 className="mt-2 text-2xl font-semibold text-ink">Выберите официальный генератор</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
          Для разных обращений в ЗАГС применяются разные формы. Выберите цель — дальше появятся поля именно для нужного заявления, приложения, пошлина и порядок подачи.
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

      {selectedVariant ? (
        <div className="mt-6 grid gap-6">
          <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-trust">Выбранный вариант</p>
                <h3 className="mt-2 text-2xl font-semibold text-ink">{selectedVariant.title}</h3>
              </div>
              <button type="button" onClick={resetVariant} className="min-h-11 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-trust focus:border-trust focus:outline-none">
                Выбрать другой
              </button>
            </div>
          </div>

          <DocumentGeneratorForm
            key={`${selectedVariant.key}-${JSON.stringify(formInitialValues)}`}
            initialValues={formInitialValues}
            instructionHref={instructionHref}
            reviewHref={`/document-review/?document=${template.slug}&variant=${selectedVariant.key}`}
            template={template}
            variant={selectedVariant}
          />
        </div>
      ) : null}
    </section>
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
