import { Document, Packer, Paragraph, TextRun } from "docx";

type DownloadGeneratedDocumentDocxParams = {
  title: string;
  fileName: string;
  content: string;
};

type DownloadGeneratedDocumentPdfParams = {
  title: string;
  content: string;
};

const BOLD_LINE_PATTERNS = [/^ПРОШУ:$/i, /^Приложения:$/i, /^Дата:/i, /^Подпись:/i];

export async function downloadGeneratedDocumentDocx({ title, fileName, content }: DownloadGeneratedDocumentDocxParams): Promise<void> {
  const safeFileName = ensureDocxExtension(fileName);
  const blob = await buildGeneratedDocumentDocxBlob({ title, fileName, content });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = safeFileName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function buildGeneratedDocumentDocxBlob({ title, content }: DownloadGeneratedDocumentDocxParams): Promise<Blob> {
  const paragraphs = [
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28
        })
      ]
    }),
    ...content.split(/\r?\n/).map((line) => buildParagraph(line))
  ];

  const document = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });

  return Packer.toBlob(document);
}

export function downloadGeneratedDocumentPdf({ title, content }: DownloadGeneratedDocumentPdfParams): void {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
  if (!printWindow) throw new Error("PDF print window was blocked");

  printWindow.document.write(`<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { margin: 18mm; }
      body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; }
      h1 { font-size: 20px; margin: 0 0 18px; }
      pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <pre>${escapeHtml(content)}</pre>
    <script>window.addEventListener("load", () => window.print());</script>
  </body>
</html>`);
  printWindow.document.close();
}

function buildParagraph(line: string) {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: "" })]
    });
  }

  const isBoldLine = BOLD_LINE_PATTERNS.some((pattern) => pattern.test(trimmedLine));

  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: line,
        bold: isBoldLine,
        size: 24
      })
    ]
  });
}

function ensureDocxExtension(fileName: string) {
  const safeName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const fallbackName = safeName || "document";
  return fallbackName.endsWith(".docx") ? fallbackName : `${fallbackName}.docx`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
