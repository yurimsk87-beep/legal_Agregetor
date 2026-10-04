import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

export function getDivorcePropertyPdfFilename(documentSlug: string, filingReady: boolean) {
  return `${filingReady ? "" : "CHERNOVIK-"}${documentSlug}.pdf`;
}

export async function createDivorcePropertyPdfBlob(text: string, title: string) {
  const [pdfMakeModule, vfsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts")
  ]);
  const pdfMake = pdfMakeModule.default;
  const vfs = vfsModule.default as unknown as Record<string, string>;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfs);

  const content: Content[] = [
    { text: title, style: "title" },
    { text, style: "document" }
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 60],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.35, color: "#18181b" },
    content,
    styles: {
      title: { fontSize: 18, bold: true, margin: [0, 0, 0, 16] },
      document: { fontSize: 10, lineHeight: 1.45 }
    }
  };

  return new Promise<Blob>((resolve, reject) => {
    try {
      pdfMake.createPdf(definition).getBlob(resolve);
    } catch (error) {
      reject(error);
    }
  });
}
