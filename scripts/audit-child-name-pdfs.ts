import assert from "node:assert/strict";
import { buildChildNamePdfText, createChildNamePdfBlob } from "../src/lib/child-name-pdf";
import { validateChildName } from "../src/lib/child-name-validator";

async function run() {
  const decision = validateChildName("fourteen-to-seventeen", {
    age: "14-17",
    element: "multiple",
    fullCapacity: "no",
    representativeConsent: "yes",
    childData: "Иванов Пётр, запись о рождении от 01.02.2010",
    currentName: "Иванов Пётр Иванович",
    requestedName: "Петров Пётр Сергеевич",
    reason: "Личное решение несовершеннолетнего"
  });
  assert.equal(decision.outcomeKey, "form-20-data-sheet");
  assert.equal(decision.filingReady, false);
  assert.match(buildChildNamePdfText(decision), /Подготовленные сведения/);
  assert.match(buildChildNamePdfText(decision), /Иванов Пётр/);
  const pdf = await createChildNamePdfBlob(decision);
  assert.equal(pdf.size > 1000, true);
  console.log(`Child-name document audit passed: PDF ${pdf.size}.`);
}

void run();
