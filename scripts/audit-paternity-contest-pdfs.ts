import assert from "node:assert/strict";
import { createPaternityContestDocxBlob } from "../src/lib/paternity-contest-docx";
import { buildPaternityContestPdfText, createPaternityContestPdfBlob } from "../src/lib/paternity-contest-pdf";
import { validatePaternityContest } from "../src/lib/paternity-contest-validator";

async function run() {
  const decision = validatePaternityContest("recorded-parent", { recordTarget: "father", recordBasis: "marriage", applicantData: "Заявитель", recordedParentData: "Записанный отец", childData: "Ребёнок", otherParticipants: "Мать", circumstances: "Обстоятельства", evidence: "Доказательства", dnaExpectation: "yes", courtRegion: "region-moscow", courtName: "Районный суд", courtSource: "https://example.sudrf.ru/", courtConfirmed: "yes" });
  assert.equal(decision.filingReady, false);
  assert.match(buildPaternityContestPdfText(decision), /Готово к подаче: нет/);
  const [pdf, docx] = await Promise.all([createPaternityContestPdfBlob(decision), createPaternityContestDocxBlob(decision.draftText)]);
  assert.equal(pdf.size > 1000, true);
  assert.equal(docx.size > 1000, true);
  console.log(`Paternity-contest document audit passed: PDF ${pdf.size}, DOCX ${docx.size}.`);
}
void run();
