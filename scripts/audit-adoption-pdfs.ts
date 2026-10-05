import assert from "node:assert/strict";
import { buildAdoptionPdfText, createAdoptionPdfBlob } from "../src/lib/adoption-pdf";
import { validateAdoption } from "../src/lib/adoption-validator";

async function run() {
  const decision = validateAdoption("domestic", {
    russianResident: "yes",
    childStatusConfirmed: "yes",
    candidateConclusion: "yes",
    applicantData: "Иванова Анна, подтверждённые сведения",
    childData: "Иванов Пётр, сведения о ребёнке и семье",
    childAge: "under-10",
    eligibilityChecked: "yes",
    region: "region-moscow",
    circumstances: "Обстоятельства и интересы ребёнка"
  });
  assert.equal(decision.filingReady, false);
  assert.match(buildAdoptionPdfText(decision), /Готово к подаче: нет/);
  assert.match(buildAdoptionPdfText(decision), /Иванова Анна/);
  const pdf = await createAdoptionPdfBlob(decision);
  assert.equal(pdf.size > 1000, true);
  console.log(`Adoption document audit passed: PDF ${pdf.size}.`);
}

void run();
