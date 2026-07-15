"use client";

import { Send } from "lucide-react";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { QuestionModal } from "@/components/QuestionModal";
import { TrackableLink } from "@/components/TrackableLink";

export function StickyCta({ href, label, source }: { href: string; label: string; source: string }) {
  const targetHref = href === "#question" ? "/questions/#question" : href;

  if (href === "#question") {
    const isQuestionPage = source.startsWith("/questions/");

    return (
      <div data-seo-block="cta" className="fixed inset-x-0 bottom-0 z-50 flex justify-center border-t border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur md:hidden">
        {isQuestionPage ? <QuestionModal sourcePage={source} label={label} /> : <QuestionCtaLink sourcePage={source} label={label} />}
      </div>
    );
  }

  return (
    <div data-seo-block="cta" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 px-4 py-3 shadow-soft backdrop-blur md:hidden">
      <TrackableLink
        href={targetHref}
        eventType="STICKY_CTA_CLICKED"
        targetType="CTA"
        sourcePage={source}
        className="mx-auto flex min-h-11 max-w-md items-center justify-center gap-2 rounded-md bg-trust px-4 text-sm font-semibold text-white"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {label}
      </TrackableLink>
    </div>
  );
}
