import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { LaborLegalRule } from "@/data/labor-legal-sources";

export type LaborDocumentExport = {
  statusLabel: string;
  documentTitle: string;
  documentText: string;
  rules: LaborLegalRule[];
  nextSteps: string[];
  reviewedAt: string;
};

export function buildLaborDocumentExportText(result: LaborDocumentExport) {
  return [
    result.statusLabel,
    result.documentTitle,
    "",
    result.documentText,
    "",
    "Правовые основания",
    ...result.rules.map((rule) => `${rule.act}, ${rule.provisions.join(", ")}: ${rule.statement}`),
    "",
    "Что делать дальше",
    ...result.nextSteps.map((step, index) => `${index + 1}. ${step}`)
  ].join("\n");
}

export async function createLaborDocumentPdfBlob(result: LaborDocumentExport) {
  const [pdfMakeModule, vfsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default;
  (pdfMake as typeof pdfMake & { addVirtualFileSystem: (files: Record<string, string>) => void }).addVirtualFileSystem(vfsModule.default as unknown as Record<string, string>);
  const content: Content[] = [
    { text: result.statusLabel, style: "status" },
    { text: result.documentTitle, style: "title" },
    { text: result.documentText, style: "document" },
    { text: "Правовые основания", style: "heading" },
    { ul: result.rules.map((rule) => `${rule.act}, ${rule.provisions.join(", ")}: ${rule.statement}`) },
    { text: "Что делать дальше", style: "heading" },
    { ol: result.nextSteps }
  ];
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [48, 50, 48, 62],
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.35, color: "#18181b" },
    footer: (page, pages) => ({ margin: [48, 10, 48, 0], columns: [{ text: `Правовая сверка: ${result.reviewedAt}`, style: "footer" }, { text: `${page}/${pages}`, alignment: "right", style: "footer" }] }),
    content,
    styles: {
      status: { fontSize: 10, bold: true, color: "#92400e", margin: [0, 0, 0, 8] },
      title: { fontSize: 18, bold: true, margin: [0, 0, 0, 14] },
      document: { fontSize: 10, lineHeight: 1.45 },
      heading: { fontSize: 13, bold: true, margin: [0, 16, 0, 7] },
      footer: { fontSize: 8, color: "#71717a" }
    }
  };
  return new Promise<Blob>((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBlob(resolve); } catch (error) { reject(error); }
  });
}

export async function createLaborDocumentDocxBlob(result: LaborDocumentExport) {
  const paragraphs = [
    new Paragraph({ children: [new TextRun({ text: result.statusLabel, bold: true })] }),
    new Paragraph({ text: result.documentTitle, heading: HeadingLevel.TITLE }),
    ...result.documentText.split(/\n/).map((text) => new Paragraph({ text })),
    new Paragraph({ text: "Правовые основания", heading: HeadingLevel.HEADING_2 }),
    ...result.rules.map((rule) => new Paragraph({ text: `${rule.act}, ${rule.provisions.join(", ")}: ${rule.statement}`, bullet: { level: 0 } })),
    new Paragraph({ text: "Что делать дальше", heading: HeadingLevel.HEADING_2 }),
    ...result.nextSteps.map((step) => new Paragraph({ text: step, numbering: { reference: "steps", level: 0 } }))
  ];
  const document = new Document({
    numbering: { config: [{ reference: "steps", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "left" }] }] },
    sections: [{ properties: {}, children: paragraphs }]
  });
  return Packer.toBlob(document);
}

export function laborDocumentFilename(slug: string, extension: "pdf" | "docx") {
  return `${slug}-proekt.${extension}`;
}
