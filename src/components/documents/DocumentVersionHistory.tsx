"use client";

import type { DocumentResultV1 } from "@/lib/document-result-contract";

export function DocumentVersionHistory({
  versions,
  currentVersionId,
  onSelect
}: {
  versions: readonly DocumentResultV1[];
  currentVersionId: string | null;
  onSelect: (versionId: string) => void;
}) {
  if (versions.length < 2) return null;
  return <section className="mt-6 border-t border-line pt-5" aria-label="Версии сформированного результата">
    <h3 className="text-lg font-semibold text-ink">Версии документа в этой вкладке</h3>
    <p className="mt-1 text-xs leading-5 text-zinc-600">Версии не сохраняются после закрытия или обновления страницы. Для долговременного хранения скачайте PDF.</p>
    <ol className="mt-3 grid gap-2">
      {versions.map((item) => <li key={item.versionId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{item.documentTitle}</p>
          <p className="break-all text-xs text-zinc-600">{item.versionId}</p>
        </div>
        <button type="button" aria-pressed={currentVersionId === item.versionId} disabled={currentVersionId === item.versionId} onClick={() => onSelect(item.versionId)} className="min-h-11 rounded-md border border-trust px-3 text-sm font-semibold text-trust disabled:opacity-60">
          {currentVersionId === item.versionId ? "Текущая версия" : "Открыть версию"}
        </button>
      </li>)}
    </ol>
  </section>;
}
