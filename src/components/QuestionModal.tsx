"use client";

import { useEffect, useState } from "react";
import { FileQuestion, X } from "lucide-react";
import { QuestionWizard } from "@/components/QuestionWizard";
import { sendAnalyticsEvent } from "@/lib/analytics-client";
import type { City, Service } from "@/lib/types";

type QuestionModalProps = {
  sourcePage: string;
  defaultCityId?: string;
  defaultServiceId?: string;
  lawyerId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "link";
};

type OptionsState = {
  cities: City[];
  services: Service[];
};

export function QuestionModal({
  sourcePage,
  defaultCityId,
  defaultServiceId,
  lawyerId,
  label = "Задать вопрос",
  variant = "primary"
}: QuestionModalProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OptionsState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || options || loading) return;
    setLoading(true);
    setError("");
    fetch("/api/question-wizard/options/")
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as (OptionsState & { ok?: boolean }) | null;
        if (!response.ok || !result) throw new Error("options");
        setOptions({ cities: result.cities, services: result.services });
      })
      .catch(() => setError("Не удалось загрузить города и категории. Попробуйте открыть форму еще раз."))
      .finally(() => setLoading(false));
  }, [loading, open, options]);

  function openModal() {
    setOpen(true);
    sendAnalyticsEvent({
      type: "CTA_CLICK",
      sourcePage,
      targetType: "QUESTION",
      payload: { defaultCityId, defaultServiceId, lawyerId }
    });
  }

  function requestClose() {
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={openModal} className={linkClassName(variant)}>
        <FileQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid min-w-0 place-items-center bg-black/40 px-3 py-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0" onClick={requestClose} />
          <div className="relative grid max-h-[92vh] w-full max-w-3xl min-w-0 overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-semibold text-ink">Задать вопрос юристу</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600">Заполните короткую форму, и вопрос уйдет на модерацию.</p>
              </div>
              <button type="button" onClick={requestClose} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-ink" aria-label="Закрыть">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {loading ? <p className="rounded-lg bg-zinc-50 p-5 text-sm text-zinc-600">Загружаем форму...</p> : null}
            {error ? <p className="rounded-lg bg-red-50 p-5 text-sm text-red-700">{error}</p> : null}
            {options ? (
              <QuestionWizard
                cities={options.cities}
                services={options.services}
                sourcePage={sourcePage}
                defaultCityId={defaultCityId}
                defaultServiceId={defaultServiceId}
                lawyerId={lawyerId}
                compact
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function linkClassName(variant: QuestionModalProps["variant"]) {
  if (variant === "link") {
    return "inline-flex max-w-full min-w-0 items-center gap-2 break-words rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-ink";
  }

  if (variant === "secondary") {
    return "inline-flex min-h-11 max-w-full min-w-0 items-center justify-center gap-2 break-words rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-trust";
  }

  return "inline-flex min-h-11 max-w-full min-w-0 items-center justify-center gap-2 break-words rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink";
}
