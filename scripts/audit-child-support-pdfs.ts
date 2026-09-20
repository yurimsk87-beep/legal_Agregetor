import assert from "node:assert/strict";
import { createChildSupportDocxBlob } from "../src/lib/child-support-docx";
import { buildChildSupportPdfText, createChildSupportPdfBlob } from "../src/lib/child-support-pdf";
import { validateChildSupport } from "../src/lib/child-support-validator";

async function main() {
  const people = { applicantData: "Иванова Ирина, адрес", payerData: "Иванов Иван, дата и место рождения, адрес", childData: "Иванов Пётр, 01.01.2018", childLivesWithApplicant: "yes" };
  const decision = validateChildSupport("first", { childMinor: "yes", paternityRecorded: "yes", paternityDispute: "no", international: "no", existingInstrument: "no", otherInterested: "no", paymentMethod: "share", payerIncomeStable: "yes", ...people, requestedSupport: "Взыскать алименты в доле", courtName: "Судебный участок № 1", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" });
  assert.equal(decision.allowed, true);
  assert.equal(decision.filingReady, false);
  assert.match(buildChildSupportPdfText(decision), /ЧЕРНОВИК — НЕ ГОТОВ К ПОДАЧЕ/);
  const [pdf, docx] = await Promise.all([createChildSupportPdfBlob(decision), createChildSupportDocxBlob(decision.draftText)]);
  assert.ok(pdf.size > 1000);
  assert.ok(docx.size > 1000);
  console.log(`Child-support PDF/DOCX audit passed: ${pdf.size} PDF bytes, ${docx.size} DOCX bytes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
