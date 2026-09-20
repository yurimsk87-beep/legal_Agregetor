import assert from "node:assert/strict";
import { createParentalRightsDeprivationDocxBlob } from "../src/lib/parental-rights-deprivation-docx";
import { buildParentalRightsDeprivationPdfText, createParentalRightsDeprivationPdfBlob } from "../src/lib/parental-rights-deprivation-pdf";
import { validateParentalRightsDeprivation } from "../src/lib/parental-rights-deprivation-validator";

async function run() {
  const decision = validateParentalRightsDeprivation("court", { immediateDanger: "no", targetRecordedParent: "yes", childStatus: "minor", applicantRole: "parent", ground: "cruelty", facts: "Подтверждаемые факты", evidence: "Акты", applicantData: "Заявитель", respondentData: "Ответчик", childData: "Ребёнок", courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" });
  assert.equal(decision.filingReady, false);
  assert.match(buildParentalRightsDeprivationPdfText(decision), /НЕ ГОТОВ К ПОДАЧЕ|Готово к подаче: нет/);
  const [pdf, docx] = await Promise.all([createParentalRightsDeprivationPdfBlob(decision), createParentalRightsDeprivationDocxBlob(decision.draftText)]);
  assert.equal(pdf.size > 1000, true);
  assert.equal(docx.size > 1000, true);
  console.log(`Parental-rights deprivation document audit passed: PDF ${pdf.size}, DOCX ${docx.size}.`);
}

void run();
