import type { ReactNode } from "react";
import { SaveLegalDocumentButton } from "@/components/documents/SaveLegalDocumentButton";
import type { DocumentResultV1 } from "@/lib/document-result-contract";

export function DocumentResultSummary({
  result,
  label,
  children,
  archiveDisabled = false
}: {
  result: DocumentResultV1;
  label?: string;
  children?: ReactNode;
  archiveDisabled?: boolean;
}) {
  return (
    <section className="border-l-4 border-amber-400 bg-amber-50 p-4 text-amber-950" aria-label="Юридический статус документа">
      <p className="font-semibold">
        {label ?? (result.requiresLegalReview
          ? "ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА"
          : "ПОДГОТОВЛЕННЫЕ СВЕДЕНИЯ — ПРОВЕРЬТЕ ПЕРЕД ИСПОЛЬЗОВАНИЕМ")}
      </p>
      <h2 className="mt-2 text-xl font-semibold">{result.documentTitle}</h2>
      <p className="mt-2 text-sm leading-6">
        Готовность к подаче не подтверждена.
        {result.requiresLegalReview ? " Требуется индивидуальная юридическая проверка." : " Сверьте результат с официальной процедурой и формой."}
      </p>
      <p className="mt-2 break-all text-xs">ID версии: {result.versionId}</p>
      {children}
      <SaveLegalDocumentButton key={result.versionId} result={result} disabled={archiveDisabled} />
    </section>
  );
}
