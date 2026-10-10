import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { FAMILY_ADDITIVE_LEGAL_REVIEWED_AT } from "@/data/family-additive-legal-review";
import type { FamilyAdditiveDecision } from "@/lib/family-additive-validator";

export async function createFamilyAdditivePdfBlob(decision: FamilyAdditiveDecision, documentText: string) {
  const [pdfMakeModule, vfsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfsModule.default as unknown as Record<string, string>);
  const content: Content[] = [{ text: documentText, style: "document" }];
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [48, 52, 48, 62],
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.4, color: "#18181b" },
    footer: (page, pages) => ({ margin: [48, 10, 48, 0], columns: [{ text: `Правовая сверка: ${FAMILY_ADDITIVE_LEGAL_REVIEWED_AT}`, style: "footer" }, { text: `${page}/${pages}`, alignment: "right", style: "footer" }] }),
    content,
    styles: { document: { fontSize: 10.5, lineHeight: 1.45 }, footer: { fontSize: 8, color: "#71717a" } },
    info: { title: decision.documentTitle, subject: "Юридический результат ПравоПоиска" }
  };
  return new Promise<Blob>((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBlob(resolve); } catch (error) { reject(error); }
  });
}
