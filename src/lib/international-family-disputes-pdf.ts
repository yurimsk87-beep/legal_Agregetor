import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT } from "@/data/international-family-disputes-legal-review";
import type { InternationalFamilyDisputesDecision } from "@/lib/international-family-disputes-validator";

export function buildInternationalFamilyDisputesPdfText(result: InternationalFamilyDisputesDecision) {
  return [result.resultLabel, result.documentTitle, "Готово к подаче: нет", ...result.notices,
    "Подготовленные сведения", ...result.preparedData.map((item) => `${item.label}: ${item.value}`),
    "Что собрать", ...result.evidence, "Что делать дальше", ...result.nextSteps].join("\n");
}

export async function createInternationalFamilyDisputesPdfBlob(result: InternationalFamilyDisputesDecision) {
  if (!result.pdfAvailable) throw new Error("Missing critical answers");
  const [pdfMakeModule, vfsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void })
    .addVirtualFileSystem(vfsModule.default as unknown as Record<string, string>);
  const content: Content[] = [
    { text: result.resultLabel, style: "eyebrow" }, { text: result.documentTitle, style: "title" },
    { text: "Готово к подаче: нет. Требуется международная юридическая проверка.", style: "warning" },
    ...result.notices.map((text) => ({ text, margin: [0, 0, 0, 6] }) as Content),
    { text: "Подготовленные сведения", style: "heading" }, { ul: result.preparedData.map((item) => `${item.label}: ${item.value}`) },
    { text: "Что собрать", style: "heading" }, { ul: result.evidence },
    { text: "Что делать дальше", style: "heading" }, { ol: result.nextSteps }
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4", pageMargins: [42, 48, 42, 60],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.35, color: "#18181b" },
    footer: (page, pages) => ({ margin: [42, 10, 42, 0], columns: [
      { text: `Правовая сверка: ${INTERNATIONAL_FAMILY_DISPUTES_REVIEWED_AT}`, style: "footer" },
      { text: `${page}/${pages}`, alignment: "right", style: "footer" }
    ] }), content,
    styles: { eyebrow: { fontSize: 10, bold: true, color: "#166534", margin: [0, 0, 0, 8] }, title: { fontSize: 20, bold: true, margin: [0, 0, 0, 12] },
      warning: { fontSize: 11, bold: true, color: "#92400e", margin: [0, 0, 0, 12] }, heading: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] }, footer: { fontSize: 8, color: "#71717a" } }
  };
  return new Promise<Blob>((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBlob(resolve); } catch (error) { reject(error); }
  });
}
