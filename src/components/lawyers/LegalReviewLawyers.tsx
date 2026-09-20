"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { QuestionModal, type QuestionContext } from "@/components/QuestionModal";
import { getFamilyReviewService } from "@/lib/legal-review-lawyers";

type ReviewLawyer = { id: string; slug: string; fullName: string; photoUrl?: string | null; specialization: string; cityId?: string | null };

export function LegalReviewLawyers({ context, serviceSlug }: { context: QuestionContext; serviceSlug?: string }) {
  const [lawyers, setLawyers] = useState<ReviewLawyer[]>([]);
  const [message, setMessage] = useState("Проверяем доступных профильных юристов...");
  const resolvedServiceSlug = serviceSlug ?? getFamilyReviewService(context.route, context.scenario);

  useEffect(() => {
    let active = true;
    fetch(`/api/legal-review-lawyers/?service=${encodeURIComponent(resolvedServiceSlug)}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { items?: ReviewLawyer[]; message?: string | null } | null;
        if (!response.ok || !body) throw new Error("lawyers");
        if (active) {
          setLawyers(body.items ?? []);
          setMessage(body.message ?? "");
        }
      })
      .catch(() => active && setMessage("Не удалось проверить доступность юристов. Можно открыть общую форму вопроса."));
    return () => { active = false; };
  }, [resolvedServiceSlug]);

  return (
    <section className="mt-5 rounded-md border border-line bg-white p-4" aria-labelledby="legal-review-lawyers-title">
      <h4 id="legal-review-lawyers-title" className="text-lg font-semibold text-ink">Профильные юристы</h4>
      {message ? <p className="mt-2 text-sm leading-6 text-zinc-600">{message}</p> : null}
      {lawyers.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{lawyers.map((lawyer) => (
        <article key={lawyer.id} className="grid grid-cols-[3.5rem_1fr] gap-3 rounded-md border border-line p-3">
          {lawyer.photoUrl ? <Image src={lawyer.photoUrl} alt="" width={56} height={56} className="h-14 w-14 rounded-md object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-md bg-zinc-100 font-semibold text-ink">{lawyer.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</div>}
          <div className="min-w-0"><p className="break-words font-semibold text-ink">{lawyer.fullName}</p><p className="mt-1 text-xs leading-5 text-zinc-600">{lawyer.specialization}</p><div className="mt-2"><QuestionModal sourcePage={context.route} defaultCityId={lawyer.cityId ?? undefined} defaultServiceSlug={resolvedServiceSlug} lawyerId={lawyer.id} context={context} label="Задать вопрос" variant="secondary" /></div></div>
        </article>
      ))}</div> : null}
      <div className="mt-4"><QuestionModal sourcePage={context.route} defaultServiceSlug={resolvedServiceSlug} context={context} label="Спросить юриста" variant="primary" /></div>
    </section>
  );
}
