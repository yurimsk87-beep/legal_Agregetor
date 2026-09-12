import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { CHILD_SUPPORT_REVIEWED_AT } from "@/data/child-support-legal-review";
import type { ChildSupportDecision } from "@/lib/child-support-validator";

export function getChildSupportPdfFilename(outcomeKey: string) {
  return `${outcomeKey}.pdf`;
}

export function buildChildSupportPdfText(decision: ChildSupportDecision) {
  return [decision.resultLabel, decision.documentTitle, `Готово к подаче: ${decision.filingReady ? "да" : "нет"}`, ...decision.notices, "", "Подготовленные сведения:", ...decision.preparedData.map((item) => `- ${item.label}: ${item.value}`), "", "Что делать дальше:", ...decision.filingSteps.map((item, index) => `${index + 1}. ${item}`), ...(decision.draftText ? ["", decision.draftText] : [])].join("\n");
}

export async function createChildSupportPdfBlob(decision: ChildSupportDecision) {
  if (!decision.pdfAvailable) throw new Error("PDF недоступен.");
  const [pdfMakeModule, vfsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfsModule.default as unknown as Record<string, string>);
  const content: Content[] = [
    { text: decision.resultLabel, style: "eyebrow" },
    { text: decision.documentTitle, style: "title" },
    { text: decision.filingReady ? "Результат можно использовать по инструкции." : "НЕ ГОТОВ К ПОДАЧЕ. Проверьте статус и дальнейшие шаги.", style: "warning" },
    ...decision.notices.map((text) => ({ text, margin: [0, 0, 0, 6] }) as Content),
    { text: "Подготовленные сведения", style: "heading" },
    { ul: decision.preparedData.map((item) => `${item.label}: ${item.value}`) },
    { text: "Что делать дальше", style: "heading" },
    { ol: decision.filingSteps },
    ...(decision.draftText ? [{ text: "Текст результата", style: "heading" } as Content, { text: decision.draftText, style: "draft" } as Content] : [])
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4", pageMargins: [42, 48, 42, 60], defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.35, color: "#18181b" },
    footer: (page, pages) => ({ margin: [42, 10, 42, 0], columns: [{ text: `Правовая сверка: ${CHILD_SUPPORT_REVIEWED_AT}`, style: "footer" }, { text: `${page}/${pages}`, alignment: "right", style: "footer" }] }),
    content,
    styles: { eyebrow: { fontSize: 10, bold: true, color: "#166534", margin: [0, 0, 0, 8] }, title: { fontSize: 20, bold: true, margin: [0, 0, 0, 12] }, warning: { fontSize: 11, bold: true, color: "#92400e", margin: [0, 0, 0, 12] }, heading: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] }, draft: { fontSize: 9, lineHeight: 1.4 }, footer: { fontSize: 8, color: "#71717a" } }
  };
  return new Promise<Blob>((resolve, reject) => { try { pdfMake.createPdf(definition).getBlob(resolve); } catch (error) { reject(error); } });
}
