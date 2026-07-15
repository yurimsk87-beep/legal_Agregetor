"use client";

import { FileQuestion } from "lucide-react";
import { TrackableLink } from "@/components/TrackableLink";

type QuestionCtaLinkProps = {
  sourcePage: string;
  defaultCityId?: string;
  defaultServiceId?: string;
  lawyerId?: string;
  label?: string;
  variant?: "primary" | "secondary" | "link";
};

export function QuestionCtaLink({
  sourcePage,
  defaultCityId,
  defaultServiceId,
  lawyerId,
  label = "Задать вопрос",
  variant = "primary"
}: QuestionCtaLinkProps) {
  return (
    <TrackableLink
      href="/questions/#question"
      eventType="CTA_CLICK"
      targetType="QUESTION"
      sourcePage={sourcePage}
      payload={{ defaultCityId, defaultServiceId, lawyerId }}
      className={linkClassName(variant)}
    >
      <FileQuestion className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </TrackableLink>
  );
}

function linkClassName(variant: QuestionCtaLinkProps["variant"]) {
  if (variant === "link") {
    return "inline-flex max-w-full min-w-0 items-center gap-2 break-words rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-ink";
  }

  if (variant === "secondary") {
    return "inline-flex min-h-11 max-w-full min-w-0 items-center justify-center gap-2 break-words rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-trust";
  }

  return "inline-flex min-h-11 max-w-full min-w-0 items-center justify-center gap-2 break-words rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink";
}
