"use client";

import Link from "next/link";
import { useState } from "react";
import type { DocumentResultV1 } from "@/lib/document-result-contract";

export function SaveLegalDocumentButton({ result, disabled = false }: { result: DocumentResultV1; disabled?: boolean }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "login" | "error">("idle");
  const [message, setMessage] = useState("");
  async function save() {
    if (disabled || status === "saving" || status === "saved") return;
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/account/documents/", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentResult: result })
      });
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (response.status === 401) { setStatus("login"); return; }
      if (response.status === 409 && data?.message === "Эта версия уже сохранена.") { setStatus("saved"); return; }
      if (!response.ok) throw new Error(data?.message || "Не удалось сохранить документ.");
      setStatus("saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить документ.");
      setStatus("error");
    }
  }
  return <div className="mt-4 border-t border-amber-300 pt-3">
    <p className="text-sm leading-6">Хранение необязательно: версия будет зашифрована на сервере только после вашего действия. Это не юридическая проверка документа.</p>
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void save()} disabled={disabled || status === "saving" || status === "saved"}
        className="min-h-11 rounded-md border border-amber-800 px-4 py-2 text-sm font-semibold disabled:opacity-60">
        {status === "saving" ? "Сохраняем…" : status === "saved" ? "Версия сохранена" : "Сохранить в мои документы"}
      </button>
      <Link href="/account/documents/" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Мои документы</Link>
    </div>
    {disabled ? <p className="mt-2 text-sm">Сначала сохраните изменения как новую версию.</p> : null}
    {status === "login" ? <p className="mt-2 text-sm" role="status"><Link className="font-semibold underline" href="/login/?next=/account/documents/">Войдите</Link> и затем сохраните эту версию. Текст документа не передан.</p> : null}
    {message ? <p className="mt-2 text-sm text-red-900" role="alert">{message}</p> : null}
  </div>;
}
