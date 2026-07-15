"use client";

import Link from "next/link";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { QuestionModal } from "@/components/QuestionModal";
import type { Answer, City, Service } from "@/lib/types";
import { formatQuestionDate } from "@/lib/question-display";

export function QuestionAnswerCard({
  answer,
  defaultCityId,
  defaultServiceId,
  sourcePage
}: {
  answer: Answer;
  cities: City[];
  services: Service[];
  defaultCityId?: string | null;
  defaultServiceId?: string | null;
  sourcePage: string;
}) {
  const lawyerHref = answer.lawyerSlug ? `/lawyers/${answer.lawyerSlug}/` : null;
  const ctaLabel = answer.lawyerSlug ? "Перейти в профиль юриста" : "Задать вопрос юристу";

  return (
    <article id={`answer-${answer.id}`} className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {answer.lawyerSlug ? (
            <Link href={`/lawyers/${answer.lawyerSlug}/`} className="text-lg font-semibold text-ink hover:text-trust">
              {answer.lawyerName}
            </Link>
          ) : (
            <span className="text-lg font-semibold text-ink">{answer.lawyerName}</span>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-600">
            <span>{answer.lawyerCity ?? "Россия"}</span>
            <span>{answer.lawyerSpecialization ?? "Юридическая консультация"}</span>
            {answer.lawyerExperienceYears ? <span>Стаж {answer.lawyerExperienceYears} лет</span> : null}
          </div>
          {answer.lawyerProfileStatus === "VERIFIED" ? (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Профиль проверен
            </div>
          ) : null}
        </div>
        <div className="text-sm text-zinc-500">{formatQuestionDate(answer.publishedAt ?? answer.createdAt)}</div>
      </div>
      <p className="mt-4 leading-7 text-zinc-700">{answer.answerText ?? answer.text}</p>
      <div className="mt-5 rounded-lg border border-line bg-zinc-50 p-4">
        {lawyerHref ? (
          <Link href={lawyerHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-trust px-4 text-sm font-semibold text-white hover:bg-ink">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {ctaLabel}
          </Link>
        ) : (
          <QuestionModal sourcePage={sourcePage} defaultCityId={defaultCityId ?? undefined} defaultServiceId={defaultServiceId ?? undefined} label={ctaLabel} />
        )}
      </div>
    </article>
  );
}
