import assert from "node:assert/strict";
import { createParentalRightsRestrictionDocxBlob } from "../src/lib/parental-rights-restriction-docx";
import { buildParentalRightsRestrictionPdfText, createParentalRightsRestrictionPdfBlob } from "../src/lib/parental-rights-restriction-pdf";
import { validateParentalRightsRestriction } from "../src/lib/parental-rights-restriction-validator";

async function run() {
  const decision = validateParentalRightsRestriction("court", { immediateDanger: "no", targetRecordedParent: "yes", childStatus: "minor", applicantRole: "parent", childLeftDangerous: "yes", dangerSource: "objective", objectiveReason: "health", facts: "Подтверждаемые факты", evidence: "Акты", applicantData: "Заявитель", respondentData: "Ответчик", childData: "Ребёнок", courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes", existingSupport: "no", supportDetails: "Алименты ранее не установлены" });
  assert.equal(decision.filingReady, false);
  assert.match(buildParentalRightsRestrictionPdfText(decision), /НЕ ГОТОВ К ПОДАЧЕ|Готово к подаче: нет/);
  const [pdf, docx] = await Promise.all([createParentalRightsRestrictionPdfBlob(decision), createParentalRightsRestrictionDocxBlob(decision.draftText)]);
  assert.equal(pdf.size > 1000, true);
  assert.equal(docx.size > 1000, true);
  console.log(`Parental-rights restriction document audit passed: PDF ${pdf.size}, DOCX ${docx.size}.`);
}

void run();

