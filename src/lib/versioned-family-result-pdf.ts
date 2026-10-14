import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { DocumentResultV1 } from "@/lib/document-result-contract";

/** Clearly marked family result PDF. Does not impersonate a court or official ZAGS form. */
export async function createVersionedFamilyResultPdfBlob(result: DocumentResultV1): Promise<Blob> {
  if (result.categorySlug !== "semya-i-deti" || result.filingReady) {
    throw new Error("Нельзя экспортировать неподтверждённый тип результата.");
  }
  const [pdfModule, fontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")
  ]);
  const pdfMake = pdfModule.default;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void })
    .addVirtualFileSystem(fontsModule.default as unknown as Record<string, string>);
  const kindName = result.resultKind === "PREPARED_DATA" || result.resultKind === "OFFICIAL_FORM"
    ? "ЛИСТ ПОДГОТОВЛЕННЫХ ДАННЫХ — НЕ ОФИЦИАЛЬНЫЙ БЛАНК"
    : "ПРОЕКТ — НЕ ГОТОВ К ПОДАЧЕ";
  const content: Content[] = [
    { text: kindName, fontSize: 15, bold: true, color: "#92400e", margin: [0, 0, 0, 12] },
    { text: result.documentTitle, fontSize: 13, bold: true, margin: [0, 0, 0, 14] },
    ...result.documentText.split("\n").map((line) => ({
      text: line || " ", fontSize: 10, margin: [0, 0, 0, line ? 4 : 8]
    } as Content))
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 60],
    defaultStyle: { font: "Roboto", color: "#18181b", fontSize: 10 },
    content,
    footer: (page, pages) => ({
      margin: [42, 10, 42, 0],
      columns: [
        { text: `ID версии: ${result.versionId} | Правовая сверка: ${result.legalRegistryReviewedAt}`, fontSize: 7, color: "#71717a" },
        { text: `${page}/${pages}`, fontSize: 8, alignment: "right" }
      ]
    }),
    info: { title: result.documentTitle, creator: "ПравоПоиск" }
  };
  return new Promise<Blob>((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBlob(resolve); }
    catch (error) { reject(error); }
  });
}
