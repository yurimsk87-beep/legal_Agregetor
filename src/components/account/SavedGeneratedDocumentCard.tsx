"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedDraft = {
  documentSlug?: string;
  documentTitle?: string;
  documentVariant?: string;
  generatedText?: string;
  createdAt?: string;
};

export function SavedGeneratedDocumentCard() {
  const [draft, setDraft] = useState<SavedDraft | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pravopoisk:document-review");
      setDraft(raw ? (JSON.parse(raw) as SavedDraft) : null);
    } catch {
      setDraft(null);
    }
  }, []);

  if (!draft?.generatedText) return null;

  const documentHref = draft.documentSlug ? `/documents/${draft.documentSlug}/#fill-online` : "/documents/";

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Сохранённый черновик</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{draft.documentTitle ?? "Сформированный документ"}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Документ сохранён в этом браузере. Его можно открыть, скачать или передать юристу на проверку.
      </p>
      <div className="mt-4 rounded-lg bg-zinc-50 p-4">
        <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{draft.generatedText}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/document-review/" className="inline-flex min-h-10 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink">
          Проверить у юриста
        </Link>
        <Link href={documentHref} className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
          Открыть документ
        </Link>
      </div>
    </section>
  );
}
