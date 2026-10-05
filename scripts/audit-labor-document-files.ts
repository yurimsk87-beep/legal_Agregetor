import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { LABOR_DOCUMENTS, getLaborDocumentScenario } from "@/data/labor-documents";
import { getLaborRulesForArea, LABOR_LEGAL_REVIEWED_AT } from "@/data/labor-legal-sources";
import { buildLaborDocumentExportText, createLaborDocumentDocxBlob, createLaborDocumentPdfBlob, laborDocumentFilename } from "@/lib/labor-document-export";

async function main() {
const failures: string[] = [];
const results: Array<{ slug: string; pdfBytes: number; docxBytes: number }> = [];

for (const document of LABOR_DOCUMENTS) {
  const selected = getLaborDocumentScenario(document.slug);
  assert.ok(selected, `${document.slug}: scenario not found`);
  const rules = getLaborRulesForArea(selected.route.areaId).slice(0, 3);
  const exportData = {
    statusLabel: "ПРОЕКТ — ТРЕБУЕТСЯ ЮРИДИЧЕСКАЯ ПРОВЕРКА",
    documentTitle: document.title,
    documentText: `В ${selected.scenario.authority[0]}\nОт: Тестовый заявитель\n\n${document.title.toUpperCase()}\n\nПодтвержденные обстоятельства изложены в приложенных документах. Прошу рассмотреть обращение и предоставить письменный ответ в установленном порядке.\n\nПриложения: подтверждающие документы.\nДата: 05.10.2026\nПодпись: ____________`,
    rules,
    nextSteps: selected.scenario.nextSteps,
    reviewedAt: LABOR_LEGAL_REVIEWED_AT
  };
  const sourceSnapshot = JSON.stringify(exportData);
  const canonicalText = buildLaborDocumentExportText(exportData);
  if (!canonicalText.includes(document.title) || !canonicalText.includes("Правовые основания") || !canonicalText.includes("Что делать дальше")) {
    failures.push(`${document.slug}: canonical export is incomplete.`);
  }
  const [pdf, docx] = await Promise.all([createLaborDocumentPdfBlob(exportData), createLaborDocumentDocxBlob(exportData)]);
  if (JSON.stringify(exportData) !== sourceSnapshot) failures.push(`${document.slug}: export mutated the generated document version.`);
  const pdfBuffer = Buffer.from(await pdf.arrayBuffer());
  const docxBuffer = Buffer.from(await docx.arrayBuffer());
  if (pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") failures.push(`${document.slug}: invalid PDF signature.`);
  if (docxBuffer.subarray(0, 2).toString("ascii") !== "PK") failures.push(`${document.slug}: invalid DOCX signature.`);
  if (pdfBuffer.length < 1000) failures.push(`${document.slug}: PDF is unexpectedly small.`);
  if (docxBuffer.length < 1000) failures.push(`${document.slug}: DOCX is unexpectedly small.`);
  if (!laborDocumentFilename(document.slug, "pdf").endsWith("-proekt.pdf")) failures.push(`${document.slug}: unsafe PDF filename.`);
  results.push({ slug: document.slug, pdfBytes: pdfBuffer.length, docxBytes: docxBuffer.length });
}

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "FAIL" : "PASS",
  documentsChecked: results.length,
  pdfFilesValid: results.filter(({ pdfBytes }) => pdfBytes >= 1000).length,
  docxFilesValid: results.filter(({ docxBytes }) => docxBytes >= 1000).length,
  canonicalContentParity: failures.every((failure) => !failure.includes("canonical export")),
  failures,
  results
};

await writeFile(path.join(process.cwd(), "docs", "labor-document-file-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
assert.deepEqual(failures, []);
console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
