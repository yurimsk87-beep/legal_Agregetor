import assert from "node:assert/strict";
import { createPaternityEstablishmentDocxBlob } from "../src/lib/paternity-establishment-docx";
import { buildPaternityEstablishmentPdfText, createPaternityEstablishmentPdfBlob } from "../src/lib/paternity-establishment-pdf";
import { validatePaternityEstablishment } from "../src/lib/paternity-establishment-validator";

async function run() {
  const decision = validatePaternityEstablishment("court", { existingFatherRecord: "no", childAge: "minor", applicantRole: "parent", motherData: "Мать", fatherData: "Отец", childData: "Ребёнок", applicantData: "Заявитель", respondentData: "Ответчик", evidence: "Доказательства", courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" });
  assert.equal(decision.filingReady, false);
  assert.match(buildPaternityEstablishmentPdfText(decision), /Готово к подаче: нет/);
  const [pdf, docx] = await Promise.all([createPaternityEstablishmentPdfBlob(decision), createPaternityEstablishmentDocxBlob(decision.draftText)]);
  assert.equal(pdf.size > 1000, true);
  assert.equal(docx.size > 1000, true);
  console.log(`Paternity-establishment document audit passed: PDF ${pdf.size}, DOCX ${docx.size}.`);
}
void run();
