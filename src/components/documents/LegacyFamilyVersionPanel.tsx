"use client";
import type { DocumentResultV1 } from "@/lib/document-result-contract";
import { DocumentResultSummary } from "@/components/documents/DocumentResultSummary";
import { DocumentVersionHistory } from "@/components/documents/DocumentVersionHistory";

export function LegacyFamilyVersionPanel({
  current, versions, dirty, onSave, onRestore
}: {
  current: DocumentResultV1 | null;
  versions: readonly DocumentResultV1[];
  dirty: boolean;
  onSave: () => void;
  onRestore: (id: string) => void;
}) {
  if (!current && !dirty) return null;
  return <div className="mt-5 space-y-3">
    {current ? <DocumentResultSummary result={current} archiveDisabled={dirty} /> : null}
    {dirty ? <div className="border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm text-amber-950">Текст изменён. Сохраните новую версию перед скачиванием PDF.</p>
      <button type="button" onClick={onSave} className="mt-3 min-h-11 rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white">Сохранить новую версию</button>
    </div> : null}
    <DocumentVersionHistory versions={versions} currentVersionId={current?.versionId ?? null} onSelect={onRestore} />
  </div>;
}
