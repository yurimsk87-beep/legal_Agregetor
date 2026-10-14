import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { DocumentResultV1 } from "@/lib/document-result-contract";

/** Personal data sheet only. NEVER represent this export as an official ZAGS form. */
export async function createZagsPreparedDataPdfBlob(result: DocumentResultV1): Promise<Blob> {
  if (result.categorySlug !== "semya-i-deti" ||
      result.routeSlug !== "brak-zags-i-smena-familii" ||
      result.resultKind !== "PREPARED_DATA" ||
      result.filingReady) {
    throw new Error("Недопустимый результат для экспорта листа ЗАГС.");
  }
  const [pdfMakeModule, vfsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")
  ]);
  const pdfMake = pdfMakeModule.default;
  const vfs = vfsModule.default as unknown as Record<string, string>;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfs);
  const content: Content[] = [
    { text: "ЛИСТ ПОДГОТОВЛЕННЫХ ДАННЫХ", bold: true, fontSize: 17, margin: [0, 0, 0, 10] },
    { text: "НЕ ОФИЦИАЛЬНЫЙ БЛАНК. Перед подачей используйте форму Минюста, применимую к вашей ситуации.", bold: true, color: "#92400e", margin: [0, 0, 0, 12] },
    { text: result.documentTitle, bold: true, fontSize: 12, margin: [0, 0, 0, 10] },
    ...result.documentText.split("\n").filter(Boolean).map((line) => ({ text: line, margin: [0, 0, 0, 5] } as Content))
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 60],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#18181b" },
    content,
    footer: (page, pages) => ({
      margin: [42, 12, 42, 0],
      columns: [
        { text: `ID версии: ${result.versionId} · Проверка источников: ${result.legalRegistryReviewedAt}`, fontSize: 7, color: "#71717a" },
        { text: `${page}/${pages}`, alignment: "right", fontSize: 8 }
      ]
    }),
    info: { title: "Лист подготовленных сведений для ЗАГС", creator: "ПравоПоиск" }
  };
  return new Promise<Blob>((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBlob(resolve); }
    catch (error) { reject(error); }
  });
}
