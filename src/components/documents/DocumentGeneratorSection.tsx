"use client";

import { useEffect, useState } from "react";
import { DocumentGeneratorForm } from "@/components/documents/DocumentGeneratorForm";
import type { DocumentGeneratorTemplate } from "@/lib/types";

type Props = {
  template: DocumentGeneratorTemplate;
  instructionHref: string;
};

// Онлайн-генератор прямо на странице документа (страница /generator/ удалена).
// Вариант выбирается на клиенте (state + ?variant= из URL), серверного чтения
// searchParams нет — поэтому страница документа остаётся статической (SSG),
// кэшируемой и индексируемой.
export function DocumentGeneratorSection({ template, instructionHref }: Props) {
  // Один вариант = универсальный шаблон: показываем форму сразу, без шага выбора.
  const isSingleVariant = template.variants.length === 1;
  const [selectedKey, setSelectedKey] = useState<string | null>(isSingleVariant ? template.variants[0].key : null);
  const selectedVariant = template.variants.find((variant) => variant.key === selectedKey) ?? null;

  // Поддержка ссылок с ?variant=... (карточки ситуаций/категорий, старые ссылки
  // на /generator/?variant= после 301): предвыбираем вариант и скроллим к форме.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("variant");
    if (key && template.variants.some((variant) => variant.key === key)) {
      setSelectedKey(key);
      requestAnimationFrame(() => document.getElementById("fill-online")?.scrollIntoView({ block: "start" }));
    }
  }, [template]);

  function selectVariant(key: string) {
    setSelectedKey(key);
    // Держим вариант в URL, чтобы ссылкой можно было поделиться; без перезагрузки.
    window.history.replaceState(null, "", `${window.location.pathname}?variant=${key}`);
  }

  return (
    <section id="fill-online" className="scroll-mt-24">
      <div className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Онлайн-заполнение</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Сформировать документ онлайн</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {isSingleVariant
              ? "Заполните форму — сервис соберёт готовый текст документа, который можно скачать в DOCX или PDF."
              : "Выберите вариант применения документа — форма подстроит поля и подсказки под вашу ситуацию, а затем соберёт готовый текст, который можно скачать в DOCX или PDF."}
          </p>
        </div>
        {!isSingleVariant ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {template.variants.map((variant) => {
              const isSelected = variant.key === selectedKey;
              return (
                <article
                  key={variant.key}
                  className={`flex min-w-0 flex-col rounded-lg border p-4 ${isSelected ? "border-trust bg-trust/5" : "border-line bg-zinc-50"}`}
                >
                  <h3 className="text-lg font-semibold text-ink">{variant.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{variant.description}</p>
                  <button
                    type="button"
                    onClick={() => selectVariant(variant.key)}
                    className={`mt-4 inline-flex min-h-10 w-fit items-center justify-center rounded-md px-4 py-2 text-sm font-semibold ${
                      isSelected ? "bg-ink text-white" : "bg-trust text-white hover:bg-ink"
                    }`}
                  >
                    {isSelected ? "Вариант выбран" : "Выбрать вариант"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : null}
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Сформированный документ является шаблоном и не заменяет индивидуальную юридическую консультацию. Перед подачей проверьте реквизиты, сроки, факты, суммы и приложения.
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Документ формируется на вашем устройстве: данные из формы не отправляются на сервер и не сохраняются.</p>
      </div>

      {selectedVariant ? (
        <div className="mt-6">
          <DocumentGeneratorForm key={selectedVariant.key} instructionHref={instructionHref} template={template} variant={selectedVariant} />
        </div>
      ) : null}
    </section>
  );
}
