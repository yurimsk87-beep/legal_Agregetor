import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { PARENTS_CHILD_REVIEWED_AT } from "@/data/parents-child-legal-review";
import type { ParentsChildDecision } from "@/lib/parents-child-validator";

export function getParentsChildPdfFilename(outcomeKey: string) {
  return `${outcomeKey}.pdf`;
}

export function buildParentsChildPdfText(decision: ParentsChildDecision) {
  return [
    decision.resultLabel,
    decision.documentTitle,
    `Готово к подаче: ${decision.filingReady ? "да" : "нет"}`,
    ...decision.notices,
    "",
    "Подготовленные сведения:",
    ...decision.preparedData.map((item) => `- ${item.label}: ${item.value}`),
    "",
    "Что делать дальше:",
    ...decision.filingSteps.map((item, index) => `${index + 1}. ${item}`),
    ...(decision.draftText ? ["", decision.draftText] : [])
  ].join("\n");
}

export async function createParentsChildPdfBlob(decision: ParentsChildDecision) {
  if (!decision.pdfAvailable || decision.resultKind === "urgent") throw new Error("PDF недоступен для срочного результата.");
  const [pdfMakeModule, vfsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default;
  const vfs = vfsModule.default as unknown as Record<string, string>;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfs);
  const content: Content[] = [
    { text: decision.resultLabel, style: "eyebrow" },
    { text: decision.documentTitle, style: "title" },
    { text: decision.filingReady ? "Результат можно использовать по инструкции." : "НЕ ГОТОВ К ПОДАЧЕ. Проверьте результат до использования.", style: "warning" },
    ...decision.notices.map((text) => ({ text, margin: [0, 0, 0, 6] }) as Content),
    { text: "Подготовленные сведения", style: "heading" },
    { ul: decision.preparedData.map((item) => `${item.label}: ${item.value}`) },
    { text: "Что делать дальше", style: "heading" },
    { ol: decision.filingSteps },
    ...(decision.draftText ? [{ text: "Текст результата", style: "heading" } as Content, { text: decision.draftText, style: "draft" } as Content] : [])
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 60],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.35, color: "#18181b" },
    footer: (page, pages) => ({ margin: [42, 10, 42, 0], columns: [{ text: `Правовая сверка: ${PARENTS_CHILD_REVIEWED_AT}`, style: "footer" }, { text: `${page}/${pages}`, alignment: "right", style: "footer" }] }),
    content,
    styles: {
      eyebrow: { fontSize: 10, bold: true, color: "#166534", margin: [0, 0, 0, 8] },
      title: { fontSize: 20, bold: true, margin: [0, 0, 0, 12] },
      warning: { fontSize: 11, bold: true, color: decision.filingReady ? "#166534" : "#92400e", margin: [0, 0, 0, 12] },
      heading: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] },
      draft: { fontSize: 9, lineHeight: 1.4, margin: [0, 0, 0, 12] },
      footer: { fontSize: 8, color: "#71717a" }
    }
  };
  return new Promise<Blob>((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBlob(resolve); } catch (error) { reject(error); }
  });
}
